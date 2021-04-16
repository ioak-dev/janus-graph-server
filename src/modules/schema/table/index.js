const { gql, AuthenticationError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { schemaTableSchema, schemaTableCollection } = require("./model");
const { getCollection } = require("../../../lib/dbutils");
const { generateTableReference } = require("./service");

const typeDefs = gql`
  extend type Query {
    schemaTableById(id: ID!): SchemaTable
    allSchemaTable: [SchemaTable]
    allSchemaTableBySchemaId(schemaId: ID!): [SchemaTable]
    searchSchemaTable(text: String): [SchemaTable]
  }

  extend type Mutation {
    updateSchemaTable(payload: SchemaTablePayload): SchemaTable
    deleteSchemaTable(idList: [ID!]): SchemaTableDeleteResponse
  }

  input SchemaTablePayload {
    id: String
    schemaId: String
    reference: String
    name: String
    description: String
  }

  type SchemaTable {
    id: ID!
    schemaId: String
    reference: String
    name: String
    description: String
    createdAt: DateScalar
    updatedAt: DateScalar
  }

  extend type Schema {
    table: [SchemaTable]
  }

  type SchemaTableDeleteResponse {
    idList: [ID!]
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
    allSchemaTableBySchemaId: async (_, { schemaId }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      const response = await model.find({ schemaId });
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
    updateSchemaTable: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );
      let schemaTableResponse;
      let reference = args.payload.name.substring(0, 4).toUpperCase();

      if (args.payload.id) {
        if (
          !args.payload.reference ||
          !args.payload.reference.startsWith(reference)
        ) {
          reference = await generateTableReference(space, reference);
        }
        existingSchemaTable = await model.findById(args.payload.id);
        schemaTableResponse = await model.findByIdAndUpdate(
          args.payload.id,
          { ...args.payload, reference },
          { new: true }
        );
      } else {
        reference = await generateTableReference(space, reference);
        const data = new model({ ...args.payload, reference });
        schemaTableResponse = await data.save();
      }
      return schemaTableResponse;
    },
    deleteSchemaTable: async (_, { idList }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableCollection,
        schemaTableSchema
      );

      const res = await model.deleteMany({ _id: { $in: idList } });

      return { idList };
    },
  },
};

module.exports = { typeDefs, resolvers };
