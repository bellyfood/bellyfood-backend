import express from "express";
import UserController from "../controllers/user.controller";
import Auth from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.route("/me").get(UserController.me);

userRouter.route("/get").get(Auth.isAdmin, UserController.getUser);

userRouter.route("/customers").get(Auth.isAdmin, UserController.getCustomers);

userRouter
  .route("/locations")
  .post(UserController.addLocation)
  .put(UserController.editLocation)
  .delete(UserController.deleteLocation);

userRouter.route("/search").get(Auth.isAdmin, UserController.searchByName);

userRouter.route("/delivery/history").get(UserController.getDeliveryHistory);

userRouter
  .route("/history")
  .get(Auth.isAdmin, UserController.getDailyHistoryByCode);

userRouter.route("/approve").post(Auth.isAdmin, UserController.approveCustomer);

userRouter.route("/payments").get(UserController.getPaymentDetails);

userRouter.route("/renew").post(UserController.renewPackage);

userRouter.route("/change").post(UserController.changePackage);

userRouter.route("/delete").delete(UserController.deleteCustomer);

userRouter
  .route("/agents")
  .post(Auth.isAdmin, UserController.createAgent)
  .put(Auth.isAdmin, UserController.editAgent)
  .delete(Auth.isAdmin, UserController.deleteAgent);

userRouter
  .route("/agents/customers")
  .get(Auth.isAdmin, UserController.getAgentCustomers)
  .put(Auth.isSuperAdmin, UserController.changeCustomerAgent);

export default userRouter;
