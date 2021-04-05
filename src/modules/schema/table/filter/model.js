var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaTableFilterSchema = new Schema(
  {
    tableId: { type: String },
    name: { type: String },
    search: { type: Object },
    sort: { type: Object },
  },
  { timestamps: true }
);

const schemaTableFilterCollection = "schema.table.filter";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { schemaTableFilterSchema, schemaTableFilterCollection };
