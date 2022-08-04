import jwt from "jsonwebtoken";
import * as argon from "argon2";
import otpGenerator from "otp-generator";
import UserModel from "../models/user.model";
import {
  AuthDto,
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
} from "../typings";
import HistoryModel from "../models/history.model";
import HistoryService from "./history.service";
import PaymentModel from "../models/payment.model";
import PackageModel from "../models/package.model";

interface LoginFilter {
  phone: string;
  name?: string;
}

class UserService {
  static generateAgentCode() {
    return otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  }

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

  static async getCustomers(filter: CustomersFilter) {
    try {
      const foundUsers = await UserModel.find({
        ...filter,
        roles: filter.role,
      });
      return { msg: "Users found", status: 200, foundUsers };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createCustomer({
    phone,
    password,
    name,
    gender,
    location,
    agentCode,
    packageDetails,
  }: CreateCustomer) {
    try {
      const newCustomer = await UserModel.create({
        phone,
        password: await argon.hash(password),
        name,
        gender,
        agentCode,
        roles: ["CUSTOMER"],
        approved: false,
        location,
        packageDetails,
      });
      return {
        newCustomer,
        msg: "Customer created successfully, pending approval",
        status: 201,
      };
    } catch (err) {
      console.log(err);
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
        agentCode: UserService.generateAgentCode(),
        approved: true,
        roles: ["ADMIN"],
      });
      return { newAdmin, msg: "Admin created successfully", status: 201 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async approveCustomer(customerId: string) {
    try {
      const {
        foundUser,
        status: customerS,
        msg,
      } = await UserService.getUserWithRole(customerId, "CUSTOMER");
      if (customerS !== 200) return { msg, status: customerS };
      foundUser!.approved = true;
      await foundUser!.save();
      const { status, msg: msg2 } = await HistoryService.addCustomerToHistory(
        customerId
      );
      if (status !== 201) return { msg2, status };
      return { msg: "Approved customer", status: status };
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
      if (status !== 200) return { msg, status };
      foundUser!.delivered = true;
      await foundUser!.save();
      return {
        msg: "Delivered to customer",
        status,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async renewPackage(customerId: string) {
    try {
      const { status, msg, foundUser } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (status !== 200) return { msg, status };
      if (foundUser!.amountPaid < foundUser!.packageDetails!.price!) {
        return {
          msg: "Customer hasn't finished paying current package",
          status: 405,
        };
      }
      foundUser!.amountPaid = 0;
      await foundUser!.save();
      return {
        msg: "Renewed package",
        status,
      };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async changePackage(customerId: string, name: string) {
    try {
      const { status, msg, foundUser } = await UserService.getUserWithRole(
        customerId,
        "CUSTOMER"
      );
      if (status !== 200) return { msg, status };
      if (foundUser!.amountPaid < foundUser!.packageDetails!.price!) {
        return {
          msg: "Customer hasn't finished paying current package",
          status: 405,
        };
      }
      foundUser!.amountPaid = 0;
      const {
        status: status2,
        msg: msg2,
        price,
      } = await UserService.getPackagePrice(name);
      if (status2 !== 200) return { msg: msg2, status: status2 };
      type pName = "NANO" | "MICRO" | "MEGA" | "GIGA" | "OGA NA BOSS";
      foundUser!.packageDetails = {
        name: name! as pName,
        price: price!,
      };
      await foundUser!.save();
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
      if (foundUser!.amountPaid < foundUser!.packageDetails!.price!) {
        return {
          msg: "Customer hasn't finished paying current package",
          status: 405,
        };
      }
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
