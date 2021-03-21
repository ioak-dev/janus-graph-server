var mongoose = require("mongoose");
const { gql, AuthenticationError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { schemaTableDataSchema, schemaTableDataCollection } = require("./model");
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

const typeDefs = gql`
  extend type Query {
    schemaTableDataById(tableId: ID!, id: ID!): SchemaTableData
    allSchemaTableData(tableId: ID!): [SchemaTableData]
    searchSchemaTableData(
      pageSize: Int
      pageNo: Int
      tableId: ID!
      filter: [SchemaTableColumnFilter]
      sort: [SchemaTableColumnSort]
    ): SchemaTableDataPaginated
    lookupTest(tableId: ID!): [TestSchema]
  }

  type TestSchema {
    id: ID!
    tableId: ID!
    row: JSON
    reference: JSON
  }

  extend type Mutation {
    addSchemaTableData(payload: SchemaTableDataPayload): SchemaTableData
    deleteSchemaTableData(id: ID!): SchemaTableData
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
`;

const resolvers = {
  Query: {
    schemaTableDataById: async (_, { tableId, id }, { space, user }) => {
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
      console.log("****");
      console.log(aggregatePipeline);
      const response = await model.aggregate(aggregatePipeline);
      // .sort({ "reference.u.row.60525362eae0b04bc07ab88d": -1 });
      console.log("***");
      console.log(response);
      if (response.length === 0) return null;
      return response[0];
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
      console.log(queryVariables);
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
      { pageSize = 0, pageNo = 0, tableId, filter = [], sort = [] },
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
      const res = await model
        .find(filter.length > 0 ? { $and: buildFilterCondition(filter) } : {})
        .sort(buildSortCondition(sort))
        .skip(pageNo * pageSize)
        .limit(pageSize);

      return {
        results: res,
        pageNo: res.length === pageSize ? pageNo + 1 : pageNo,
        hasMore: res.length === pageSize ? true : false,
      };
    },
    lookupTest: async (_, { tableId }, { space, user }) => {
      const response = await getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      )
        .aggregate([
          {
            $match: {
              tableId,
            },
          },
          {
            $set: {
              foreign_key: {
                $toObjectId: "$row.6052532eeae0b04bc07ab88b",
              },
            },
          },
          {
            $lookup: {
              from: schemaTableDataCollection,
              localField: "foreign_key",
              foreignField: "_id",
              as: "reference.u",
            },
          },
          {
            $lookup: {
              from: schemaTableDataCollection,
              localField: "foreign_key",
              foreignField: "_id",
              as: "reference.d",
            },
          },
          {
            $set: {
              id: "$_id",
              "reference.id": "$reference._id",
            },
          },
        ])
        .sort({ "reference.u.row.60525362eae0b04bc07ab88d": -1 });
      return response;
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
      return response;
    },
    deleteSchemaTableData: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );

      const res = await model.findByIdAndDelete(id);

      return res;
    },
  },
};

module.exports = { typeDefs, resolvers };
