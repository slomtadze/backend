import mongoose from "mongoose";

const Schema = mongoose.Schema;

const authSchema = new Schema({
  refreshToken: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required:true
  }
});

export default mongoose.model("refreshToken", authSchema);