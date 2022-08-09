import { NextFunction, Request, Response } from "express";
import PaymentService from "../services/payment.service";
import { AddPayment } from "../typings";

class PaymentController {
  static async addPayment(
    req: Request<{}, {}, AddPayment, {}>,
    res: Response,
    next: NextFunction
  ) {
    const { status, msg, newPayment } = await PaymentService.addPayment(
      req.body
    );
    if (status !== 201) return res.status(status).json({ msg, status });
    return res.status(status).json({ msg, newPayment, status });
  }
}

export default PaymentController;
