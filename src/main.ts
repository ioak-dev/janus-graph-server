if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}

const { ApolloServer } = require("apollo-server-express");
import { authorize } from "./middlewares";
import mongoose from "mongoose";
import { initializeSequences } from "./startup";
const express = require("express");
const cors = require("cors");

const gqlScalarSchema = require("./modules/gql-scalar");
const sessionSchema = require("./modules/session");
const userSchema = require("./modules/user");
const schemaSchema = require("./modules/schema");
const schemaTableSchema = require("./modules/schema/table");
const schemaTableDataSchema = require("./modules/schema/table/data");
const schemaTableColumnSchema = require("./modules/schema/table/column");
const schemaTableColumnChoiceSchema = require("./modules/schema/table/column/choice");
const schemaTableFilterSchema = require("./modules/schema/table/filter");
const activitySchema = require("./modules/activity");

const databaseUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
mongoose.connect(databaseUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.pluralize(undefined);

const app = express();

const server = new ApolloServer({
  typeDefs: [
    gqlScalarSchema.typeDefs,
    sessionSchema.typeDefs,
    userSchema.typeDefs,
    schemaSchema.typeDefs,
    schemaTableSchema.typeDefs,
    schemaTableColumnSchema.typeDefs,
    schemaTableColumnChoiceSchema.typeDefs,
    schemaTableDataSchema.typeDefs,
    schemaTableFilterSchema.typeDefs,
    activitySchema.typeDefs,
  ],
  resolvers: [
    gqlScalarSchema.resolvers,
    sessionSchema.resolvers,
    userSchema.resolvers,
    schemaSchema.resolvers,
    schemaTableSchema.resolvers,
    schemaTableColumnSchema.resolvers,
    schemaTableColumnChoiceSchema.resolvers,
    schemaTableDataSchema.resolvers,
    schemaTableFilterSchema.resolvers,
    activitySchema.resolvers,
  ],
  context: ({ req, res }: any) => {
    const authString = req.headers.authorization || "";
    const authParts = authString.split(" ");
    let token = "";
    let user = null;
    let space = "";
    if (authParts.length === 2) {
      token = authParts[1];
      space = authParts[0];
      user = authorize(token);
    }
    return { user, token, space };
  },
  introspection: true,
  playground: true,
});

server.applyMiddleware({ app });

app.use(cors());

app.get("/hello", (_: any, res: any) => {
  res.send(
    "basic connection to server works. database connection is not validated"
  );
  res.end();
});

app.use((_: any, res: any) => {
  res.status(200);
  res.send("Hello!");
  res.end();
});

app.listen({ port: process.env.PORT || 4000 }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${
      server.graphqlPath
    }`
  )
);

// server
//   .listen({ port: process.env.PORT || 4000 })
//   .then(({ url }: any) => console.log(`Server started at ${url}`));

// Server startup scripts
initializeSequences();
