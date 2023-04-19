const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const usersRoutes = require("./routes/users");

const app = express();

app.use(express.json());

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  server.applyMiddleware({ app });

  mongoose
    .connect(process.env.MONGO_DB)
    .then(() => {
      console.log("conntected to db succesfully");
      app.listen(process.env.PORT, () => {
        console.log("Connected To Db and Listening 4000");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
startServer().catch((error) => console.log(error.message));
