var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaSchema = new Schema(
  {
    reference: { type: String },
    name: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const schemaCollection = "schema";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaSchema, schemaCollection };
