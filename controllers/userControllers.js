const User = require("../models/userModel");

var jwt = require("jsonwebtoken");

const generateToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "1h" });
};

// Login

const logIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.logIn(email, password);

    const token = generateToken(user._id);

    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//SignUp

const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.signUp(email, password);

    const token = generateToken(user._id);

    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { logIn, signUp };
