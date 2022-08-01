import HistoryModel from "../models/history.model";
import UserService from "./user.service";

class HistoryService {
  static async addCustomerToHistory(customerId: string) {
    try {
      const {
        foundUser,
        status: customerS,
        msg,
      } = await UserService.getCustomer(customerId);
      if (customerS !== 200) return { msg, status: customerS };
      const newHistory = await HistoryModel.create({
        details: "New customer added",
        type: "creation",
        customerId,
        location: foundUser!.location,
        date: Date.now(), // 2022-08-01T11:49:00
      });
      return { msg: "Added customer to history", status: 201 };
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
      const histories = await HistoryModel.find({
        date: {
          $gt: new Date(`${year}-${month}`),
          $lt: new Date(`${year}-${month + 1}`),
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
