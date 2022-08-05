import { NextFunction, Request, Response, Express } from "express";

class Auth {
  static async isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    console.log(req.user.roles);
    const { roles } = req.user;
    if (!roles.includes("ADMIN")) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    next();
  }

  static async isSuperAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(404).json({ msg: "Not found" });
    console.log(req.user.roles);
    const { roles } = req.user;
    if (!roles.includes("SUPERADMIN")) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    next();
  }
}

export default Auth;
