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
  buildSortCondition,
  setVariables,
  lookupConditions,
} = require("./QueryBuilder");
const {
  schemaTableColumnCollection,
  schemaTableColumnSchema,
} = require("../column/model");

const { getRecordById } = require("./service");

const typeDefs = gql`
  extend type Query {
    schemaTableDataById(tableId: ID!, id: ID!): SchemaTableData
    allSchemaTableData(tableId: ID!): [SchemaTableData]
    searchSchemaTableData(
      pageSize: Int
      pageNo: Int
      tableId: ID!
      anonymousFilter: JSON
      filterId: String
    ): SchemaTableDataPaginated
  }

  extend type Mutation {
    addSchemaTableData(payload: SchemaTableDataPayload): SchemaTableData
    deleteSchemaTableData(idList: [ID!]): SchemaTableDataDeleteResponse
  }

  type TestSchema {
    id: ID!
    tableId: ID!
    row: JSON
    reference: JSON
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
    tableId: ID!
    row: JSON
    relation: JSON
  }

  type SchemaTableDataDeleteResponse {
    idList: [ID!]
  }
`;

const resolvers = {
  Query: {
    schemaTableDataById: async (_, { tableId, id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      return await getRecordById(space, tableId, id);
    },
    allSchemaTableData: async (_, { tableId }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
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
      // .sort({ "reference.u.row.60525362eae0b04bc07ab88d": -1 });
      // console.log("***");
      // console.log(response);
      return response;
    },
    searchSchemaTableData: async (
      _,
      { pageSize = 10, pageNo = 0, tableId, filterId, anonymousFilter },
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
      console.log(filterCondition);
      aggregatePipeline.push({
        $match: {
          $and: [
            {
              tableId: tableId,
            },
            filterCondition,
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
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );
      let response;

      if (args.payload.id) {
        existingData = await model.findById(args.payload.id);
        response = await model.findByIdAndUpdate(
          args.payload.id,
          args.payload,
          { new: true }
        );
      } else {
        const data = new model(args.payload);
        response = await data.save();
      }
      return await getRecordById(space, response.tableId, response.id);
    },
    deleteSchemaTableData: async (_, { idList }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );

      const res = await model.deleteMany({ _id: { $in: idList } });

      return { idList };
    },
  },
};

module.exports = { typeDefs, resolvers };
