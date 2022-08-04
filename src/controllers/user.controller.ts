import { NextFunction, Request, Response } from "express";
import AuthService from "../services/auth.service";
import HistoryService from "../services/history.service";
import UserService from "../services/user.service";
import {
  AuthDto,
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
  UsersFilter,
} from "../typings";

class UserController {
  static async me(req: Request, res: Response, next: NextFunction) {
    console.log(req.user!._id);
    const { msg, status, foundUser } = await UserService.getUserWithRole(
      req.user!._id,
      req.user!.roles[0]
    );
    if (status !== 200) return res.status(status).json({ msg });
    // console.log(foundUser);
    const { password, ...others } = foundUser!.toObject();
    // console.log(others);

    return res.status(200).json({ user: others });
  }

  static async getUser(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, foundUser } = await UserService.getUserWithRole(
      req.query.customerId,
      "CUSTOMER"
    );
    if (status !== 200) return res.status(status).json({ msg });
    const { password, ...others } = foundUser!.toObject();
    return res.status(200).json({ user: others });
  }

  static async getCustomers(
    req: Request<{}, {}, {}, UsersFilter>,
    res: Response,
    next: NextFunction
  ) {
    const filter: CustomersFilter = {
      role: "CUSTOMER",
      approved: req.query.approved || false,
      paid: req.query.paid || false,
      delivered: req.query.delivered || false,
    };
    req.query.agentCode && (filter.agentCode = req.query.agentCode);
    const { msg, status, foundUsers } = await UserService.getCustomers(filter);
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(200).json({ users: foundUsers });
  }

  static async login(
    req: Request<{}, {}, AuthDto, {}>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, access_token } = await AuthService.login(req.body);
    if (status !== 200) {
      return res.status(status).json({ msg });
    }
    return res
      .status(status)
      .cookie("bellyfood", access_token, {
        maxAge: 4 * 60 * 60 * 1000,
      })
      .json({ access_token, msg });
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    return res.clearCookie("bellyfood").json({ msg: "Logged out" });
  }

  static async createCustomer(
    req: Request<{}, {}, CreateCustomer, {}>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, newCustomer } = await UserService.createCustomer(
      req.body
    );
    if (status !== 201) {
      return res.status(status).json({ msg });
    }
    const { password, ...others } = newCustomer!.toObject();
    return res.status(status).json({ msg, newCustomer: others });
  }

  static async createAdmin(
    req: Request<{}, {}, CreateAdmin, {}>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, newAdmin } = await UserService.createAdmin(req.body);
    if (status !== 201) {
      return res.status(status).json({ msg });
    }
    const { password, ...others } = newAdmin!.toObject();
    return res.status(status).json({ msg, newAdmin: others });
  }

  static async approveCustomer(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { status, msg } = await UserService.approveCustomer(
      req.query.customerId
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async deliverToUser(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status } = await UserService.deliverToCustomer(
      req.query.customerId
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async renewPackage(
    req: Request<{}, {}, {}, { customerId?: string }>,
    res: Response,
    next: NextFunction
  ) {
    let status: number, msg: string;
    if (!req.user!.roles.includes("ADMIN")) {
      const { status: s, msg: m } = await UserService.renewPackage(
        req.user!._id
      );
      status = s;
      msg = m;
    } else {
      const { status: s, msg: m } = await UserService.renewPackage(
        req.query.customerId!
      );
      status = s;
      msg = m;
    }
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async changePackage(
    req: Request<{}, {}, {}, { customerId?: string; name?: string }>,
    res: Response,
    next: NextFunction
  ) {
    let status: number, msg: string;
    if (!req.user!.roles.includes("ADMIN")) {
      const { status: s, msg: m } = await UserService.changePackage(
        req.user!._id,
        req.user!.name
      );
      status = s;
      msg = m;
    } else {
      const { status: s, msg: m } = await UserService.changePackage(
        req.query.customerId!,
        req.query.name!
      );
      status = s;
      msg = m;
    }
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async deleteCustomer(
    req: Request<{}, {}, {}, { customerId?: string }>,
    res: Response,
    next: NextFunction
  ) {
    let status: number, msg: string;
    if (!req.user!.roles.includes("ADMIN")) {
      const { status: s, msg: m } = await UserService.deleteCustomer(
        req.user!._id
      );
      status = s;
      msg = m;
    } else {
      const { status: s, msg: m } = await UserService.deleteCustomer(
        req.query.customerId!
      );
      status = s;
      msg = m;
    }
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async getPaymentDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { status, msg, payments } = await UserService.getPayments(
      req.user!._id
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ payments, msg });
  }

  static async getHistoryByDay(
    req: Request<{}, {}, {}, { day: string }>,
    res: Response,
    next: NextFunction
  ) {
    const date = new Date(req.query.day);
    console.log(date);

    console.log(date.getTime());

    const { status, msg, histories } = await HistoryService.getHistoryByDay(
      date.getTime()
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg, histories });
  }

  static async generateMonthlyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const date = new Date();
    const { status, msg, histories } = await HistoryService.getHistoryByMonth(
      date.getMonth() + 1,
      date.getFullYear()
    );
    let numNewCustomer = 0;
    let numNewPayment = 0;

    interface Agent {
      numNewCustomer?: number;
      numNewPayment?: number;
    }
    interface AgentReport {
      [key: string]: Agent | undefined;
    }
    let agentWork: AgentReport = {};
    histories?.forEach((history) => {
      const agentCode = history.agentCode!.toString();
      if (history.type == "creation") {
        numNewCustomer++;
        if (
          agentWork[agentCode] &&
          agentWork[agentCode]!.numNewCustomer! >= 1
        ) {
          agentWork[agentCode] = {
            ...agentWork[agentCode],
            numNewCustomer: agentWork[agentCode]!.numNewCustomer! + 1,
          };
        } else {
          agentWork[agentCode] = {
            ...agentWork[agentCode],
            numNewCustomer: 1,
          };
        }
      } else if (history.type == "payment") {
        numNewPayment++;
        if (agentWork[agentCode] && agentWork[agentCode]!.numNewPayment! >= 1) {
          agentWork[agentCode] = {
            ...agentWork[agentCode],
            numNewPayment: agentWork[agentCode]!.numNewPayment! + 1,
          };
        } else {
          agentWork[agentCode] = {
            ...agentWork[agentCode],
            numNewPayment: 1,
          };
        }
      }
    });
    const data = {
      agentWork,
      numNewCustomer,
      numNewPayment,
      histories,
    };
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg, data });
  }
}

export default UserController;
