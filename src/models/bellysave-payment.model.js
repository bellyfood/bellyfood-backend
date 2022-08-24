import mongoose from "mongoose";
const { Schema, model } = mongoose;

const bellySavePaymentSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    agentCode: { type: Number, required: true },
    location: {
      type: String,
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now() },
  },
  { collection: "bellysavePayments", timestamps: true }
);

export default model("BellysavePayment", bellySavePaymentSchema);
