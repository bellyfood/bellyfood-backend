import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    agentCode: { type: Number },
    agentName: { type: String },
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
    },
    packageNames: {
      type: [String],
      enum: ["NANO", "MICRO", "MEGA", "GIGA", "OGA NA BOSS"],
    },
    totalPrice: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, default: Date.now() + 90 * 24 * 60 * 60 * 1000 },
    late: { type: Boolean, default: false },
    inactive: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    date: { type: Date, default: Date.now() },
    lastLogin: { type: Date },
    lastPayment: { type: Date },
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

userSchema.index({ name: "text", phone: "text" });

export default model("User", userSchema);
