import * as dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { createServer } from "http";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import bodyParser from "body-parser";
import express from "express";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import cors from "cors";
import typeDefs from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const wsServerCleanup = useServer({ schema }, wsServer);

const apolloServer = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),

    {
      async serverWillStart() {
        return {
          async drainServer() {
            await wsServerCleanup.dispose();
          },
        };
      },
    },
  ],
});

await apolloServer.start();
app.use("/graphql", bodyParser.json(), expressMiddleware(apolloServer));

mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    httpServer.listen(process.env.PORT || 4000, () => {
      console.log(
        `🚀 Query endpoint ready at http://localhost:${process.env.PORT}/graphql`
      );
      console.log(
        `🚀 Subscription endpoint ready at ws://localhost:${process.env.PORT}/graphql`
      );
    });
  })
  .catch((error) => {
    throw new Error("Can't connect to Db");
  });
