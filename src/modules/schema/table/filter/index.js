const { gql, AuthenticationError } = require("apollo-server-express");
const {
  schemaTableFilterSchema,
  schemaTableFilterCollection,
} = require("./model");
const { schemaTableSchema, schemaTableCollection } = require("../model");
const { getCollection } = require("../../../../lib/dbutils");

const typeDefs = gql`
  extend type Query {
    schemaTableFilterById(id: ID!): SchemaTableFilter
    allSchemaTableFilter(tableId: ID!): [SchemaTableFilter]
    allSchemaTableFilterBySchemaId(schemaId: ID!): [SchemaTableFilter]
  }

  extend type Mutation {
    updateSchemaTableFilter(
      payload: SchemaTableFilterPayload
    ): SchemaTableFilter
  }

  input SchemaTableFilterPayload {
    id: String
    tableId: String
    name: String
    search: JSON
    sort: JSON
  }

  type SchemaTableFilter {
    id: ID!
    tableId: String
    name: String
    search: JSON
    sort: JSON
  }
`;

const resolvers = {
  Query: {
    schemaTableFilterById: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableFilterCollection,
        schemaTableFilterSchema
      );
      response = await model.findById(id);
      return response;
    },
    allSchemaTableFilter: async (_, { tableId }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableFilterCollection,
        schemaTableFilterSchema
      );
      const response = await model.find({ tableId });
      return response;
    },
    allSchemaTableFilterBySchemaId: async (
      _,
      { schemaId },
      { space, user }
    ) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const schemaTableModel = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      const schemaTableResponse = await schemaTableModel.find({
        schemaId,
      });

      const tableIdList = schemaTableResponse.map((item) => item.id);

      const model = getCollection(
        space,
        schemaTableFilterCollection,
        schemaTableFilterSchema
      );
      const response = await model.find({ tableId: { $in: tableIdList } });
      return response;
    },
  },

  Mutation: {
    updateSchemaTableFilter: async (_, { payload }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableFilterCollection,
        schemaTableFilterSchema
      );
      if (payload.id) {
        existingData = await model.findById(payload.id);
        return await model.findByIdAndUpdate(payload.id, payload, {
          new: true,
        });
      } else {
        const data = new model(payload);
        return await data.save();
      }
    },
  },
};

module.exports = { typeDefs, resolvers };
