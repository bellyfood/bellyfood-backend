import express from "express";
import PaymentController from "../controllers/payment.controller";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";

const bellysaveRouter = express.Router();

bellysaveRouter
  .route("/customers")
  .get(Auth.isAdmin, UserController.getBellysaveCustomers)
  .post(Auth.isAdmin, UserController.createBellysaveCustomer)
  .put(Auth.isAdmin, UserController.editBellysaveCustomer);

bellysaveRouter
  .route("/payments")
  .get(UserController.getBellysavePayments)
  .post(PaymentController.addBellysavePayment);

bellysaveRouter
  .route("/collection/history")
  .get(UserController.getBellysaveCollectionHistory);

bellysaveRouter
  .route("/approve")
  .post(Auth.isAdmin, UserController.approveBellysaveCustomer);

bellysaveRouter
  .route("/pay")
  .post(Auth.isSuperAdmin, UserController.payBellysaveCustomer);

bellysaveRouter
  .route("/renew")
  .post(Auth.isAdmin, UserController.renewBellysaveCustomer);

export default bellysaveRouter;
