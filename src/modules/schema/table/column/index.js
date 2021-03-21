const { gql, AuthenticationError } = require("apollo-server-express");
const {
  schemaTableColumnSchema,
  schemaTableColumnCollection,
} = require("./model");
const { getCollection } = require("../../../../lib/dbutils");

const typeDefs = gql`
  extend type Query {
    schemaTableColumnById(id: ID!): SchemaTableColumn
    allSchemaTableColumn(tableId: ID!): [SchemaTableColumn]
  }

  extend type Mutation {
    addSchemaTableColumn(payload: SchemaTableColumnPayload): SchemaTableColumn
    deleteSchemaTableColumn(id: ID!): SchemaTableColumn
  }

  input SchemaTableColumnPayload {
    id: String
    tableId: String
    name: String
    datatype: String
    meta: JSON
  }

  type SchemaTableColumn {
    id: ID!
    tableId: String
    name: String
    datatype: String
    meta: JSON
  }
`;

const resolvers = {
  Query: {
    schemaTableColumnById: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );
      response = await model.findById(id);
      return response;
    },
    allSchemaTableColumn: async (_, { tableId }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );
      const response = await model.find({ tableId });
      return response;
    },
  },

  Mutation: {
    addSchemaTableColumn: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
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
    deleteSchemaTableColumn: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );

      const res = await model.findByIdAndDelete(id);

      return res;
    },
  },
};

module.exports = { typeDefs, resolvers };
