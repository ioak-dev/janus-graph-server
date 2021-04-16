var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaTableSchema = new Schema(
  {
    reference: { type: String },
    schemaId: { type: String },
    name: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const schemaTableCollection = "schema.table";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaTableSchema, schemaTableCollection };
