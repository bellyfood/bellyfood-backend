import "dotenv/config";
import mongoose from "mongoose";

class Config {
  static async connect() {
    let connection;
    if (process.env.NODE_ENV === "production") {
      connection = process.env.DATABASE_URL;
    }
    connection = process.env.DEV_DB_URL;
    try {
      await mongoose.connect(connection!);
      console.log("Database Connected");
    } catch (error) {
      console.log("Error connecting to database");
      throw error;
    }
  }

  static async disconnect() {
    await mongoose.disconnect();
  }
}

export default Config;
