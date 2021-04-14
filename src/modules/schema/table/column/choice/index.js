const { gql, AuthenticationError } = require("apollo-server-express");
const {
  schemaTableColumnChoiceSchema,
  schemaTableColumnChoiceCollection,
} = require("./model");
const { getCollection } = require("../../../../../lib/dbutils");
const typeDefs = gql`
  type SchemaTableColumnChoice {
    id: ID!
    tableId: ID
    columnId: ID
    value: String
    color: Int
    icon: JSON
    createdAt: DateScalar
    updatedAt: DateScalar
  }

  extend type SchemaTableColumn {
    options: [SchemaTableColumnChoice]
  }
`;

const resolvers = {
  SchemaTableColumn: {
    options: async ({ _id, tableId, datatype }, args, { space, user }) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      if (datatype !== "list") {
        return [];
      }
      const model = getCollection(
        space,
        schemaTableColumnChoiceCollection,
        schemaTableColumnChoiceSchema
      );
      console.log(await model.find({ columnId: _id, tableId }));
      return await model.find({ columnId: _id, tableId });
    },
  },
};

module.exports = { typeDefs, resolvers };
