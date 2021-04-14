var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaTableDataSchema = new Schema(
  {
    tableId: { type: String },
    reference: { type: Number },
    row: { type: Object },
  },
  { timestamps: true }
);

const schemaTableDataCollection = "schema.table.data";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaTableDataSchema, schemaTableDataCollection };
