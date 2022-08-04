import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    agentCode: { type: Number, required: true },
    gender: {
      type: String,
      required: true,
      enum: ["F", "M"],
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    packageDetails: {
      name: {
        type: String,
        required: true,
        enum: ["NANO", "MICRO", "MEGA", "GIGA", "OGA NA BOSS"],
      },
      price: { type: Number, required: true },
    },
    amountPaid: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    date: { type: Date, default: Date.now() },
    roles: {
      type: [String],
      required: true,
      enum: ["CUSTOMER", "ADMIN", "SUPERADMIN"],
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export default model("User", userSchema);
