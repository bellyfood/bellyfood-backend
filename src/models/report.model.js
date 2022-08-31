import mongoose from "mongoose";
const { Schema, model } = mongoose;

const reportSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agentName: { type: String },
    details: { type: String },
  },
  { collection: "reports", timestamps: true }
);

export default model("Report", reportSchema);
