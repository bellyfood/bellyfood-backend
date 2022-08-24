import "dotenv/config";
import Agenda, { Job } from "agenda";
import Config from "../config/db.config";
import otpGenerator from "otp-generator";
import twilio from "twilio";
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
    return agenda;
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
