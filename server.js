const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");


const mongoose = require("mongoose");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const User = require("./models/userModel.js")

const { createServer } = require("http");
const { ApolloServerPluginDrainHttpServer } = require ('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } =require('@graphql-tools/schema');
const { WebSocketServer } =require('ws');
const { useServer }= require('graphql-ws/lib/use/ws');

const app = express();

app.use(express.json());

const startServer = async () => {

  const httpServer = createServer(app); 
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    subscriptions: {
      path: "http://localhost:4000/graphql/subscriptions", // specify the path for WebSocket subscriptions
      onConnect: () => {
        console.log("WebSocket client connected");
      },
      onDisconnect: () => {
        console.log("WebSocket client disconnected");
      },
    },
    context: ({ req, res }) => ({
      pubsub, // Pass the pubsub object to the context
    }),
  });
  
  const changeStream = User.watch();

changeStream.on("change", async (change) => {
  if (change.operationType === "insert") {
    try {
     const updatedUserCount = await User.countDocuments()
     if(updatedUserCount !==null){
      console.log(updatedUserCount)
      /* pubsub.publish("USER_COUNT_UPDATED", { userCountUpdated: updatedUserCount }) */
      return {updatedUserCount}
     }
     
    } catch (error) {
      throw new Error(error.message)
    }
    
  }
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
