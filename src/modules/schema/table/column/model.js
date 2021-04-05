var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaTableColumnSchema = new Schema(
  {
    tableId: { type: String },
    name: { type: String },
    datatype: { type: String },
    meta: { type: Object },
  },
  { timestamps: true, minimize: false }
);

const schemaTableColumnCollection = "schema.table.column";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaTableColumnSchema, schemaTableColumnCollection };
