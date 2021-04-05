var mongoose = require("mongoose");
const { schemaTableDataSchema, schemaTableDataCollection } = require("./model");
import { getCollection } from "../../../../lib/dbutils";
const {
  buildFilterCondition,
  buildSortCondition,
  setVariables,
  lookupConditions,
} = require("./QueryBuilder");
const {
  schemaTableColumnCollection,
  schemaTableColumnSchema,
} = require("../column/model");

export const getRecordById = async (space, tableId, id) => {
  const model = getCollection(
    space,
    schemaTableDataCollection,
    schemaTableDataSchema
  );
  const schemaTableColumnModel = getCollection(
    space,
    schemaTableColumnCollection,
    schemaTableColumnSchema
  );
  const schemaTableColumnList = await schemaTableColumnModel.find({
    tableId,
  });
  const queryVariables = setVariables(schemaTableColumnList);
  const aggregatePipeline = [];
  aggregatePipeline.push({
    $match: {
      tableId,
      _id: mongoose.Types.ObjectId(id),
    },
  });
  if (queryVariables) {
    aggregatePipeline.push(queryVariables);
  }
  aggregatePipeline.push(
    ...lookupConditions(schemaTableColumnList, schemaTableDataCollection)
  );
  aggregatePipeline.push({
    $set: {
      id: "$_id",
      // "reference.id": "$reference._id",
    },
  });
  const response = await model.aggregate(aggregatePipeline);
  if (response.length === 0) return null;
  return response[0];
};
