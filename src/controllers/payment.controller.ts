import { NextFunction, Request, Response } from "express";
import PaymentService from "../services/payment.service";
import { AddPayment } from "../typings";

class PaymentController {
  static async addPayment(
    req: Request<{}, {}, AddPayment, {}>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, msg, newPayment } = await PaymentService.addPayment(
        req.body
      );
      if (status !== 201) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, newPayment, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }

  static async addBellysavePayment(
    req: Request<{}, {}, AddPayment, {}>,
    res: Response
  ) {
    try {
      const { msg, status, newPayment } =
        await PaymentService.addBellysavePayment(req.body);
      if (status !== 201) return res.status(status).json({ msg, status });
      return res.status(status).json({ msg, newPayment, status });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "An error occurred", status: 500 });
    }
  }
}

export default PaymentController;
