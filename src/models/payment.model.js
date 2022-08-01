import mongoose from "mongoose";
const { Schema, model } = mongoose;

const paymentSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    agentCode: { type: Number },
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
    amount: { type: Number },
    date: { type: Date, default: Date.now() },
  },
  {
    collection: "payments",
    timestamps: true,
  }
);

export default model("Payment", paymentSchema);
