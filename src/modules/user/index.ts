import jwt from "jsonwebtoken";
import { gql, AuthenticationError } from "apollo-server-express";
import { userSchema, userCollection } from "./model";
const { getCollection } = require("../../lib/dbutils");

const typeDefs = gql`
  type Query {
    user: [User]
  }

  type Mutation {
    createEmailAccount(payload: UserPayload): User!
  }

  input UserPayload {
    firstName: String!
    lastName: String!
    email: String!
  }

  type User {
    id: ID!
    firstName: String
    lastName: String
    email: String
    resolver: String
  }
`;

const resolvers = {
  Query: {
    user: async (_: any, { email }: any, { space, user }: any) => {
      if (!space || !user) {
        return new AuthenticationError("Not authorized to access this content");
      }
      const model = getCollection(space, userCollection, userSchema);
      return await model.find();
    },
  },

  Mutation: {
    createEmailAccount: async (_: any, args: any, { space, user }: any) => {
      const model = getCollection(space, userCollection, userSchema);
      const response = await model.findOneAndUpdate(
        { email: args.payload.email, resolver: "email" },
        { ...args.payload, resolver: "email" },
        { upsert: true, new: true, rawResult: true }
      );
      return response.value;
    },
  },
};

export { typeDefs, resolvers };
