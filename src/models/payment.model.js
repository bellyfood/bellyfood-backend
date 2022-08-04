import mongoose from "mongoose";
const { Schema, model } = mongoose;

const paymentSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agentCode: { type: Number, required: true },
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
      price: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now() },
  },
  {
    collection: "payments",
    timestamps: true,
  }
);

export default model("Payment", paymentSchema);
