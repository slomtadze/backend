import * as dotenv from "dotenv"
import User from "../models/userModel.js"
import bcrypt from "bcrypt"
import { PubSub } from "graphql-subscriptions";
import jwt from "jsonwebtoken"

dotenv.config()

const pubsub = new PubSub();


const resolvers = {
  Query: {},
  Subscription: {
    userCountUpdated: {
      subscribe: () => pubsub.asyncIterator(["USER_COUNT_UPDATED"]), 
      
    },
  },
  Mutation: {
    checkUser: async (_, { input }) => {
      const { token } = input;

      if (!token) {
        throw new Error("User is not authorized");
      }
      try {
        const decoded = jwt.verify(token, process.env.SECRET);        
        const user = await User.findOne({ _id: decoded.userId });        
        if (!user) {
          throw new Error("User does not exist")
        }        
        return {user};
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new Error("Session has expired. Please login.");
        }
        throw new Error(error.message);
      }
    },
    signup: async (_, { input }) => {
      try {
        const { name, email, password } = input;
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          throw new Error("Email already in use");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        });

        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, process.env.SECRET, {
          expiresIn: process.env.EXP_TIME,
        });

        return { token, user: newUser };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    login: async (_, { input }) => {
      try {
        const { email, password } = input;

        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("User does not exist");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        user.count += 1;

        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
          expiresIn: process.env.EXP_TIME,
        });
        return { token, user };
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
