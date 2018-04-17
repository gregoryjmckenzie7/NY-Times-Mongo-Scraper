// Require Mongoose
var mongoose = require("mongoose");
var Note = require("./Note");

// Save a reference to the Schema Constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new Article Schema object
var ArticleSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    saved: {
        type: Boolean,
        required: false
    },
    notes: [{
        type: Schema.Types.ObjectId,
        ref: "Note"
    }]
});

// Create a model from the schema using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
