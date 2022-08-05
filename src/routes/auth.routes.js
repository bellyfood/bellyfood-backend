import express from "express";
import UserController from "../controllers/user.controller";
const authRouter = express.Router();

authRouter.post("/login", UserController.login);

authRouter.post("/logout", UserController.logout);

authRouter.route("/create").post(UserController.createCustomer);

export default authRouter;
