import { CookieOptions, NextFunction, Request, Response } from "express";
import Config from "../config/db.config";
import AuthService from "../services/auth.service";
import HistoryService from "../services/history.service";
import UserService from "../services/user.service";
import {
  AdminFilter,
  AuthDto,
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
  PackageName,
  Pagination,
  UsersFilter,
} from "../typings";
import UserModel from "../models/user.model";
import Utils from "../utils";

class UserController {
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      // console.log(Config.connection);

      // let agenda = Utils.createAgenda();
      // const timeJob = Utils.time(agenda);
      // await agenda.start();
      // await timeJob.repeatEvery("10 seconds").save();

      const { msg, status, foundUser } = await UserService.getUserWithRole(
        req.user._id,
        req.user.roles[0]
      );
      if (!foundUser) return res.status(status).json({ msg, status });
      // console.log(foundUser);
      const { password, ...others } = foundUser.toObject();
      // console.log(others);

      return res
        .status(200)
        .json({ user: others, status, msg: req.headers.cookie });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getUser(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, foundUser } = await UserService.getUserWithRole(
        req.query.customerId,
        "CUSTOMER"
      );
      if (!foundUser) return res.status(status).json({ msg, status });
      const { password, ...others } = foundUser.toObject();
      return res.status(200).json({ user: others, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async searchByName(
    req: Request<{}, {}, {}, { name: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, foundUsers } = await UserService.searchByName(
        req.query.name
      );
      if (!foundUsers) return res.status(status).json({ msg, status });
      return res.status(200).json({ users: foundUsers, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getAdminByCode(
    req: Request<{}, {}, {}, { agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, foundUser } = await UserService.getUserBy(
        "agentCode",
        req.query.agentCode,
        "ADMIN"
      );
      if (!foundUser) return res.status(status).json({ msg, status });
      const { password, ...others } = foundUser.toObject();
      return res.status(200).json({ user: others, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getAdmins(
    req: Request<{}, {}, {}, AdminFilter>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, foundUsers } = await UserService.getAdmins({
        ...req.query,
      });
      if (!foundUsers) return res.status(status).json({ msg, status });
      return res
        .status(200)
        .json({ users: foundUsers, status, count: foundUsers.length });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getCustomers(
    req: Request<{}, {}, {}, UsersFilter>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { agentCode, approved, paid, delivered, page, limit, name } =
        req.query;
      const filter: CustomersFilter = {
        approved,
        paid,
        delivered,
        agentCode,
      };
      console.log(filter);
      Object.keys(filter).forEach((key) => {
        if (!filter[key] && filter[key] !== false && filter[key] !== 0) {
          delete filter[key];
        }
      });
      console.log(filter);
      let msg, status, foundUsers;
      if (Object.keys(filter).length === 0) {
        const data = await UserService.getAllCustomers(
          "CUSTOMER",
          { page: page || 0, limit: limit || 10 },
          name
        );
        msg = data.msg;
        status = data.status;
        foundUsers = data.foundUsers;
        if (!foundUsers) return res.status(status).json({ msg, status });
      } else {
        console.log(name);
        const data = await UserService.getCustomers(
          "CUSTOMER",
          { page: page || 0, limit: limit || 10 },
          filter,
          name
        );
        msg = data.msg;
        status = data.status;
        foundUsers = data.foundUsers;
        if (!foundUsers) return res.status(status).json({ msg, status });
      }

      return res
        .status(200)
        .json({ users: foundUsers, status, count: foundUsers.length });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async login(
    req: Request<{}, {}, AuthDto, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, access_token } = await AuthService.login(req.body);
      if (status !== 200) {
        return res.status(status).json({ msg, status });
      }
      const cookieOptions: CookieOptions = {
        expires: new Date(Date.now() + 4 * 60 * 60 * 1000),
      };
      if (process.env.NODE_ENV === "production") {
        cookieOptions.secure = true;
        cookieOptions.sameSite = "none";
      } else {
        cookieOptions.sameSite = false;
      }
      console.log(access_token);
      return res
        .status(status)
        .cookie("bellyfood", access_token, cookieOptions)
        .json({ access_token, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    const cookieOptions: CookieOptions = {
      expires: new Date(1),
    };
    if (process.env.NODE_ENV === "production") {
      cookieOptions.secure = true;
      cookieOptions.sameSite = "none";
    } else {
      cookieOptions.sameSite = false;
    }
    return res
      .cookie("bellyfood", "", cookieOptions)
      .json({ msg: "Logged out", status: 200 });
  }

  static async createCustomer(
    req: Request<{}, {}, CreateCustomer, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, newCustomer } = await UserService.createCustomer(
        req.body
      );
      if (status !== 201) {
        return res.status(status).json({ msg });
      }
      if (!newCustomer) return res.status(status).json({ msg, status });
      const { password, ...others } = newCustomer.toObject();
      return res.status(status).json({ msg, newCustomer: others, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async createAdmin(
    req: Request<{}, {}, CreateAdmin, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, newAdmin } = await UserService.createAdmin(req.body);
      if (status !== 201) {
        return res.status(status).json({ msg, status });
      }
      if (!newAdmin) return res.status(status).json({ msg, status });
      const { password, ...others } = newAdmin.toObject();
      return res.status(status).json({ msg, newAdmin: others, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async approveCustomer(
    req: Request<{}, {}, {}, { customerId: string; agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, msg } = await UserService.approveCustomer(
        req.query.customerId,
        req.query.agentCode
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await UserModel.find().distinct("location");
      if (!locations)
        return res.status(404).json({ msg: "Not found", status: 404 });
      return res
        .status(200)
        .json({ locations, msg: "Locations found", status: 200 });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const { packages, msg, status } = await UserService.getPackages();
      if (!packages)
        return res.status(404).json({ msg: "Not found", status: 404 });
      return res.status(status).json({ packages, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getDeliveryHistory(
    req: Request<{}, {}, {}, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, histories } =
        await HistoryService.getDeliveryHistory(req.user?._id);
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({
        msg,
        status,
        histories,
        count: histories ? histories.length : 0,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async deliverToUser(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status } = await UserService.deliverToCustomer(
        req.query.customerId
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async renewPackage(
    req: Request<{}, {}, {}, { customerId: string; packageName: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      if (!req.query.customerId)
        return res
          .status(405)
          .json({ msg: "Customer id required for admin user", status: 405 });
      const { status, msg } = await UserService.renewPackage(
        req.query.customerId,
        req.query.packageName as PackageName
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
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
    try {
      if (!req.query.customerId)
        return res
          .status(405)
          .json({ msg: "Customer id required for admin user", status: 405 });
      const { status, msg } = await UserService.changePackage(
        req.query.customerId,
        req.query.newPkg,
        req.query.oldPkg
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async deleteCustomer(
    req: Request<{}, {}, {}, { customerId?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
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
            .json({ msg: "Customer id required for admin user", status: 405 });
        const { status: s, msg: m } = await UserService.deleteCustomer(
          req.query.customerId
        );
        status = s;
        msg = m;
      }
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getPaymentDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      const { status, msg, payments } = await UserService.getPayments(
        req.user._id
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ payments, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getDailyHistoryByCode(
    req: Request<{}, {}, {}, { day: string; agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const date = new Date(req.query.day);
      console.log(date);

      console.log(date.getTime());
      const { agentCode } = req.query;

      const { data, status, msg } =
        await HistoryService.getDailyHistoryByAgentCode(
          date.getTime(),
          parseInt(agentCode)
        );
      if (status !== 200) return res.status(status).json({ msg, status });

      return res.status(status).json({ msg, data, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getHistoryByDay(
    req: Request<{}, {}, {}, { day: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
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
      if (status !== 200) return res.status(status).json({ msg, status });
      const data = {
        agentWork,
        numNewCustomer,
        numNewPayment,
        numNewDelivery,
        totalAmount,
        histories,
      };
      return res.status(status).json({ msg, data, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async generateMonthlyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const date = new Date();

      const {
        agentWork,
        numNewCustomer,
        numNewPayment,
        histories,
        status,
        msg,
      } = await HistoryService.generateMonthlyReport(
        date.getMonth() + 1,
        date.getFullYear()
      );

      if (status !== 200) return res.status(status).json({ msg, status });
      const data = {
        agentWork,
        numNewCustomer,
        numNewPayment,
        histories,
      };
      return res.status(status).json({ msg, data, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }
}

export default UserController;
