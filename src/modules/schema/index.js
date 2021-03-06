const { gql, AuthenticationError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { schemaSchema, schemaCollection } = require("./model");
const { getCollection } = require("../../lib/dbutils");
const { generateSchemaReference } = require("./service");

const typeDefs = gql`
  scalar DateScalar
  extend type Query {
    schemaById(id: ID!): Schema
    allSchema: [Schema]
    searchSchema(text: String): [Schema]
  }

  extend type Mutation {
    updateSchema(payload: SchemaPayload): Schema
    deleteSchema(idList: [ID!]): SchemaDeleteResponse
  }

  input SchemaPayload {
    id: String
    reference: String
    name: String
    description: String
  }

  type Schema {
    id: ID!
    reference: String
    name: String
    description: String
    createdAt: DateScalar
    updatedAt: DateScalar
  }

  extend type SchemaTable {
    schema: Schema
  }

  type SchemaDeleteResponse {
    idList: [ID!]
  }
`;

const resolvers = {
  DateScalar: new GraphQLScalarType({
    name: "DateScalar",
    description: "Date custom scalar type",
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(+ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    schemaById: async (_, { id }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, schemaCollection, schemaSchema);
      response = await model.findById(id);
      return response;
    },
    allSchema: async (_, __, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, schemaCollection, schemaSchema);
      const response = await model.find();
      return response;
    },
    searchSchema: async (_, { text }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      if (!text) {
        return [];
      }
      const model = getCollection(space, schemaCollection, schemaSchema);
      const res = await model.find({
        name: { $regex: new RegExp(text, "ig") },
      });

      return res;
    },
  },

  SchemaTable: {
    schema: {
      resolve: async (parent, _args, { space, user }) => {
        if (!space || !user) {
          return new AuthenticationError(
            "Not authorized to access this content"
          );
        }
        const model = getCollection(space, schemaCollection, schemaSchema);
        return await model.findById(parent.schemaId);
      },
    },
  },

  Mutation: {
    updateSchema: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, schemaCollection, schemaSchema);
      let schemaResponse;
      let reference = args.payload.name.substring(0, 4).toUpperCase();

      if (args.payload.id) {
        if (
          !args.payload.reference ||
          !args.payload.reference.startsWith(reference)
        ) {
          reference = await generateSchemaReference(space, reference);
        }
        existingSchema = await model.findById(args.payload.id);
        schemaResponse = await model.findByIdAndUpdate(
          args.payload.id,
          { ...args.payload, reference },
          { new: true }
        );
      } else {
        reference = await generateSchemaReference(space, reference);
        const data = new model({ ...args.payload, reference });
        schemaResponse = await data.save();
      }
      return schemaResponse;
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

    deleteSchema: async (_, { idList }, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, schemaCollection, schemaSchema);

      const res = await model.deleteMany({ _id: { $in: idList } });

      return { idList };
    },
  },
};

module.exports = { typeDefs, resolvers };
