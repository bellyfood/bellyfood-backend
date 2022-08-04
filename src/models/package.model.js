import mongoose from "mongoose";
const { Schema, model } = mongoose;

const packageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["NANO", "MICRO", "MEGA", "GIGA", "OGA NA BOSS"],
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "packages",
    timestamps: true,
  }
);

export default model("Package", packageSchema);
