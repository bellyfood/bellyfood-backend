import express from "express";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.route("/me").get(UserController.me);

userRouter.route("/get").get(Auth.isAdmin, UserController.getUser);

userRouter.route("/customers").get(Auth.isAdmin, UserController.getCustomers);

userRouter.route("/locations").get(UserController.getLocations);

userRouter.route("/packages").get(UserController.getPackages);

userRouter.route("/search").get(Auth.isAdmin, UserController.searchByName);

userRouter.route("/delivery/history").get(UserController.getDeliveryHistory);

userRouter
  .route("/history")
  .get(Auth.isAdmin, UserController.getDailyHistoryByCode);

userRouter.route("/approve").post(Auth.isAdmin, UserController.approveCustomer);

userRouter.route("/payments").get(UserController.getPaymentDetails);

userRouter.route("/renew").get(UserController.renewPackage);

userRouter.route("/change").get(UserController.changePackage);

userRouter.route("/delete").get(UserController.deleteCustomer);

export default userRouter;
