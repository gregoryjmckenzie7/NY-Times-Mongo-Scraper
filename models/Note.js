// Require Mongoose
var mongoose = require("mongoose");
// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Create new note Schema
var NoteSchema = new Schema({
    body: {
        type: String
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: "Article"
    }
});

// Create a model from the above schema, using mongooes's model method

var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;
