var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const schemaTableColumnChoiceSchema = new Schema(
  {
    tableId: { type: String },
    columnId: { type: String },
    color: { type: Number },
    value: { type: String },
    icon: { type: Object },
  },
  { timestamps: true, minimize: false }
);

const schemaTableColumnChoiceCollection = "schema.table.column.choice";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = {
  schemaTableColumnChoiceSchema,
  schemaTableColumnChoiceCollection,
};
