var mongoose = require("mongoose");

const Schema = mongoose.Schema;
const activitySchema = new Schema(
  {
    domain: { type: String },
    operation: { type: String },
    fields: { type: Array },
    parentReference: { type: String },
    reference: { type: JSON },
    userId: { type: String },
  },
  { timestamps: true, minimize: false }
);

const activityCollection = "activity";

// module.exports = mongoose.model('bookmarks', articleSchema);
module.exports = { activitySchema, activityCollection };
