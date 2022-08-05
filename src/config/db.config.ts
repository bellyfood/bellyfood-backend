import "dotenv/config";
import mongoose from "mongoose";

class Config {
  static connection: string;
  static async connect() {
    if (process.env.NODE_ENV === "production") {
      this.connection = process.env.DATABASE_URL!;
    } else {
      this.connection = process.env.DEV_DB_URL!;
    }
    try {
      await mongoose.connect(this.connection);
      console.log("Database Connected");
    } catch (error) {
      console.log("Error connecting to database");
      throw error;
    }
  }

  static getConnectionString() {
    return this.connection;
  }

  static async disconnect() {
    await mongoose.disconnect();
  }
}

export default Config;
