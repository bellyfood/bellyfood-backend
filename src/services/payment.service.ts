import PaymentModel from "../models/payment.model";
import { AddPayment } from "../typings";
import HistoryService from "./history.service";
import UserService from "./user.service";

class PaymentService {
  static async addPayment({ phone, amount }: AddPayment) {
    try {
      const { foundUser, status, msg } = await UserService.getUserBy(
        "phone",
        phone,
        "CUSTOMER"
      );
      if (!foundUser) return { msg, status };
      const newPayment = await PaymentModel.create({
        customerId: foundUser._id,
        location: foundUser.location,
        packageNames: foundUser.packageNames,
        amount,
        agentCode: foundUser.agentCode || 12345,
      });
      foundUser.amountPaid += amount;
      if (foundUser.amountPaid == foundUser.totalPrice) {
        foundUser.paid = true;
      }
      foundUser.lastPayment = new Date();
      await foundUser.save();
      const { status: status2, msg: msg2 } =
        await HistoryService.addPaymentToHistory(newPayment._id.toString());
      if (status2 !== 201) return { msg2, status: status2 };
      return { msg: "Payment added successfully", status: 201, newPayment };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getPayment(paymentId: string) {
    try {
      const foundPayment = await PaymentModel.findOne({
        _id: paymentId,
      });
      if (!foundPayment) return { msg: "Not found", status: 404 };
      return { msg: "Payment found", status: 200, foundPayment };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
}

export default PaymentService;
