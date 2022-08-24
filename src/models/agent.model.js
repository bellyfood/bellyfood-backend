import mongoose from "mongoose";
const { Schema, model } = mongoose;

const agentSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { collection: "agents", timestamps: true }
);

agentSchema.index({ name: "text" });
export default model("Agent", agentSchema);
