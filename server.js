// Depenencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Requiring all models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = process.env.PORT || 8080;

// Initialize Express
var app = express();

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submmissions
app.use(bodyParser.urlencoded({ extended: false}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
// mongoose.Promise = Promise;
// mongoose.connect("mongodb://heroku_6m9xjmh:e54cu4ed1lmitpp431a16tk161@ds153198.mlab.com:53198/heroku_6m9qxjmh");



// var db = mongoose.connection;

// db.on("error", function(err) {
//     console.log("Mongoose Error: ", err);
// });

// db.once("open", function() {
//     console.log("Mongoose connection succesfull.")
// });

// Require handlebars
var exphbs= require("express-handlebars");
app.engine("handlebars", exphbs({ 
    defaultLayout: "main",
    partialsDir: path.join(__dirname, '/views/layouts/partials')
    }));
app.set("view engine", "handlebars");


//GET requests to render Handlebars pages
app.get("/", function (req, res) {
    Article.find({ "saved": false }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    });
});

app.get("/saved", function (req, res) {
    Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

// A GET route for scraping the ny times website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    request("http://www.nytimes.com/", function (error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("h2").text();
            result.summary = $(this).children(".summary").text();
            result.link = $(this).children("h2").children("a").attr("href");

            // Create a new Article using the `result` object built from scraping
            var entry = new Article(result);
                entry.save(function(err, doc) {
                    // Log errors
                    if (err) {
                        console.log(err);
                    }
                    // Or log the doc
                    else {
                        console.log(doc);
                    }    
                });
        });

        // If we were able to successfully scrape and save an Article, send a message to the client
        res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    Article.find({}, function(error, doc) {
        // Log errors
        if (error) {
            console.log(error);
        }
        // If we were able to successfully find Articles, send them back to the client
        else {
            res.json(doc);
        }
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .exec(function(error, doc) {
            // Log errors
            if (error) {
                console.log(error);
            }
            // or send the doc to the browser
            else {
                res.json(doc);
            }
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
        // Create a new note and pass the req.body to the entry
        Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": true})
        .exec(function(err, doc) {
            // log errors
            if (err) {
                console.log(err);
            }
            // Or send the doc to the browser
            else {
                res.send(doc);
            }
    });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
    Article.findOneAndUpdate({ "id": req.params.id}, {"saved": false, "notes": []})
        .exec(function (err, doc) {
            // log errors
            if (err) {
                console.log(err);
            }
            // Or send the doc to the browser
            else {
                res.send(doc);
            }
    });    
});

// Create a Note
app.post("/notes/save/:id", function(req, res) {
    // Create a note and pass the requested body to the entry
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    // Save the note to the db
    newNote.save(function(error, note) {
        if (error) {
            console.log(error);
        }
        else {
            // Find and update note
            Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
            .exec(function(err) {
                // Log errors
                if (err) {
                    console.log(err);
                }
                // Or send the doc to the browser
                else {
                    res.send(note);
                }
            });
        }
    });
});

// Delete a Note
app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    // Find the note and delete it
    Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
            .exec(function(err) {
                //Log errors
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    // Or send the note to the browser
                    res.send("Note Deleted");
                }
            });
        }
    });
});



// Start the server
app.listen(PORT, function () {
    console.log(`This application is running on port: ${PORT}`);
});