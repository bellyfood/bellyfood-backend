import mongoose from "mongoose";
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String },
    roles: {
      type: [String],
      required: true,
      enum: ["CUSTOMER", "ADMIN", "SUPERADMIN"],
    },
  },
  { collection: "notifications", timestamps: true }
);

export default model("Notification", notificationSchema);
