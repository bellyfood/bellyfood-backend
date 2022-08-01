import { NextFunction, Request, Response, Express } from "express";
import passport from "passport";

class Auth {
  static async isAdmin(req: Request, res: Response, next: NextFunction) {
    console.log(req.user!.roles);
    const { roles } = req.user!;
    if (!roles.includes("ADMIN")) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    next();
  }

  static async isSuperAdmin(req: Request, res: Response, next: NextFunction) {
    console.log(req.user!.roles);
    const { roles } = req.user!;
    if (!roles.includes("SUPERADMIN")) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    next();
  }
}

export default Auth;
