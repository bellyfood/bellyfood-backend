import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import userRouter from "./routes/user.routes";
import Config from "./config/db.config";
import * as argon from "argon2";
import passport from "passport";
import passportJwt, { StrategyOptions } from "passport-jwt";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import UserModel from "./models/user.model";
import { User } from "./typings";
import packageModel from "./models/package.model";
import paymentRouter from "./routes/payment.routes";
import superRouter from "./routes/super.routes";

const PORT = process.env.PORT || 8000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

// Super Admin can upgrade, downgrade and delete customers and history
//

const cookieExtractor = (req: any) => {
  let token = null;
  if (req.headers.cookie) {
    for (let ck of req.headers.cookie.split("; ")) {
      if (ck.split("=")[0] === "bellyfood") {
        token = ck.split("=")[1];
      }
    }
  }
  return token;
};

const opts: StrategyOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET!,
};
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    const foundUser: User | null = await UserModel.findOne(jwt_payload);
    if (!foundUser) return done(null, false);
    return done(null, foundUser);
  })
);

const allowedOrigins = ["http://localhost:8080"];
//allowing CORS
const corsOption: CorsOptions = {
  origin: (
    requestOrigin: string | undefined,
    callback: (b: Error | null, c: boolean) => void
  ) => {
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if (!requestOrigin) return callback(null, true);
    if (allowedOrigins.indexOf(requestOrigin) === -1) {
      let msg =
        "The CORS policy for this site does not " +
        "allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  exposedHeaders: ["x-auth-token"],
};
app.use(cors(corsOption));
app.use("/api/v1/auth", authRouter);
app.use(
  "/api/v1/users",
  passport.authenticate("jwt", { session: false }),
  userRouter
);
app.use(
  "/api/v1/payments",
  passport.authenticate("jwt", { session: false }),
  paymentRouter
);
app.use(
  "/api/v1/super",
  passport.authenticate("jwt", { session: false }),
  superRouter
);

app.get("/api/v1/test", async (req: Request, res: Response) => {
  return res.json(await packageModel.find());
});
app.use("*", (req, res: Response, next) => {
  return res.status(404).json({
    status: 404,
    message: "Not found, invalid route",
  });
});

// app.use((error: any, req: Request, res: Response, next: NextFunction) => {
//   //console.log(error);
//   const status = error.status || 500;
//   const message = error.message;

//   res.status(status).json({
//     message: message,
//     status: status,
//   });
// });

app.listen(PORT, async () => {
  await Config.connect();
  console.log(`Server listening on port ${PORT}`);
});
