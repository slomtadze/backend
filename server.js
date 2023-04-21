import * as dotenv from 'dotenv'
import { ApolloServer } from '@apollo/server';
import { createServer } from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import cors from 'cors'
import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';
import mongoose from 'mongoose';
import User from './models/userModel.js';

dotenv.config()

const pubSub = new PubSub();

/* const mockLongLastingOperation = (name) => {
    setTimeout(() => {
        pubSub.publish('OPERATION_FINISHED', { operationFinished: { name, endDate: new Date().toDateString() } });
    }, 1000);
} */



const app = express();
app.use(cors())
const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
});

const wsServerCleanup = useServer({schema}, wsServer);

const apolloServer = new ApolloServer({
    schema,
    plugins: [
       // Proper shutdown for the HTTP server.
       ApolloServerPluginDrainHttpServer({ httpServer }),

       // Proper shutdown for the WebSocket server.
       {
        async serverWillStart() {
            return {
                async drainServer() {
                    await wsServerCleanup.dispose();
                }
            }
        }
       }
    ]
});

await apolloServer.start();
app.use('/graphql', bodyParser.json(), expressMiddleware(apolloServer));

const changeStream = User.watch();
changeStream.on("change", async (change) => {
  if (change.operationType === "insert" || change.operationType === "delete") {
    try {
     const updatedUserCount = await User.countDocuments()
     if(updatedUserCount !==null){      
        pubSub.publish("USER_COUNT_UPDATED", { userCountUpdated: {updatedUserCount} });
     }
     
    } catch (error) {
      throw new Error(error.message)
    }
    
  }
});


mongoose.connect(process.env.MONGO_DB).then(() => {
    httpServer.listen(process.env.PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${process.env.PORT}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${process.env.PORT}/graphql`);
    });
}).catch(error => {throw new Error("Can't connect to Db")})

