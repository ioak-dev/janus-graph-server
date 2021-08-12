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
const { template } = require("lodash");

export const getRecordByIdOrReference = async (
  space,
  tableId,
  id,
  reference
) => {
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
  const condition = {};
  if (id) {
    condition._id = mongoose.Types.ObjectId(id);
  } else {
    condition.reference = reference;
  }
  aggregatePipeline.push({
    $match: {
      tableId,
      ...condition,
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

const _getComputedField = async (space, columnMap, currentColumn, rowData) => {
  const variables = {};
  for (let i = 0; i < currentColumn.meta.variables.length; i++) {
    const item = currentColumn.meta.variables[i];
    const dependentTableId = item.tableId || currentColumn.tableId;
    variables[item.name] = await _pullDependentColumnValue(
      space,
      columnMap,
      dependentTableId,
      item.columnId,
      rowData
    );
  }
  return template(currentColumn.meta.template)(variables);
};

const _pullDependentColumnValue = async (
  space,
  columnMap,
  tableId,
  columnId,
  rowData
) => {
  if (!rowData) {
    return null;
  }
  const columnHeader = columnMap[tableId][columnId];
  switch (columnHeader.datatype) {
    case "text":
      return rowData.row[columnHeader.id];

    case "list":
      return rowData.row[columnHeader.id];

    case "relation":
      const foreignRecord = await _pullRecord(
        space,
        columnHeader.meta.tableId,
        rowData.row[columnHeader.id]
      );
      const res = await _pullDependentColumnValue(
        space,
        columnMap,
        columnHeader.meta.tableId,
        columnHeader.meta.columnId,
        foreignRecord && foreignRecord.length > 0 ? foreignRecord[0] : null
      );
      return res;
    default:
      return null;
  }
};

const _pullRecord = async (space, tableId, id) => {
  // console.log(tableId, id);
  const model = getCollection(
    space,
    schemaTableDataCollection,
    schemaTableDataSchema
  );
  const res = await model.find({
    tableId,
    _id: mongoose.Types.ObjectId(id),
  });
  // console.log(res);
  return res;
};

export const resolveComputedFields = async (space, payload) => {
  const schemaTableColumnModel = getCollection(
    space,
    schemaTableColumnCollection,
    schemaTableColumnSchema
  );
  const schemaTableColumnList = await schemaTableColumnModel.find({});

  const schemaTableColumnMap = {};
  schemaTableColumnList.forEach((item) => {
    if (!schemaTableColumnMap[item.tableId]) {
      schemaTableColumnMap[item.tableId] = {};
    }
    schemaTableColumnMap[item.tableId][item.id] = item;
  });

  const currentTableColumnList = schemaTableColumnList.filter(
    (item) => item.tableId === payload.tableId
  );

  for (let i = 0; i < currentTableColumnList.length; i++) {
    const currentColumn = currentTableColumnList[i];
    if (currentColumn.datatype === "computed") {
      payload.row[currentColumn.id] = await _getComputedField(
        space,
        schemaTableColumnMap,
        currentColumn,
        payload
      );
    }
  }

  return payload;
};
