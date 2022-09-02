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

superRouter
  .route("/admins")
  .get(Auth.isSuperAdmin, UserController.getAdmins)
  .delete(Auth.isSuperAdmin, UserController.deleteAdmin);

superRouter
  .route("/admins/password")
  .put(Auth.isSuperAdmin, UserController.changeAdminPassword);

superRouter
  .route("/agents/password")
  .put(Auth.isSuperAdmin, UserController.changeAgentPassword);

superRouter
  .route("/admin/disable")
  .post(Auth.isSuperAdmin, UserController.disableAdmin);

superRouter
  .route("/admin/enable")
  .post(Auth.isSuperAdmin, UserController.enableAdmin);

superRouter
  .route("/deliver")
  .post(Auth.isSuperAdmin, UserController.deliverToUser);

superRouter
  .route("/payments")
  .put(Auth.isSuperAdmin, UserController.editPayment);

superRouter
  .route("/customers")
  .put(Auth.isSuperAdmin, UserController.editCustomer);

superRouter
  .route("/history")
  .get(Auth.isSuperAdmin, UserController.getHistoryByDay);

superRouter
  .route("/report")
  .get(Auth.isSuperAdmin, UserController.generateMonthlyReport);

export default superRouter;
