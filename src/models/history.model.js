import mongoose from "mongoose";
const { Schema, model } = mongoose;

const historySchema = new Schema(
  {
    details: {
      type: String,
    },
    type: { type: String, enum: ["creation", "payment"] },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    agentCode: { type: Number },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    location: {
      type: String,
    },
    date: { type: Date, default: Date.now() },
    amountPaid: { type: Number },
  },
  {
    collection: "history",
    timestamps: true,
  }
);

export default model("History", historySchema);
