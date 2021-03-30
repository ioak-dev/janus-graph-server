const { gql, AuthenticationError } = require("apollo-server-express");
const {
  schemaTableColumnSchema,
  schemaTableColumnCollection,
} = require("./model");
const {
  schemaTableDataSchema,
  schemaTableDataCollection,
} = require("../data/model");
const { getCollection } = require("../../../../lib/dbutils");

const typeDefs = gql`
  extend type Query {
    schemaTableColumnById(id: ID!): SchemaTableColumn
    allSchemaTableColumn(tableId: ID!): [SchemaTableColumn]
  }

  extend type Mutation {
    updateSchemaTableColumn(
      payload: [SchemaTableColumnPayload]
    ): [SchemaTableColumn]
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
    updateSchemaTableColumn: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );
      const dataModel = getCollection(
        space,
        schemaTableDataCollection,
        schemaTableDataSchema
      );
      const responses = [];

      // Remove deleted columns
      const validIdList = args.payload
        .map((item) => item.id)
        .filter((item) => item);
      const deleteResult = await model.find({ _id: { $nin: validIdList } });
      await model.deleteMany({
        $and: [
          { _id: { $nin: validIdList } },
          { tableId: args.payload[0].tableId },
        ],
      });
      const deletedIdList = deleteResult.map((item) => item.id);

      // Remove data stored against deleted columns
      const updateObject = {};
      deletedIdList.forEach((item) => (updateObject[`row.${item}`] = 1));
      const updateResult = await dataModel.updateMany(
        {
          tableId: args.payload[0].tableId,
        },
        { $unset: updateObject },
        { multi: true, upsert: true }
      );

      // Insert or update valid columns list
      for (let payload of args.payload) {
        if (payload.id) {
          existingData = await model.findById(payload.id);
          const response = await model.findByIdAndUpdate(payload.id, payload, {
            new: true,
          });
          responses.push(response);
        } else {
          const data = new model(payload);
          const response = await data.save();
          responses.push(response);
        }
      }

      return responses;
    },
  },
};

module.exports = { typeDefs, resolvers };
