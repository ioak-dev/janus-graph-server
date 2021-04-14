var mongoose = require("mongoose");
const {
  schemaTableColumnChoiceSchema,
  schemaTableColumnChoiceCollection,
} = require("./choice/model");
const { getCollection } = require("../../../../lib/dbutils");

export const updateChoices = async (space, columnList) => {
  const conditions = [];
  const choicesDataToInsert = [];
  const choicesDataToUpdate = [];
  for (let i = 0; i < columnList.length; i++) {
    const column = columnList[i];
    const optionIdList = [];
    if (column.options) {
      column.options.forEach((item) => {
        optionIdList.push(mongoose.Types.ObjectId(item.id));
        if (item.id) {
          choicesDataToUpdate.push({
            updateOne: {
              filter: { _id: mongoose.Types.ObjectId(item.id) },
              update: {
                $set: {
                  ...item,
                },
              },
            },
          });
        } else {
          choicesDataToInsert.push({
            insertOne: {
              document: {
                ...item,
                tableId: column.tableId,
                columnId: column.id,
              },
            },
          });
        }
      });
    }
    conditions.push({
      $and: [
        {
          tableId: column.tableId,
          columnId: column.id,
          _id: { $nin: optionIdList },
        },
      ],
    });
  }
  const model = getCollection(
    space,
    schemaTableColumnChoiceCollection,
    schemaTableColumnChoiceSchema
  );
  const deleted = await model.deleteMany({ $or: conditions });
  if (choicesDataToInsert.length > 0 || choicesDataToUpdate.length > 0) {
    const res = await model.bulkWrite([
      ...choicesDataToInsert,
      ...choicesDataToUpdate,
    ]);
  }
};
