var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaSchema = new Schema(
  {
    name: { type: String },
  },
  { timestamps: true }
);

const schemaCollection = "schema";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaSchema, schemaCollection };
