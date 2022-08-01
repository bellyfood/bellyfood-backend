import express from "express";
import passport from "passport";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.route("/me").get(UserController.me);

userRouter.route("/get").get(Auth.isAdmin, UserController.getUser);

userRouter.route("/customers").get(Auth.isAdmin, UserController.getCustomers);

userRouter.route("/approve").post(Auth.isAdmin, UserController.approveCustomer);

export default userRouter;
