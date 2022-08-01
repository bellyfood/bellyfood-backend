import mongoose from "mongoose";
const { Schema, model } = mongoose;

const packageSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["NANO", "MICRO", "MEGA", "GIGA", "OGA NA BOSS"],
    },
    price: {
      type: Number,
    },
  },
  {
    collection: "packages",
    timestamps: true,
  }
);

export default model("Package", packageSchema);
