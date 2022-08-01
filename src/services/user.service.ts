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

  static async getCustomer(customerId: string) {
    try {
      const foundUser = await UserModel.findOne({ _id: customerId });
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
        roles: [filter.role],
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
    approved,
    location,
    agentCode,
    packageDetails,
  }: CreateCustomer) {
    try {
      const newCustomer = await UserModel.create({
        phone,
        password,
        name,
        gender,
        agentCode,
        roles: ["CUSTOMER"],
        approved: approved || false,
        location,
        packageDetails,
      });
      return { newCustomer, msg: "Customer created successfully", status: 201 };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async createAdmin({ phone, password, name, gender }: CreateAdmin) {
    try {
      const newAdmin = await UserModel.create({
        phone,
        password,
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
      } = await UserService.getCustomer(customerId);
      if (customerS !== 200) return { msg, status: customerS };
      foundUser!.approved = true;
      await foundUser!.save();
      const { status } = await HistoryService.addCustomerToHistory(customerId);
      return { msg: "Approved customer", status: status };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }
}

export default UserService;
