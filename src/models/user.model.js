import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    agentCode: { type: Number },
    gender: {
      type: String,
      enum: ["F", "M"],
    },
    phone: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    location: {
      type: String,
    },
    packageDetails: {
      name: {
        type: String,
        enum: ["NANO", "MICRO", "MEGA", "GIGA", "OGA NA BOSS"],
      },
      price: { type: String },
    },
    amountPaid: { type: Number, default: 0 },
    approved: { type: Boolean },
    date: { type: Date, default: Date.now() },
    roles: {
      type: [String],
      enum: ["CUSTOMER", "ADMIN", "SUPERADMIN"],
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export default model("User", userSchema);
