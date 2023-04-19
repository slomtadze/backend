require("dotenv").config();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      try {
        const user = await User.findById(id);
        return user;
      } catch (error) {
        throw new Error("Failed to fetch user");
      }
    },
  },
  Mutation: {
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
        console.log(user);
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

module.exports = resolvers;
