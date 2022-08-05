import express from "express";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const superRouter = express.Router();

superRouter
  .route("/create")
  .post(Auth.isSuperAdmin, UserController.createAdmin);

superRouter
  .route("/admin")
  .get(Auth.isSuperAdmin, UserController.getAdminByCode);

superRouter.route("/admins").get(Auth.isSuperAdmin, UserController.getAdmins);

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
