import { CookieOptions, NextFunction, Request, Response } from "express";
import Config from "../config/db.config";
import AuthService from "../services/auth.service";
import HistoryService from "../services/history.service";
import UserService from "../services/user.service";
import {
  AuthDto,
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
  PackageName,
  UsersFilter,
} from "../typings";
import UserModel from "../models/user.model";
import Utils from "../utils";

class UserController {
  static async me(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    // console.log(Config.connection);

    // let agenda = Utils.createAgenda();
    // const timeJob = Utils.time(agenda);
    // await agenda.start();
    // await timeJob.repeatEvery("10 seconds").save();

    const { msg, status, foundUser } = await UserService.getUserWithRole(
      req.user._id,
      req.user.roles[0]
    );
    if (!foundUser) return res.status(status).json({ msg });
    // console.log(foundUser);
    const { password, ...others } = foundUser.toObject();
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
    if (!foundUser) return res.status(status).json({ msg });
    const { password, ...others } = foundUser.toObject();
    return res.status(200).json({ user: others });
  }

  static async getAdminByCode(
    req: Request<{}, {}, {}, { agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, foundUser } = await UserService.getUserBy(
      "agentCode",
      req.query.agentCode,
      "ADMIN"
    );
    if (!foundUser) return res.status(status).json({ msg });
    const { password, ...others } = foundUser.toObject();
    return res.status(200).json({ user: others });
  }

  static async getAdmins(req: Request, res: Response, next: NextFunction) {
    const { msg, status, foundUsers } = await UserService.getAdmins();
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(200).json({ users: foundUsers });
  }

  static async getCustomers(
    req: Request<{}, {}, {}, UsersFilter>,
    res: Response,
    next: NextFunction
  ) {
    const { agentCode, approved, paid, delivered } = req.query;
    const filter: CustomersFilter = {};
    approved && (filter.approved = approved);
    paid && (filter.paid = paid);
    delivered && (filter.delivered = delivered);
    agentCode && (filter.agentCode = agentCode);
    const { msg, status, foundUsers } = await UserService.getCustomers(
      "CUSTOMER",
      filter
    );
    if (status !== 200) return res.status(status).json({ msg, status });
    return res.status(200).json({ users: foundUsers });
  }

  static async login(
    req: Request<{}, {}, AuthDto, {}>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, access_token } = await AuthService.login(req.body);
    if (status !== 200) {
      return res.status(status).json({ msg, status });
    }
    const cookieOptions: CookieOptions = {
      maxAge: 4 * 60 * 60 * 1000,
    };
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true;
      cookieOptions.httpOnly = true;
      cookieOptions.path = "/";
      cookieOptions.sameSite = "none";
    } else {
      cookieOptions.httpOnly = false;
      cookieOptions.path = "/";
      cookieOptions.sameSite = false;
    }
    return res
      .status(status)
      .cookie("bellyfood", access_token, cookieOptions)
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
    if (!newCustomer) return res.status(status).json({ msg });
    const { password, ...others } = newCustomer.toObject();
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
    if (!newAdmin) return res.status(status).json({ msg });
    const { password, ...others } = newAdmin.toObject();
    return res.status(status).json({ msg, newAdmin: others });
  }

  static async approveCustomer(
    req: Request<{}, {}, {}, { customerId: string; agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { status, msg } = await UserService.approveCustomer(
      req.query.customerId,
      req.query.agentCode
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
    req: Request<{}, {}, {}, { customerId: string; packageName: string }>,
    res: Response,
    next: NextFunction
  ) {
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    if (!req.query.customerId)
      return res
        .status(405)
        .json({ msg: "Customer id required for admin user" });
    const { status, msg } = await UserService.renewPackage(
      req.query.customerId,
      req.query.packageName as PackageName
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async changePackage(
    req: Request<
      {},
      {},
      {},
      { customerId: string; oldPkg: string; newPkg: string }
    >,
    res: Response,
    next: NextFunction
  ) {
    if (!req.query.customerId)
      return res
        .status(405)
        .json({ msg: "Customer id required for admin user" });
    const { status, msg } = await UserService.changePackage(
      req.query.customerId,
      req.query.newPkg,
      req.query.oldPkg
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ msg });
  }

  static async deleteCustomer(
    req: Request<{}, {}, {}, { customerId?: string }>,
    res: Response,
    next: NextFunction
  ) {
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    let status: number, msg: string;
    if (!req.user.roles.includes("ADMIN")) {
      const { status: s, msg: m } = await UserService.deleteCustomer(
        req.user._id
      );
      status = s;
      msg = m;
    } else {
      if (!req.query.customerId)
        return res
          .status(405)
          .json({ msg: "Customer id required for admin user" });
      const { status: s, msg: m } = await UserService.deleteCustomer(
        req.query.customerId
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
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    const { status, msg, payments } = await UserService.getPayments(
      req.user._id
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(status).json({ payments, msg });
  }

  static async getDailyHistoryByCode(
    req: Request<{}, {}, {}, { day: string; agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    const date = new Date(req.query.day);
    console.log(date);

    console.log(date.getTime());
    const { agentCode } = req.query;

    const { data, status, msg } =
      await HistoryService.getDailyHistoryByAgentCode(
        date.getTime(),
        parseInt(agentCode)
      );
    if (status !== 200) return res.status(status).json({ msg });

    return res.status(status).json({ msg, data });
  }

  static async getHistoryByDay(
    req: Request<{}, {}, {}, { day: string }>,
    res: Response,
    next: NextFunction
  ) {
    const date = new Date(req.query.day);
    console.log(date);

    console.log(date.getTime());

    const {
      agentWork,
      numNewCustomer,
      numNewPayment,
      numNewDelivery,
      totalAmount,
      histories,
      status,
      msg,
    } = await HistoryService.generateDailyReport(date.getTime());
    if (status !== 200) return res.status(status).json({ msg });
    const data = {
      agentWork,
      numNewCustomer,
      numNewPayment,
      numNewDelivery,
      totalAmount,
      histories,
    };
    return res.status(status).json({ msg, data });
  }

  static async generateMonthlyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const date = new Date();

    const { agentWork, numNewCustomer, numNewPayment, histories, status, msg } =
      await HistoryService.generateMonthlyReport(
        date.getMonth() + 1,
        date.getFullYear()
      );

    if (status !== 200) return res.status(status).json({ msg });
    const data = {
      agentWork,
      numNewCustomer,
      numNewPayment,
      histories,
    };
    return res.status(status).json({ msg, data });
  }
}

export default UserController;
