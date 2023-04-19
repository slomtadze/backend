const mongoose = require("mongoose");

const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("user", userSchema);
