import "dotenv/config";
import Agenda, { Job } from "agenda";
import Config from "../config/db.config";
import otpGenerator from "otp-generator";
import twilio from "twilio";
import UserModel from "../models/user.model";
import BellysaveCustomerModel from "../models/bellysave-customer.model";
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE!;
const client = twilio(accountSid, authToken);

class Utils {
  static createAgenda() {
    const agenda = new Agenda({ db: { address: Config.connection } });
    return agenda;
  }

  static generateAgentCode() {
    return otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  }

  static welcomeTemplate(
    service: string,
    name: string,
    phone: string,
    password?: string
  ) {
    if (service == "Bellyfood") {
      return `Welcome to BELLYFOOD, ${name}. We promise to supply healthy food to you.\n
      Please always track your payments on our website bellyfoodafrica.com or whatsapp 08053634000.\n
      Login details: \n
      Phone: ${
        "0" + phone.substring(phone.length - 10)
      }, Password: ${password}`;
    } else {
      return `Welcome to BELLYSAVE, ${name}. Your money is safe.\n
      Please always track your payments on our website bellyfoodafrica.com or whatsapp 08053634000.\n
      Login details: \n
      Phone: ${
        "0" + phone.substring(phone.length - 10)
      }, Password: ${password}`;
    }
  }

  static async sendSMS({ to, body }: { to: string; body: string }) {
    client.messages
      .create({
        messagingServiceSid,
        to,
        body,
      })
      .then((message) => console.log(message.sid))
      .catch((err) => console.error(err));
  }

  static log(agenda: Agenda) {
    agenda.define("log", async (job: Job) => {
      console.log("foundUsers");
    });
    return agenda.create("log", {});
  }

  static background(agenda: Agenda) {
    agenda.define("background", async (job: Job) => {
      const foundUsers = await UserModel.find({
        roles: ["CUSTOMER"],
        paid: false,
      });
      foundUsers.forEach(async (user, index, arr) => {
        if (new Date() >= new Date(user.dueDate)) {
          // await UserModel.updateOne(
          //   { _id: user._id },
          //   {
          //     $set: {
          //       amountPaid: 0.9 * user.amountPaid,
          //     },
          //   }
          // );
          user.amountPaid = 0.9 * user.amountPaid;
          user.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          user.inactive = true;
          user.late = true;
          await user.save();
        }
      });
      const foundCustomers = await BellysaveCustomerModel.find({});
      foundCustomers.forEach(async (customer, index, arr) => {
        const date = new Date(customer.date);
        const months = new Date().getMonth() - date.getMonth();
        customer.amountRemoved = months * 1000;
        await customer.save();
      });
    });
    return agenda.create("background", {});
  }

  static time(agenda: Agenda) {
    agenda.define("time", async (job: Job) => {
      console.log(new Date());
      if (new Date() >= new Date("2022-08-05T16:20")) {
        console.log("Removed job time");

        await job.remove();
      }
    });
    return agenda.create("time", {});
  }
}

export default Utils;
