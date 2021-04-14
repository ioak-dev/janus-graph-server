const { gql, AuthenticationError } = require("apollo-server-express");
const { activityCollection, activitySchema } = require("./model");
const { getCollection } = require("../../lib/dbutils");

const typeDefs = gql`
  extend type Query {
    activity(
      domains: [String]
      parentReference: String
      references: [String]
    ): [Activity]
  }

  type Activity {
    id: ID!
    fields: JSON
    domain: String
    operation: String
    parentReference: String
    reference: JSON
    userId: String
    createdAt: String
  }
`;

const resolvers = {
  Query: {
    activity: async (
      _,
      { domains, parentReference, references },
      { space, user }
    ) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, activityCollection, activitySchema);
      const conditions = [];
      if (domains && domains.length > 0) {
        conditions.push({ domain: { $in: domains } });
      }
      if (parentReference) {
        conditions.push({ parentReference: { $in: parentReference } });
      }
      if (references && references.length > 0) {
        conditions.push({ reference: { $in: references } });
      }
      response = await model.find({
        $and: conditions,
      });
      return response;
    },
  },
};

module.exports = { typeDefs, resolvers };
