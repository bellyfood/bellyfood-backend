import UserModel from "../models/user.model";
import jwt from "jsonwebtoken";
import * as argon from "argon2";
import { AuthDto } from "../typings";

interface LoginFilter {
  phone: string;
  name?: string;
}

class AuthService {
  static async login({ phone, password, name }: AuthDto) {
    const filter: LoginFilter = {
      phone,
    };
    name && (filter.name = name);
    try {
      const foundUser = await UserModel.findOne(filter);
      if (!foundUser) return { msg: "Not found", status: 404 };
      const pswCorrect = await argon.verify(foundUser.password!, password);
      if (!pswCorrect) return { msg: "Credentials incorrect", status: 401 };
      if (!foundUser.approved)
        return { msg: "Not approved yet! Please contact agent", status: 401 };
      const { access_token } = await AuthService.signToken(
        foundUser._id.toString(),
        foundUser.phone!
      );
      foundUser.lastLogin = new Date();
      await foundUser.save();
      return { msg: "Logged in", access_token, status: 200 };
    } catch (err) {
      console.log(err);
      return { msg: "Error occurred", status: 500 };
    }
  }

  static async signToken(userId: string, phone: string) {
    const payload = {
      sub: userId,
      phone,
    };
    const secret = process.env.JWT_SECRET!;

    const token = await jwt.sign(payload, secret, {
      expiresIn: "4h",
    });
    return {
      access_token: token,
    };
  }
}

export default AuthService;
