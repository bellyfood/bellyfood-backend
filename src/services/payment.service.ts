import BellysavePaymentModel from "../models/bellysave-payment.model";
import PaymentModel from "../models/payment.model";
import { AddPayment } from "../typings";
import HistoryService from "./history.service";
import UserService from "./user.service";

class PaymentService {
  static async addBellysavePayment({ phone, amount }: AddPayment) {
    try {
      const { foundCustomer, status, msg } =
        await UserService.getBellysaveCustomer("phone", phone);
      if (!foundCustomer) return { msg, status };
      const newPayment = await BellysavePaymentModel.create({
        customerId: foundCustomer._id,
        location: foundCustomer.location,
        amount,
        agentCode: foundCustomer.agentCode || 12345,
      });

      foundCustomer.amountPaid += amount;
      foundCustomer.lastPayment = new Date();
      await foundCustomer.save();
      const { status: status2, msg: msg2 } =
        await HistoryService.addBellysavePaymentToHistory(
          newPayment._id.toString()
        );
      if (status2 !== 201) return { msg: msg2, status: status2 };
      return { msg: "Payment added successfully", status: 201, newPayment };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async addPayment({ phone, amount, agentCode }: AddPayment) {
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
        agentCode,
      });
      if (foundUser.amountPaid + amount > foundUser.totalPrice)
        return { msg: "Amount will pass the total price", status: 405 };
      foundUser.amountPaid += amount;
      if (foundUser.amountPaid >= foundUser.totalPrice) {
        foundUser.paid = true;
      }
      foundUser.lastPayment = new Date();
      await foundUser.save();
      const { status: status2, msg: msg2 } =
        await HistoryService.addPaymentToHistory(newPayment._id.toString());
      if (status2 !== 201) return { msg: msg2, status: status2 };
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
