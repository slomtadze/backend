const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const requestAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "User is not authorized" });
  }

  const token = authorization.split(" ")[1];
  try {
    const { _id } = jwt.verify(token, process.env.SECRET);

    req.user = await User.findOne({ _id }).select("_id");

    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const requestAdmin = async (req, res, next) => {
  const { _id } = req.user;

  try {
    const userRole = await User.findOne({ _id }).select("role");

    console.log("RequestAdmin", userRole);

    if (userRole.role === 0) {
      console.log("Matched Role 0");
      return res.status(403).json("Requires admin level");
    }

    if (userRole.role === 1) {
      console.log("Matched role 1");
      next();
    }
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};

module.exports = { requestAuth, requestAdmin };
