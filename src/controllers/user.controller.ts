import { NextFunction, Request, Response } from "express";
import AuthService from "../services/auth.service";
import HistoryService from "../services/history.service";
import UserService from "../services/user.service";
import {
  AuthDto,
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
} from "../typings";

class UserController {
  static async me(req: Request, res: Response, next: NextFunction) {
    console.log(req.user);
    return res.status(200).json({ user: req.user });
  }

  static async getUser(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response,
    next: NextFunction
  ) {
    const { msg, status, foundUser } = await UserService.getCustomer(
      req.query.customerId
    );
    if (status !== 200) return res.status(status).json({ msg });
    return res.status(200).json({ user: foundUser });
  }

  static async getCustomers(
    req: Request<{}, {}, {}, { approved?: boolean; agentCode?: number }>,
    res: Response,
    next: NextFunction
  ) {
    const filter: CustomersFilter = {
      role: "CUSTOMER",
      approved: req.query.approved || false,
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
    return res.status(status).json({ msg, newCustomer });
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
    return res.status(status).json({ msg, newAdmin });
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
  }
}

export default UserController;
