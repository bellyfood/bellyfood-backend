import mongoose from "mongoose";
const { Schema, model } = mongoose;

const locationSchema = new Schema(
  {
    location: { type: String, unique: true },
  },
  { collection: "locations" }
);

export default model("Location", locationSchema);
