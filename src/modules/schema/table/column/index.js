const { gql, AuthenticationError } = require("apollo-server-express");
const {
  schemaTableColumnSchema,
  schemaTableColumnCollection,
} = require("./model");
const { schemaTableSchema, schemaTableCollection } = require("../model");
const {
  schemaTableDataSchema,
  schemaTableDataCollection,
} = require("../data/model");
const { getCollection } = require("../../../../lib/dbutils");
const {
  addCreateLog,
  addEditLog,
  addDeleteLog,
} = require("../../../activity/service");
const { updateChoices } = require("./service");

const typeDefs = gql`
  extend type Query {
    schemaTableColumnById(id: ID!): SchemaTableColumn
    allSchemaTableColumn(tableId: ID!): [SchemaTableColumn]
    allSchemaTableColumnBySchemaId(schemaId: ID!): [SchemaTableColumn]
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
    options: JSON
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
    allSchemaTableColumnBySchemaId: async (
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
      const schemaTableResponse = await schemaTableModel.find({ schemaId });

      const tableIdList = schemaTableResponse.map((item) => item.id);

      const model = getCollection(
        space,
        schemaTableColumnCollection,
        schemaTableColumnSchema
      );
      const response = await model.find({ tableId: { $in: tableIdList } });
      return response;
    },
  },

  Mutation: {
    updateSchemaTableColumn: async (_, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      await updateChoices(space, args.payload);
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

      if (deletedIdList.length > 0) {
        await addDeleteLog(
          space,
          user,
          "column",
          args.payload[0].tableId,
          deletedIdList
        );
      }

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
          const existingData = await model.findById(payload.id);
          const response = await model.findByIdAndUpdate(payload.id, payload, {
            new: true,
          });
          responses.push(response);
          await addEditLog(
            space,
            user,
            "column",
            payload,
            existingData._doc,
            response.tableId
          );
        } else {
          const data = new model(payload);
          const response = await data.save();
          responses.push(response);
          await addCreateLog(
            space,
            user,
            "column",
            response.tableId,
            response.id
          );
        }
      }

      return responses;
    },
  },
};

module.exports = { typeDefs, resolvers };
