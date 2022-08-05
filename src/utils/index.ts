import Agenda, { Job } from "agenda";
import Config from "../config/db.config";
import otpGenerator from "otp-generator";

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

  static log(agenda: Agenda) {
    agenda.define("log", async (job: Job) => {
      // const foundUsers = await UserService.getCustomers("ADMIN", {});
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
