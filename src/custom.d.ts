import { User as AppUser } from "./typings";
import { Express } from "express";

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}

declare module "otp-generator";
