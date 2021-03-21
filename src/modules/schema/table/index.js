const { gql, AuthenticationError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { schemaTableSchema, schemaTableCollection } = require("./model");
const { getCollection } = require("../../../lib/dbutils");

const typeDefs = gql`
  extend type Query {
    schemaTableById(id: ID!): SchemaTable
    allSchemaTable: [SchemaTable]
    searchSchemaTable(text: String): [SchemaTable]
  }

  extend type Mutation {
    addSchemaTable(payload: SchemaTablePayload): SchemaTable
    deleteSchemaTable(id: ID!): SchemaTable
  }

  input SchemaTablePayload {
    id: String
    schemaId: String
    name: String
    description: String
  }

  type SchemaTable {
    id: ID!
    schemaId: String
    name: String
    description: String
    createdAt: DateScalar
    updatedAt: DateScalar
  }

  extend type Schema {
    table: [SchemaTable]
  }
`;

const resolvers = {
  Query: {
    schemaTableById: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      response = await model.findById(id);
      return response;
    },
    allSchemaTable: async (_, __, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      const response = await model.find();
      return response;
    },
    searchSchemaTable: async (_, { text }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      if (!text) {
        return [];
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      const res = await model.find({
        name: { $regex: new RegExp(text, "ig") },
      });

      return res;
    },
  },

  Schema: {
    table: {
      resolve: async (parent, _args, { space, user }) => {
        if (!space || !user) {
          return new AuthenticationError(
            "Not authorized to access this content"
          );
        }

        const model = getCollection(
          space,
          schemaTableCollection,
          schemaTableSchema
        );
        return await model.find({ schemaId: parent.id });
      },
    },
  },

  Mutation: {
    addSchemaTable: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      let schemaTableResponse;

      if (args.payload.id) {
        existingSchemaTable = await model.findById(args.payload.id);
        schemaTableResponse = await model.findByIdAndUpdate(
          args.payload.id,
          args.payload,
          { new: true }
        );
      } else {
        const data = new model(args.payload);
        schemaTableResponse = await data.save();
      }
      return schemaTableResponse;
    },
    deleteSchemaTable: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );

      const res = await model.findByIdAndDelete(id);

      return res;
    },
  },
};

module.exports = { typeDefs, resolvers };
