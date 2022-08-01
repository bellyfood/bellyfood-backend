import express from "express";
import passport from "passport";
import PaymentController from "../controllers/payment.controller";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const paymentRouter = express.Router();

paymentRouter.route("/create").post(Auth.isAdmin, PaymentController.addPayment);

export default paymentRouter;
