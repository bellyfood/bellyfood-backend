import express from "express";
import passport from "passport";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const superRouter = express.Router();

superRouter
  .route("/create")
  .post(Auth.isSuperAdmin, UserController.createAdmin);

superRouter
  .route("/deliver")
  .post(Auth.isSuperAdmin, UserController.deliverToUser);

superRouter
  .route("/history")
  .get(Auth.isSuperAdmin, UserController.getHistoryByDay);

superRouter
  .route("/report")
  .get(Auth.isSuperAdmin, UserController.generateMonthlyReport);

export default superRouter;
