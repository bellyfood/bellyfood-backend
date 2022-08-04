import express from "express";
import passport from "passport";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const authRouter = express.Router();

authRouter.post("/login", UserController.login);

authRouter.post("/logout", UserController.logout);

authRouter.route("/create").post(UserController.createCustomer);

export default authRouter;
