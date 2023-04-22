import * as dotenv from "dotenv";
import User from "../models/userModel.js";
import Auth from "../models/authModel.js";
import bcrypt from "bcrypt";
import { PubSub } from "graphql-subscriptions";
import jwt from "jsonwebtoken";

dotenv.config();

const pubsub = new PubSub();

const changeStream = User.watch();

changeStream.on("change", async (change) => {
  if (change.operationType === "insert" || change.operationType === "delete") {
    try {
      const updatedUserCount = await User.countDocuments();
      if (updatedUserCount !== null) {
        pubsub.publish("USER_COUNT_UPDATED", {
          userCountUpdated: updatedUserCount,
        });
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
});

const generateTokens = (_id) => {
  const token = jwt.sign({ userId: _id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "5m",
  });
  const refreshToken = jwt.sign(
    { userId: _id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );

  return { token, refreshToken };
};

const resolvers = {
  Query: {
    userCountUpdated() {
      return updatedUserCount;
    },
  },
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
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
          throw new Error("User does not exist");
        }
        return { user: { name: user.name, _id: user._id, count: user.count } };
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new Error("TokenExpired");
        }
        throw new Error(error.message);
      }
    },
    refreshToken: async (_, { input }) => {
      const { refreshToken } = input;

      if (!refreshToken) {
        throw new Error("Authorization Required");
      }

      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
          throw new Error("Authentication Faild");
        }

        const newToken = jwt.sign(
          { userId: decoded.userId },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "5m",
          }
        );

        return {
          token: newToken,
          user: { name: user.name, _id: user._id, count: user.count },
        };
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new Error("Log In Required");
        } else {
          throw new Error(error.message);
        }
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
        const { token, refreshToken } = generateTokens(newUser._id);

        const newAuth = new Auth({
          refreshToken,
          email,
        });
        await newAuth.save();

        const usersCount = await User.countDocuments();

        if (!usersCount) {
          throw new Error("Users count error");
        }

        return { token, refreshToken, usersCount, user: newUser };
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
        const { token, refreshToken } = generateTokens(user._id);

        const auth = await Auth.findOne({ email });

        if (!auth) {
          const newAuth = new Auth({
            refreshToken,
            email,
          });
          await newAuth.save();
        } else {
          Auth.findOneAndUpdate({ email }, { $set: { refreshToken } });
        }

        return { token, refreshToken, user };
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
