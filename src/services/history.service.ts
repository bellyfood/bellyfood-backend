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
      if (!foundUser) return { msg, status };
      const newHistory = await HistoryModel.create({
        details: "New customer added",
        type: "creation",
        customerId,
        location: foundUser.location,
        date: Date.now(), // 2022-08-01T11:49:00
        agentCode: foundUser.agentCode,
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
      if (!foundPayment) return { msg, status };
      const newHistory = await HistoryModel.create({
        details: "New payment added",
        type: "payment",
        customerId: foundPayment.customerId,
        location: foundPayment.location,
        date: Date.now(), // 2022-08-01T11:49:00
        amountPaid: foundPayment.amount,
        agentCode: foundPayment.agentCode,
      });
      return { msg: "Added customer to history", status: 201, newHistory };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async addDeliveryToHistory(customerId: string) {
    try {
      const { foundUser, status, msg } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (!foundUser) return { msg, status };
      const newHistory = await HistoryModel.create({
        details: "New delivery added",
        type: "delivery",
        customerId: customerId,
        location: foundUser.location,
        date: Date.now(), // 2022-08-01T11:49:00
        agentCode: foundUser.agentCode,
      });
      return { msg: "Added customer to history", status: 201, newHistory };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getDeliveryHistory(customerId?: string) {
    try {
      let histories;
      if (!customerId) {
        histories = await HistoryModel.find({
          type: "delivery",
        });
      } else {
        histories = await HistoryModel.find({
          type: "delivery",
          customerId,
        });
      }
      return { msg: "Histories found", status: 200, histories };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async generateReportByAgentCode(histories: any, agentCode: number) {
    let dup = histories.filter(
      (history: any) => history.agentCode == agentCode
    );
    let numNewCustomer = 0;
    let numNewPayment = 0;
    let totalAmount = 0;
    dup.forEach((history: any) => {
      switch (history.type) {
        case "creation":
          numNewCustomer++;
          break;
        case "payment":
          totalAmount += history.amountPaid!;
          numNewPayment++;
          break;
      }
    });
    return {
      histories: dup,
      numNewCustomer,
      numNewPayment,
      totalAmount,
      agentCode,
    };
  }

  static async getDailyHistoryByAgentCode(day: number, agentCode: number) {
    try {
      const histories = await HistoryModel.find({
        date: {
          $gt: day,
          $lt: day + 1 * 24 * 60 * 60 * 1000,
        },
        agentCode,
      });
      const data = await HistoryService.generateReportByAgentCode(
        histories,
        agentCode
      );
      return { msg: "History found", status: 200, data };
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

  static async generateDailyReport(day: number) {
    try {
      const { histories, msg, status } = await HistoryService.getHistoryByDay(
        day
      );
      if (status !== 200) return { status, msg };
      const { foundUsers } = await UserService.getAdmins({});
      if (!foundUsers) return { msg: "Not found", status: 404 };
      const {
        agentWork,
        numNewCustomer,
        numNewPayment,
        numNewDelivery,
        totalAmount,
      } = await HistoryService.generateReport(
        histories,
        foundUsers.map((user) => user.agentCode!)
      );
      return {
        agentWork,
        numNewCustomer,
        numNewPayment,
        numNewDelivery,
        totalAmount,
        histories,
        status,
        msg,
      };
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

  static async generateReport(histories: any, agentCodes: number[]) {
    let agentWorks: Agent[] = [];
    for (let agentCode of agentCodes!) {
      agentWorks.push(
        await HistoryService.generateReportByAgentCode(histories, agentCode)
      );
    }
    interface Agent {
      histories: any;
      numNewCustomer: number;
      numNewPayment: number;
      totalAmount: number;
      agentCode: number;
    }
    let totalAmount = agentWorks.reduce(
      (total, curr) => (total += curr.totalAmount),
      0
    );
    let numNewCustomer = agentWorks.reduce(
      (total, curr) => (total += curr.numNewCustomer),
      0
    );
    let numNewPayment = agentWorks.reduce(
      (total, curr) => (total += curr.numNewPayment),
      0
    );
    let numNewDelivery = histories.reduce(
      (total: number, curr: any) =>
        curr.type == "delivery" ? (total += 1) : (total += 0),
      0
    );
    console.log(agentWorks);
    console.log(totalAmount);
    console.log(numNewCustomer);
    console.log(numNewPayment);
    return {
      agentWork: agentWorks,
      numNewCustomer,
      numNewDelivery,
      numNewPayment,
      totalAmount,
      histories,
    };
    // let numNewCustomer = 0;
    // let numNewPayment = 0;
    // let numNewDelivery = 0;
    // let totalAmount = 0;

    // interface Agent {
    //   numNewCustomer?: number;
    //   numNewPayment?: number;
    //   totalAmount?: number;
    // }
    // interface AgentReport {
    //   [key: string]: Agent | undefined;
    // }
    // let agentWork: AgentReport = {};
    // histories!.forEach((history: any) => {
    //   const agentCode = history.agentCode!.toString();
    //   switch (history.type) {
    //     case "creation":
    //       numNewCustomer++;
    //       if (
    //         agentWork[agentCode] &&
    //         agentWork[agentCode]!.numNewCustomer! >= 1
    //       ) {
    //         agentWork[agentCode] = {
    //           ...agentWork[agentCode],
    //           numNewCustomer: agentWork[agentCode]!.numNewCustomer! + 1,
    //         };
    //       } else {
    //         agentWork[agentCode] = {
    //           ...agentWork[agentCode],
    //           numNewCustomer: 1,
    //         };
    //       }
    //       break;
    //     case "payment":
    //       numNewPayment++;
    //       totalAmount += history.amountPaid!;
    //       if (agentCode == history.agentCode!.toString()) {
    //         agentWork[agentCode] = {
    //           ...agentWork[agentCode],
    //           totalAmount:
    //             agentWork[agentCode]!.totalAmount! + history.amountPaid!,
    //         };
    //         if (
    //           agentWork[agentCode] &&
    //           agentWork[agentCode]!.numNewPayment! >= 1
    //         ) {
    //           agentWork[agentCode] = {
    //             ...agentWork[agentCode],
    //             numNewPayment: agentWork[agentCode]!.numNewPayment! + 1,
    //           };
    //         } else {
    //           agentWork[agentCode] = {
    //             ...agentWork[agentCode],
    //             numNewPayment: 1,
    //           };
    //         }
    //       }
    //       break;
    //     case "delivery":
    //       numNewDelivery++;
    //       break;
    //   }
    // });
    // return {
    //   agentWork,
    //   numNewCustomer,
    //   numNewPayment,
    //   numNewDelivery,
    //   totalAmount,
    //   histories,
    // };
  }

  static async generateMonthlyReport(month: number, year: number) {
    const { histories, msg, status } = await HistoryService.getHistoryByMonth(
      month,
      year
    );
    if (status !== 200) return { status, msg };
    const { foundUsers } = await UserService.getAdmins({});
    if (!foundUsers) return { msg: "Not found", status: 404 };
    const {
      agentWork,
      numNewCustomer,
      numNewPayment,
      numNewDelivery,
      totalAmount,
    } = await HistoryService.generateReport(
      histories,
      foundUsers.map((user) => user.agentCode!)
    );
    return {
      agentWork,
      numNewCustomer,
      numNewPayment,
      numNewDelivery,
      totalAmount,
      histories,
      status,
      msg,
    };
  }
}

export default HistoryService;
