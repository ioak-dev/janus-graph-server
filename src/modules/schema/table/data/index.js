var mongoose = require("mongoose");
const { gql, AuthenticationError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { schemaTableDataSchema, schemaTableDataCollection } = require("./model");
const {
  schemaTableFilterSchema,
  schemaTableFilterCollection,
} = require("../filter/model");
const { getCollection } = require("../../../../lib/dbutils");
const {
  buildFilterCondition,
  buildQuickFilterCondition,
  buildSortCondition,
  setVariables,
  lookupConditions,
} = require("./QueryBuilder");
const {
  schemaTableColumnCollection,
  schemaTableColumnSchema,
} = require("../column/model");
const {
  addCreateLog,
  addEditLog,
  addDeleteLog,
} = require("../../../activity/service");

const {
  getRecordByIdOrReference,
  resolveComputedFields,
} = require("./service");

const { nextval } = require("../../../sequence/service");

const typeDefs = gql`
  extend type Query {
    schemaTableDataById(tableId: ID!, id: ID!): SchemaTableData
    test(tableId: ID, id: ID): TestData
    schemaTableDataByReference(tableId: ID!, reference: Int!): SchemaTableData
    searchSchemaTableData(
      pageSize: Int
      pageNo: Int
      tableId: ID!
      anonymousFilter: JSON
      quickFilter: JSON
      filterId: String
    ): SchemaTableDataPaginated
  }

  extend type Mutation {
    addSchemaTableData(payload: SchemaTableDataPayload): SchemaTableData
    deleteSchemaTableData(
      tableId: ID!
      idList: [ID!]
    ): SchemaTableDataDeleteResponse
  }

  input SchemaTableColumnFilter {
    columnId: String
    value: JSON
  }

  input SchemaTableColumnSort {
    columnId: String
    order: String
  }

  input SchemaTableDataPayload {
    id: String
    tableId: String
    row: JSON
  }

  type SchemaTableDataPaginated {
    pageNo: Int
    hasMore: Boolean
    total: Int
    results: [SchemaTableData]!
  }

  type SchemaTableData {
    id: ID!
    reference: Int
    tableId: ID!
    row: JSON
    relation: JSON
  }

  type SchemaTableDataDeleteResponse {
    idList: [ID!]
  }

  type TestData {
    data: JSON
    tpl: JSON
  }
`;

const resolvers = {
  Query: {
    schemaTableDataById: async (_, { tableId, id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      return await getRecordByIdOrReference(space, tableId, id, null);
    },
    test: async (_, { tableId, id }, { space, user }) => {
      const data = await getRecordByIdOrReference(space, tableId, id, null);
      const derivedProperty = resolveComputedFields();
      return { data, tpl: derivedProperty };
    },
    schemaTableDataByReference: async (
      _,
      { tableId, reference },
      { space, user }
    ) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      return await getRecordByIdOrReference(space, tableId, null, reference);
    },
    searchSchemaTableData: async (
      _,
      {
        pageSize = 10,
        pageNo = 0,
        tableId,
        filterId,
        anonymousFilter,
        quickFilter,
      },
      { space, user }
    ) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );
      const schemaTableFilterModel = getCollection(
        space,
        schemaTableFilterCollection,
        schemaTableFilterSchema
      );
      const schemaTableColumnModel = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );
      const schemaTableColumnList = await schemaTableColumnModel.find({
        tableId: tableId,
      });
      const schemaTableFilterList = await schemaTableFilterModel.find({
        tableId: tableId,
      });
      const queryVariables = setVariables(schemaTableColumnList);
      const aggregatePipeline = [];
      const filterCondition = buildFilterCondition(
        filterId,
        anonymousFilter,
        schemaTableColumnList,
        schemaTableFilterList
      );
      const quickFilterCondition = buildQuickFilterCondition(
        quickFilter,
        schemaTableColumnList
      );
      aggregatePipeline.push({
        $match: {
          $and: [
            {
              tableId: tableId,
            },
            filterCondition,
            quickFilterCondition,
          ],
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
      const res = await model
        .aggregate(aggregatePipeline)
        .skip(pageNo * pageSize)
        .limit(pageSize);
      // .sort({ "reference.u.row.60525362eae0b04bc07ab88d": -1 });
      return {
        results: res,
        pageNo: res.length === pageSize ? pageNo + 1 : pageNo,
        hasMore: res.length === pageSize ? true : false,
      };
    },
  },

  Mutation: {
    addSchemaTableData: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      payload = await resolveComputedFields(space, args.payload);
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );
      let response;

      if (payload.id) {
        existingData = await model.findById(payload.id);
        response = await model.findByIdAndUpdate(payload.id, payload, {
          new: true,
        });
        await addEditLog(
          space,
          user,
          "record",
          payload.row,
          existingData._doc.row,
          response.tableId,
          response.id
        );
      } else {
        const data = new model({
          ...payload,
          reference: `${await nextval("record_reference", "record", space)}`,
        });
        response = await data.save();
        await addCreateLog(
          space,
          user,
          "record",
          response.tableId,
          response.id
        );
      }
      return await getRecordByIdOrReference(
        space,
        response.tableId,
        response.id
      );
    },
    deleteSchemaTableData: async (_, { tableId, idList }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );

      const res = await model.deleteMany({ _id: { $in: idList } });
      await addDeleteLog(space, user, "record", tableId, idList);

      return { idList };
    },
  },
};

module.exports = { typeDefs, resolvers };
