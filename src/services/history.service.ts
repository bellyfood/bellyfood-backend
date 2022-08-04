import HistoryModel from "../models/history.model";
import PaymentService from "./payment.service";
import UserService from "./user.service";

class HistoryService {
  static async addCustomerToHistory(customerId: string) {
    try {
      const { foundUser, status, msg } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (status !== 200) return { msg, status };
      const newHistory = await HistoryModel.create({
        details: "New customer added",
        type: "creation",
        customerId,
        location: foundUser!.location,
        date: Date.now(), // 2022-08-01T11:49:00
        agentCode: foundUser!.agentCode,
      });
      return { msg: "Added customer to history", status: 201, newHistory };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async addPaymentToHistory(paymentId: string) {
    try {
      const { foundPayment, status, msg } = await PaymentService.getPayment(
        paymentId
      );
      if (status !== 200) return { msg, status };
      const newHistory = await HistoryModel.create({
        details: "New payment added",
        type: "payment",
        customerId: foundPayment!.customerId,
        location: foundPayment!.location,
        date: Date.now(), // 2022-08-01T11:49:00
        amountPaid: foundPayment!.amount,
        agentCode: foundPayment!.agentCode,
      });
      return { msg: "Added customer to history", status: 201, newHistory };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getHistoryByDay(day: number) {
    try {
      const histories = await HistoryModel.find({
        date: {
          $gt: day,
          $lt: day + 1 * 24 * 60 * 60 * 1000,
        },
      });
      return { msg: "History found", status: 200, histories };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getHistoryByMonth(month: number, year: number) {
    try {
      const currMonth = month < 10 ? "0" + month : month;
      let nextMonth: string | number;
      let nextYear = year;
      if (currMonth == 12) {
        nextMonth = "01";
        nextYear++;
      } else nextMonth = month + 1 < 10 ? "0" + (month + 1) : month + 1;
      console.log(currMonth, nextMonth);
      console.log(
        new Date(`${year}-${currMonth}`),
        new Date(`${nextYear}-${nextMonth}`)
      );

      const histories = await HistoryModel.find({
        date: {
          $gt: new Date(`${year}-${currMonth}`),
          $lt: new Date(`${year}-${nextMonth}`),
        },
      });
      return { msg: "History found", status: 200, histories };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
}

export default HistoryService;
