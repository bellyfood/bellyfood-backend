import * as argon from "argon2";
import UserModel from "../models/user.model";
import {
  AddAgent,
  AddReport,
  AdminFilter,
  CreateAdmin,
  CreateBellysaveCustomer,
  CreateCustomer,
  CustomersFilter,
  PackageName,
  Pagination,
} from "../typings";
import HistoryService from "./history.service";
import PaymentModel from "../models/payment.model";
import PackageModel from "../models/package.model";
import Utils from "../utils";
import LocationModel from "../models/location.model";
import BellysaveCustomerModel from "../models/bellysave-customer.model";
import BellysavePaymentModel from "../models/bellysave-payment.model";
import HistoryModel from "../models/history.model";
import AgentModel from "../models/agent.model";
import ReportModel from "../models/report.model";

class UserService {
  static async getUserWithRole(customerId: string, role: string) {
    try {
      const foundUser = await UserModel.findOne({
        _id: customerId,
        roles: role,
      });
      if (!foundUser) return { msg: "Not found", status: 404 };
      return { msg: "User found", status: 200, foundUser };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async editCustomer(customerId: string, updatedFields: any) {
    try {
      const updatedCustomer = await UserModel.updateOne(
        { _id: customerId },
        { $set: updatedFields }
      );
      return { msg: "Customer updated", status: 200, updatedCustomer };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async editBellysaveCustomer(customerId: string, updatedFields: any) {
    try {
      const updatedCustomer = await BellysaveCustomerModel.updateOne(
        { _id: customerId },
        { $set: updatedFields }
      );
      return { msg: "Customer updated", status: 200, updatedCustomer };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async editPayment(historyId: string, amountPaid: number) {
    try {
      const foundHistory = await HistoryModel.findOne({
        _id: historyId,
      });
      if (!foundHistory) return { msg: "History not found", status: 404 };
      const foundUser = await UserModel.findOne({
        _id: foundHistory.customerId,
      });
      if (!foundUser) return { msg: "User not found", status: 404 };
      foundUser.amountPaid =
        foundUser.amountPaid - (foundHistory.amountPaid || 0) + amountPaid;
      foundHistory.amountPaid = amountPaid;
      await foundUser.save();
      await foundHistory.save();
      return { msg: "Amount edited", status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async renewBellysaveCustomer(customerId: string) {
    try {
      const foundCustomer = await BellysaveCustomerModel.findOne({
        _id: customerId,
      });
      if (!foundCustomer) return { msg: "Not found", status: 404 };
      if (foundCustomer.amountPaid > 0) {
        return {
          msg: "Customer needs to be paid before they can be renewed",
          status: 405,
        };
      }
      foundCustomer.date = new Date();
      foundCustomer.paying = true;
      return { msg: "Customer renewed", status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async payBellysaveCustomer(customerId: string) {
    try {
      const foundCustomer = await BellysaveCustomerModel.findOne({
        _id: customerId,
      });
      if (!foundCustomer) return { msg: "Not found", status: 404 };
      foundCustomer.amountPaid = 0;
      foundCustomer.amountRemoved = 0;
      foundCustomer.date = new Date();
      foundCustomer.paying = false;
      await foundCustomer.save();
      await HistoryService.addPaidCustomerToHistory(customerId);
      return { msg: "Customer paid", status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getBellysaveCustomer(by: string, value: string) {
    try {
      const foundCustomer = await BellysaveCustomerModel.findOne({
        [by]: value,
      });
      if (!foundCustomer) return { msg: "Not found", status: 404 };
      const date = new Date(foundCustomer.date);
      const months = new Date().getMonth() - date.getMonth();
      foundCustomer.amountRemoved = months * 1000;
      await foundCustomer.save();
      return { msg: "Customer found", status: 200, foundCustomer };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getUserBy(by: string, value: string, role: string) {
    try {
      const foundUser = await UserModel.findOne({
        [by]: value,
        roles: role,
      });
      if (!foundUser) return { msg: "Not found", status: 404 };
      return { msg: "User found", status: 200, foundUser };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async searchByName(name: string) {
    try {
      if (!name) return { msg: "Name is required", status: 405 };
      const foundUsers = await UserModel.find({
        $text: { $search: name },
      }).exec();
      if (!foundUsers) return { msg: "Not found", status: 404 };
      return { msg: "Users found", status: 200, foundUsers };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async deleteAdmin(agentCode: any) {
    try {
      const deletedAdmin = await UserModel.deleteOne({
        agentCode,
        roles: ["ADMIN"],
      });
      return { msg: "Admin deleted", status: 200, deletedAdmin };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async changeAdminPassword(adminId: string, psw: string) {
    try {
      const foundAdmin = await UserModel.findOne({
        _id: adminId,
      });
      if (!foundAdmin) return { msg: "Not found", status: 404 };
      foundAdmin.password = await argon.hash(psw);
      await foundAdmin.save();
      return { msg: "Password changed successfully", status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getAdmins(filter: AdminFilter) {
    try {
      const page = filter.page || 0;
      const limit = filter.limit || 10;
      const name = filter.name;
      const count = await UserModel.find({ roles: ["ADMIN"] }).count();
      let foundUsers;
      if (!name) {
        foundUsers = await UserModel.find(
          { roles: ["ADMIN"] },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      } else {
        foundUsers = await UserModel.find(
          { $text: { $search: name }, roles: ["ADMIN"] },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      }
      return { msg: "Admins found", status: 200, foundUsers, count };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createAgent({ name, password, phone }: AddAgent) {
    try {
      const newAgent = await AgentModel.create({
        name,
        phone,
        password: await argon.hash(password),
      });
      return { msg: "Agent created", status: 201, newAgent };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
  static async changeAgentPassword(newP: string, agentId: string) {
    try {
      const foundAgent = await AgentModel.findOne({ _id: agentId });
      if (!foundAgent) return { msg: "Agent not found", status: 404 };
      foundAgent.password = await argon.hash(newP);
      await foundAgent.save();
      return { msg: "Agent password changed", status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
  static async editAgent(agentId: string, name: string) {
    try {
      const foundAgent = await AgentModel.findOne({ _id: agentId });
      if (!foundAgent) return { msg: "Agent not found", status: 404 };
      foundAgent.name = name;
      await foundAgent.save();
      return { msg: "Agent edited", status: 200, foundAgent };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
  static async deleteAgent(agentId: string) {
    try {
      const deletedAgent = await AgentModel.deleteOne({ _id: agentId });
      return { msg: "Agent deleted", status: 200, deletedAgent };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
  static async getAgents() {
    try {
      const foundAgents = await AgentModel.find();
      return { msg: "Agents found", status: 200, foundAgents };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async changeCustomerAgent(oldAgent: string, newAgent: string) {
    try {
      const foundAgent = await AgentModel.findOne({ name: newAgent });
      if (!foundAgent) return { msg: "Not found", status: 404 };
      const foundCustomers = await UserModel.updateMany(
        { agentName: oldAgent },
        { $set: { agentName: newAgent } }
      );
      return { msg: "Customer agent changed", status: 200, foundCustomers };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getAgentCustomers(agentName: string) {
    try {
      const foundCustomers = await UserModel.find({
        roles: ["CUSTOMER"],
        agentName,
      });
      return { msg: "Customers found", status: 200, foundCustomers };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createReport(newReport: AddReport) {
    try {
      const createdReport = await ReportModel.create(newReport);
      return { msg: "Report created", status: 201, createdReport };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getReports(
    pagination: Pagination,
    filter: { [key: string]: any; agentName?: string }
  ) {
    try {
      const page = pagination.page || 0;
      const limit = pagination.limit || 10;
      Object.keys(filter).forEach((key) => {
        if (!filter[key] && filter[key] !== false && filter[key] !== 0) {
          delete filter[key];
        }
      });
      const count = await ReportModel.find(filter).count();
      const foundReports = await ReportModel.find(
        filter,
        {},
        { skip: page * limit, limit: limit }
      ).populate("customerId");
      return {
        msg: "Reports found",
        status: 200,
        reports: foundReports,
        count,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getBellysaveCustomers(
    pagination: Pagination,
    filter: any,
    name?: string
  ) {
    try {
      let foundCustomers;
      const page = pagination.page || 0;
      const limit = pagination.limit || 10;
      const count = await BellysaveCustomerModel.find(filter).count();
      if (!name) {
        foundCustomers = await BellysaveCustomerModel.find(
          filter,
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      } else {
        foundCustomers = await BellysaveCustomerModel.find(
          { ...filter, $text: { $search: name } },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      }
      // foundCustomers.forEach(async (customer, index, arr) => {
      //   const date = new Date(customer.date);
      //   const months = new Date().getMonth() - date.getMonth();
      //   arr[index].amountRemoved = months * 1000;
      //   await arr[index].save();
      // });
      return { msg: "Customers found", status: 200, foundCustomers, count };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getAllCustomers(
    role: string,
    pagination: Pagination,
    name?: string
  ) {
    try {
      let foundUsers;

      const page = pagination.page || 0;
      const limit = pagination.limit || 10;
      const count = await UserModel.find({
        roles: role,
      }).count();
      if (!name) {
        foundUsers = await UserModel.find(
          {
            roles: role,
          },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      } else {
        foundUsers = await UserModel.find(
          {
            roles: role,
            $text: { $search: name },
          },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      }
      return { msg: "Users found", status: 200, foundUsers, count };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getCustomers(
    role: string,
    pagination: Pagination,
    filter: CustomersFilter,
    name?: string
  ) {
    try {
      let foundUsers;
      const page = pagination.page || 0;
      const limit = pagination.limit || 10;
      const count = await UserModel.find({
        ...filter,
        roles: role,
      }).count();

      if (!name) {
        foundUsers = await UserModel.find(
          {
            ...filter,
            roles: role,
          },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      } else {
        foundUsers = await UserModel.find(
          {
            ...filter,
            roles: role,
            $text: { $search: name },
          },
          {},
          { skip: page * limit, limit: limit }
        ).select("-password");
      }
      return { msg: "Users found", status: 200, foundUsers, count };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createBellysaveCustomer({
    phone,
    password,
    name,
    gender,
    agentName,
    location,
    bankName,
    accountNumber,
  }: CreateBellysaveCustomer) {
    try {
      const foundLocation = await LocationModel.findOne({ location });
      if (!foundLocation) {
        return { msg: "Location not available", status: 405 };
      }
      const foundAgent = await AgentModel.findOne({ name: agentName });
      if (!foundAgent) {
        return { msg: "Agent not available", status: 405 };
      }
      const newCustomer = await BellysaveCustomerModel.create({
        name,
        phone,
        password: await argon.hash(password),
        gender,
        agentName,
        approved: false,
        location,
        bankName,
        accountNumber,
      });
      return {
        newCustomer,
        msg: "Customer created successfully, pending approval",
        status: 201,
      };
    } catch (err: any) {
      console.log(err.code);
      console.log(err.message);
      console.log(err);
      if (err.code == 11000)
        return { msg: "Duplicate phone number not allowed", status: 405 };
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createCustomer({
    phone,
    password,
    name,
    gender,
    location,
    packageNames,
    agentName,
    priceModifier,
  }: CreateCustomer) {
    try {
      const foundLocation = await LocationModel.findOne({ location });
      if (!foundLocation) {
        return { msg: "Location not available", status: 405 };
      }
      const foundAgent = await AgentModel.findOne({ name: agentName });
      if (!foundAgent) {
        return { msg: "Agent not available", status: 405 };
      }
      const packageName = packageNames[0];
      const {
        status: status2,
        msg: msg2,
        price,
      } = await UserService.getPackagePrice(packageName);
      if (status2 !== 200) return { msg: msg2, status: status2 };
      const newCustomer = await UserModel.create({
        phone,
        password: await argon.hash(password),
        name,
        gender,
        roles: ["CUSTOMER"],
        approved: false,
        location,
        agentName,
        packageNames,
        totalPrice: price! * priceModifier,
      });
      return {
        newCustomer,
        msg: "Customer created successfully, pending approval",
        status: 201,
      };
    } catch (err: any) {
      console.log(err.code);
      console.log(err.message);
      console.log(err);
      if (err.code == 11000)
        return { msg: "Duplicate phone number not allowed", status: 405 };
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createAdmin({ phone, password, name, gender }: CreateAdmin) {
    try {
      const newAdmin = await UserModel.create({
        phone,
        password: await argon.hash(password),
        name,
        gender,
        agentCode: Utils.generateAgentCode(),
        approved: true,
        roles: ["ADMIN"],
      });
      return { newAdmin, msg: "Admin created successfully", status: 201 };
    } catch (err: any) {
      console.log(err.code);
      console.log(err.message);
      console.log(err);
      if (err.code == 11000)
        return { msg: "Duplicate phone number not allowed", status: 405 };
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async approveBellysaveCustomer(customerId: string, agentCode: string) {
    try {
      const { foundCustomer, status, msg } =
        await UserService.getBellysaveCustomer("_id", customerId);
      if (!foundCustomer) return { msg, status };
      foundCustomer.approved = true;
      foundCustomer.agentCode = parseInt(agentCode);
      await foundCustomer.save();
      const { status: status2, msg: msg2 } =
        await HistoryService.addBellysaveCustomerToHistory(customerId);
      if (status !== 201) return { msg: msg2, status: status2 };
      const body = Utils.welcomeTemplate(
        "Bellysave",
        foundCustomer.name,
        foundCustomer.phone,
        foundCustomer.agentName
      );
      await Utils.sendSMS({ to: foundCustomer.phone, body });
      return { msg: "Approved customer", status: status };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async approveCustomer(customerId: string, agentCode: string) {
    try {
      const {
        foundUser,
        status: customerS,
        msg,
      } = await UserService.getUserWithRole(customerId, "CUSTOMER");
      if (!foundUser) return { msg, status: customerS };
      foundUser.approved = true;
      foundUser.agentCode = parseInt(agentCode);
      await foundUser.save();
      const { status, msg: msg2 } = await HistoryService.addCustomerToHistory(
        customerId
      );
      if (status !== 201) return { msg: msg2, status };
      const body = Utils.welcomeTemplate(
        "Bellyfood",
        foundUser.name,
        foundUser.phone,
        foundUser.agentName
      );
      await Utils.sendSMS({ to: foundUser.phone, body });
      return { msg: "Approved customer", status: status };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getBellysavePayments(customerId: string) {
    try {
      const payments = await BellysavePaymentModel.find({ customerId });
      return { msg: "Payments returned", status: 200, payments };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getPayments(customerId: string) {
    try {
      const payments = await PaymentModel.find({ customerId });
      return { msg: "Payments returned", status: 200, payments };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getPackages() {
    try {
      const packages = await PackageModel.find();
      return { msg: "Packages returned", status: 200, packages };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getPackagePrice(name: string) {
    try {
      const packageDetails = await PackageModel.findOne({ name });
      return {
        msg: "Package price returned",
        status: 200,
        price: packageDetails!.price,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async deliverToCustomer(customerId: string) {
    try {
      const { status, msg, foundUser } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (!foundUser) return { msg, status };
      foundUser.delivered = true;
      foundUser.amountPaid = 0;
      await foundUser.save();
      const { status: status2, msg: msg2 } =
        await HistoryService.addDeliveryToHistory(customerId);
      if (status2 !== 201) return { msg: msg2, status: status2 };
      return {
        msg: "Delivered to customer",
        status,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async renewPackage(customerId: string, packageName: PackageName) {
    try {
      const { status, msg, foundUser } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (!foundUser) return { msg, status };
      if (!foundUser.packageNames.includes(packageName))
        return { status: 405, msg: "User didn't subscribe to that package" };
      const { price } = await UserService.getPackagePrice(packageName);
      if (foundUser.amountPaid < price!) {
        return {
          msg: "Customer hasn't finished paying current package",
          status: 405,
        };
      }
      foundUser.amountPaid = 0;
      foundUser.paid = false;
      foundUser.delivered = false;
      await foundUser.save();
      return {
        msg: "Renewed package",
        status,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async changePackage(
    customerId: string,
    newPkgName: string,
    oldPkgName: string
  ) {
    try {
      const { status, msg, foundUser } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (!foundUser) return { msg, status };
      if (!foundUser.packageNames.includes(oldPkgName))
        return { status: 405, msg: "User didn't subscribe to that package" };
      const { price: oldPrice } = await UserService.getPackagePrice(oldPkgName);
      const index = foundUser.packageNames.indexOf(oldPkgName);
      const {
        status: status2,
        msg: msg2,
        price,
      } = await UserService.getPackagePrice(newPkgName);
      if (status2 !== 200) return { msg: msg2, status: status2 };
      foundUser.packageNames.splice(index, 1, newPkgName);
      foundUser.totalPrice = foundUser.totalPrice - oldPrice! + price!;
      foundUser.paid = false;
      foundUser.delivered = false;
      await foundUser.save();
      return {
        msg: "Changed package",
        status: status2,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async deleteCustomer(customerId: string) {
    try {
      const foundUser = await UserModel.findOne({
        _id: customerId,
        roles: "CUSTOMER",
      });
      if (!foundUser) return { msg: "Not found", status: 404 };
      // if (foundUser.amountPaid < foundUser.totalPrice) {
      //   return {
      //     msg: "Customer hasn't finished paying current package",
      //     status: 405,
      //   };
      // }
      const deletedUser = await UserModel.findOneAndDelete({
        _id: customerId,
        roles: "CUSTOMER",
      });
      return { msg: "Deleted customer successfully", deletedUser, status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
}

export default UserService;
