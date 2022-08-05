import express from "express";
import PaymentController from "../controllers/payment.controller";
import Auth from "../middleware/auth.middleware";
const paymentRouter = express.Router();

paymentRouter.route("/create").post(Auth.isAdmin, PaymentController.addPayment);

export default paymentRouter;
