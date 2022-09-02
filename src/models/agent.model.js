import mongoose from "mongoose";
const { Schema, model } = mongoose;

const agentSchema = new Schema(
  {
    phone: { type: String },
    name: { type: String, required: true },
    password: { type: String },
    isAgent: { type: Boolean, default: true },
    lastLogin: { type: Date },
    approved: { type: Boolean, default: true },
  },
  { collection: "agents", timestamps: true }
);

agentSchema.index({ name: "text" });
export default model("Agent", agentSchema);
