import { CookieOptions, NextFunction, Request, Response } from "express";
import Config from "../config/db.config";
import AuthService from "../services/auth.service";
import HistoryService from "../services/history.service";
import UserService from "../services/user.service";
import {
  AddAgent,
  AddReport,
  AdminFilter,
  AuthDto,
  CreateAdmin,
  CreateBellysaveCustomer,
  CreateCustomer,
  CustomersFilter,
  PackageName,
  Pagination,
  UsersFilter,
} from "../typings";
import UserModel from "../models/user.model";
import Utils from "../utils";
import LocationModel from "../models/location.model";
import { database } from "agenda/dist/agenda/database";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import AgentModel from "../models/agent.model";

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

class UserController {
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      let msg, status, foundUser, data;
      if (req.user.roles == undefined) {
        data = await UserService.getBellysaveCustomer("_id", req.user._id);
        msg = data.msg;
        status = data.status;
        foundUser = data.foundCustomer;
      } else {
        data = await UserService.getUserWithRole(
          req.user._id,
          req.user.roles[0]
        );
        status = data.status;
        msg = data.msg;
        foundUser = data.foundUser;
        if (!foundUser)
          return res.status(404).json({ msg: "Not found", status: 404 });
        // const ago = timeAgo
        //   .format(
        //     Date.now() - (Date.now() - new Date(foundUser.date!).getTime())
        //   )
        //   .split(" ");
        // if (ago[1].includes("month") && parseInt(ago[0]) >= 3) {
        //   if (!foundUser.late && foundUser.roles.includes("CUSTOMER")) {
        //     foundUser.totalPrice = 1.1 * foundUser.totalPrice;
        //     foundUser.late = true;
        //   }
        // }
      }
      if (!foundUser)
        foundUser = await AgentModel.findOne({ _id: req.user._id });
      if (!foundUser) return res.status(status).json({ msg, status });

      const { password, ...others } = foundUser.toObject();

      return res
        .status(200)
        .json({ user: others, status, msg: "Returned user successfully" });
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
      let foundUser, msg, status;
      const data = await UserService.getUserWithRole(
        req.query.customerId,
        "CUSTOMER"
      );
      foundUser = data.foundUser;

      if (!foundUser) {
        const data = await UserService.getBellysaveCustomer(
          "_id",
          req.query.customerId
        );
        foundUser = data.foundCustomer;
      }
      msg = data.msg;
      status = data.status;
      if (!foundUser)
        return res.status(404).json({ msg: "Not found", status: 404 });
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

  static async disableAdmin(
    req: Request<{}, {}, {}, { adminId: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, foundUser } = await UserService.getUserWithRole(
        req.query.adminId,
        "ADMIN"
      );
      if (!foundUser) return res.status(status).json({ msg, status });
      foundUser.approved = false;
      await foundUser.save();
      return res.status(status).json({ msg, status, user: foundUser });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async enableAdmin(
    req: Request<{}, {}, {}, { adminId: string }>,
    res: Response
  ) {
    try {
      const { msg, status, foundUser } = await UserService.getUserWithRole(
        req.query.adminId,
        "ADMIN"
      );
      if (!foundUser) return res.status(status).json({ msg, status });
      foundUser.approved = true;
      await foundUser.save();
      return res.status(status).json({ msg, status, user: foundUser });
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

  static async deleteAdmin(
    req: Request<{}, {}, {}, { agentCode: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, deletedAdmin } = await UserService.deleteAdmin(
        req.query.agentCode
      );
      if (status !== 200) return { msg, status };
      return res.status(status).json({ msg, status, deletedAdmin });
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
      const { msg, status, foundUsers, count } = await UserService.getAdmins({
        ...req.query,
      });
      if (!foundUsers) return res.status(status).json({ msg, status });
      return res.status(200).json({ users: foundUsers, status, count });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getBellysaveCustomers(req: Request, res: Response) {
    try {
      const filter = { ...req.query };
      Object.keys(filter).forEach((key) => {
        if (
          !filter[key] &&
          !!filter[key] !== false &&
          parseInt(filter[key]!.toString()) !== 0
        ) {
          delete filter[key];
        }
      });
      const { page, limit, name } = filter;
      const { msg, status, foundCustomers, count } =
        await UserService.getBellysaveCustomers(
          {
            page: page ? parseInt(page.toString()) : 0,
            limit: limit ? parseInt(limit.toString()) : 10,
          },
          filter,
          name as string
        );
      if (!foundCustomers)
        return res.status(status).json({ msg, status, count: 0 });
      return res
        .status(status)
        .json({ users: foundCustomers, msg, status, count });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async createAgent(req: Request<{}, {}, AddAgent, {}>, res: Response) {
    try {
      const { name, password, phone } = req.body;
      const { msg, status, newAgent } = await UserService.createAgent(req.body);
      if (status !== 201) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, newAgent });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async changeAgentPassword(
    req: Request<{}, {}, { agentId: string; password: string }, {}>,
    res: Response
  ) {
    try {
      const { agentId, password } = req.body;
      const { msg, status } = await UserService.changeAgentPassword(
        password,
        agentId
      );
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async editAgent(
    req: Request<{}, {}, {}, { agentId: string; name: string }>,
    res: Response
  ) {
    try {
      const { agentId, name } = req.query;
      const { msg, status, foundAgent } = await UserService.editAgent(
        agentId,
        name
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, agent: foundAgent });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async deleteAgent(
    req: Request<{}, {}, {}, { agentId: string }>,
    res: Response
  ) {
    try {
      const { msg, status, deletedAgent } = await UserService.deleteAgent(
        req.query.agentId
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, deletedAgent });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getAgents(req: Request<{}, {}, {}, {}>, res: Response) {
    try {
      const { msg, status, foundAgents } = await UserService.getAgents();
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, agents: foundAgents });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async changeCustomerAgent(
    req: Request<{}, {}, {}, { oldAgent: string; newAgent: string }>,
    res: Response
  ) {
    try {
      const { oldAgent, newAgent } = req.query;
      const { msg, status, foundCustomers } =
        await UserService.changeCustomerAgent(oldAgent, newAgent);
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, users: foundCustomers });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async createReport(
    req: Request<{}, {}, AddReport, {}>,
    res: Response
  ) {
    try {
      const { msg, status, createdReport } = await UserService.createReport(
        req.body
      );
      if (status !== 201) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, createdReport });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getReports(
    req: Request<
      {},
      {},
      {},
      { page?: string; limit?: string; agentName?: string }
    >,
    res: Response
  ) {
    try {
      const page = parseInt(req.query.page || "0");
      const limit = parseInt(req.query.limit || "10");
      const { agentName } = req.query;
      const { msg, status, reports, count } = await UserService.getReports(
        { page, limit },
        { agentName }
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res
        .status(status)
        .json({ msg, status, reports, count: count || 0 });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getAgentCustomers(
    req: Request<{}, {}, {}, { agentName: string }>,
    res: Response
  ) {
    try {
      const { msg, status, foundCustomers } =
        await UserService.getAgentCustomers(req.query.agentName);
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status, users: foundCustomers });
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
      const {
        agentCode,
        agentName,
        approved,
        paid,
        delivered,
        page,
        limit,
        name,
        location,
        inactive,
      } = req.query;
      const filter: CustomersFilter = {
        approved,
        paid,
        delivered,
        agentCode,
        location,
        agentName,
      };
      Object.keys(filter).forEach((key) => {
        if (!filter[key] && filter[key] !== false && filter[key] !== 0) {
          delete filter[key];
        }
      });
      let msg,
        status,
        foundUsers: any[] = [],
        count;

      if (Object.keys(filter).length === 0) {
        const data = await UserService.getAllCustomers(
          "CUSTOMER",
          { page: page || 0, limit: limit || 10 },
          name
        );
        msg = data.msg;
        status = data.status;
        if (inactive) {
          // data.foundUsers?.forEach((user) => {
          //   const ago = timeAgo
          //     .format(
          //       Date.now() - (Date.now() - new Date(user.date!).getTime())
          //     )
          //     .split(" ");
          //   if (ago[1].includes("month") && parseInt(ago[0]) >= 3) {
          //     foundUsers.push(user);
          //     if (!user.late) {
          //       user.totalPrice = 1.1 * user.totalPrice;
          //       user.late = true;
          //     }
          //   }
          // });
          foundUsers = data.foundUsers!.filter(
            (user) => user.inactive === true
          );
        } else {
          foundUsers = data.foundUsers!;
        }
        count = data.count;
        if (!foundUsers) return res.status(status).json({ msg, status });
      } else {
        const data = await UserService.getCustomers(
          "CUSTOMER",
          { page: page || 0, limit: limit || 10 },
          filter,
          name
        );
        msg = data.msg;
        status = data.status;

        if (inactive) {
          // data.foundUsers?.forEach((user, idx, users) => {
          //   const ago = timeAgo
          //     .format(
          //       Date.now() - (Date.now() - new Date(user.date!).getTime())
          //     )
          //     .split(" ");
          //   if (ago[1].includes("month") && parseInt(ago[0]) >= 3) {
          //     foundUsers.push(user);
          //     if (!user.late) {
          //       user.totalPrice = 1.1 * user.totalPrice;
          //       user.late = true;
          //     }
          //   }
          // });
          foundUsers = data.foundUsers!.filter(
            (user) => user.inactive === true
          );
        } else {
          foundUsers = data.foundUsers!;
        }
        count = data.count;

        if (!foundUsers) return res.status(status).json({ msg, status });
      }

      return res.status(200).json({ users: foundUsers, status, count });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async login(
    req: Request<{}, {}, AuthDto, { isAgent?: boolean }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { msg, status, access_token } = !req.query.isAgent
        ? await AuthService.login(req.body)
        : await AuthService.agentLogin(req.body);
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

  static async createBellysaveCustomer(
    req: Request<{}, {}, CreateBellysaveCustomer, {}>,
    res: Response
  ) {
    try {
      const { msg, status, newCustomer } =
        await UserService.createBellysaveCustomer(req.body);
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

  static async changeAdminPassword(
    req: Request<{}, {}, { password: string }, { adminId: string }>,
    res: Response
  ) {
    try {
      const { password } = req.body;
      const { adminId } = req.query;
      const { msg, status } = await UserService.changeAdminPassword(
        adminId,
        password
      );
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async payBellysaveCustomer(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response
  ) {
    try {
      const { msg, status } = await UserService.payBellysaveCustomer(
        req.query.customerId
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async renewBellysaveCustomer(
    req: Request<{}, {}, {}, { customerId: string }>,
    res: Response
  ) {
    try {
      const { msg, status } = await UserService.renewBellysaveCustomer(
        req.query.customerId
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async approveBellysaveCustomer(
    req: Request<{}, {}, {}, { customerId: string; agentCode: string }>,
    res: Response
  ) {
    try {
      const { status, msg } = await UserService.approveBellysaveCustomer(
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

  static async addLocation(
    req: Request<{}, {}, { location: string }, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { location } = req.body;
      const newLocation = await LocationModel.create({
        location,
      });
      return res
        .status(201)
        .json({ msg: "New location added", status: 200, newLocation });
    } catch (err: any) {
      console.log(err);
      if (err.code == 11000)
        return { msg: "Duplicate phone number not allowed", status: 405 };
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await LocationModel.find().distinct("location");
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

  static async editLocation(
    req: Request<{}, {}, {}, { oldLoc: string; newLoc: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const updatedLoc = await LocationModel.updateOne(
        { location: req.query.oldLoc },
        {
          $set: {
            location: req.query.newLoc,
          },
        }
      );
      return res.status(200).json({ updatedLoc, msg: "Updated", status: 200 });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async deleteLocation(
    req: Request<{}, {}, {}, { location: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const deletedLocation = await LocationModel.deleteOne({
        location: req.query.location,
      });
      return res
        .status(200)
        .json({ deletedLocation, msg: "Updated", status: 200 });
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

  static async getBellysavePayments(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      const { status, msg, payments } = await UserService.getBellysavePayments(
        req.user._id
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ payments, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getBellysaveCollectionHistory(req: Request, res: Response) {
    try {
      if (!req.user)
        return res.status(404).json({ msg: "Not found", status: 404 });
      const { status, msg, histories } =
        await HistoryService.getPaymentCollectionHistory(req.user._id);
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ histories, msg, status });
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

  static async editCustomer(
    req: Request<{}, {}, any, { customerId: string }>,
    res: Response
  ) {
    try {
      const { msg, status, updatedCustomer } = await UserService.editCustomer(
        req.query.customerId,
        req.body
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ updatedCustomer, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async editBellysaveCustomer(
    req: Request<{}, {}, any, { customerId: string }>,
    res: Response
  ) {
    try {
      const { msg, status, updatedCustomer } =
        await UserService.editBellysaveCustomer(req.query.customerId, req.body);
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ updatedCustomer, msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async editPayment(
    req: Request<{}, {}, {}, { amountPaid: string; historyId: string }>,
    res: Response
  ) {
    try {
      const { historyId, amountPaid } = req.query;
      const { msg, status } = await UserService.editPayment(
        historyId,
        parseInt(amountPaid.toString())
      );
      if (status !== 200) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getDailyHistoryByCode(
    req: Request<
      {},
      {},
      {},
      { day: string; agentCode: string; service: string }
    >,
    res: Response,
    next: NextFunction
  ) {
    try {
      const date = new Date(req.query.day);
      const { agentCode } = req.query;

      const { data, status, msg } =
        await HistoryService.getDailyHistoryByAgentCode(
          date.getTime(),
          parseInt(agentCode),
          req.query.service
        );
      if (status !== 200) return res.status(status).json({ msg, status });

      return res.status(status).json({ msg, data, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async getHistoryByDay(
    req: Request<{}, {}, {}, { day: string; service: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const date = new Date(req.query.day);

      const {
        agentWork,
        numNewCustomer,
        numNewPayment,
        numNewDelivery,
        totalAmount,
        histories,
        status,
        msg,
      } = await HistoryService.generateDailyReport(
        date.getTime(),
        req.query.service
      );
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
