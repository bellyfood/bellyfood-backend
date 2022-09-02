import mongoose from "mongoose";
const { Schema, model } = mongoose;

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    amountPaid: { type: Number, default: 0 },
    amountRemoved: { type: Number, default: 0 },
    paying: { type: Boolean, default: true },
    approved: { type: Boolean, default: false },
    bankName: { type: String },
    accountNumber: { type: String },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["F", "M"],
    },
    password: {
      type: String,
      required: true,
    },
    agentCode: { type: Number },
    agentName: { type: String },
    location: {
      type: String,
    },
    isBellysave: { type: Boolean, default: true },
    date: { type: Date, default: Date.now() },
    lastLogin: { type: Date },
    lastPayment: { type: Date },
  },
  { collection: "bellysaveCustomers", timestamps: true }
);

customerSchema.index({ name: "text" });

export default model("Customer", customerSchema);
