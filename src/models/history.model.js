import mongoose from "mongoose";
const { Schema, model } = mongoose;

const historySchema = new Schema(
  {
    // all
    details: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["creation", "payment", "delivery", "completed"],
      required: true,
    },
    agentCode: { type: Number, required: true },
    location: {
      type: String,
      required: true,
    },
    date: { type: Date, default: Date.now() },
    service: { type: String, enum: ["bellyfood", "bellysave"] },

    // creation
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    bellysave: { type: Schema.Types.ObjectId, ref: "Customer" },

    // payment
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    amountPaid: { type: Number },
  },
  {
    collection: "history",
    timestamps: true,
  }
);

export default model("History", historySchema);
