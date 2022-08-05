import * as argon from "argon2";
import UserModel from "../models/user.model";
import {
  CreateAdmin,
  CreateCustomer,
  CustomersFilter,
  PackageName,
} from "../typings";
import HistoryService from "./history.service";
import PaymentModel from "../models/payment.model";
import PackageModel from "../models/package.model";
import Utils from "../utils";

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

  static async getAdmins() {
    try {
      const foundUsers = await UserModel.find({ roles: ["ADMIN"] });
      return { msg: "Admins found", status: 200, foundUsers };
    } catch (err) {
      console.log(err);
      return { msg: "An error occurred", status: 500 };
    }
  }

  static async getCustomers(role: string, filter?: CustomersFilter) {
    try {
      let foundUsers;
      if (!filter) return { msg: "", status: 405 };
      if (Object.keys(filter!).length === 0) {
        foundUsers = await UserModel.find({
          roles: role,
        });
      } else {
        foundUsers = await UserModel.find({
          ...filter,
          roles: role,
        });
      }
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
    packageNames,
    priceModifier,
  }: CreateCustomer) {
    try {
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
      if (!foundUser) return { msg, status };
      foundUser.delivered = true;
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
      if (foundUser.amountPaid < foundUser.totalPrice) {
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
