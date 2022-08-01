import PaymentModel from "../models/payment.model";
import UserModel from "../models/user.model";
import { AddPayment } from "../typings";
import UserService from "./user.service";

class PaymentService {
  static async addPayment({ customerId, amount }: AddPayment) {
    try {
      const {
        foundUser,
        status: customerS,
        msg,
      } = await UserService.getCustomer(customerId);
      if (customerS !== 200) return { msg, status: customerS };
      const newPayment = await PaymentModel.create({
        customerId,
        location: foundUser!.location,
        packageDetails: foundUser!.packageDetails,
        amount,
      });
      foundUser!.amountPaid += amount;
      await foundUser!.save();
      return { msg: "Payment added successfully", status: 201, newPayment };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
}

export default PaymentService;
