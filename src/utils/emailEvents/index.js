
import { EventEmitter } from "node:events";
import { sendEmail } from "../../service/sendEmail.js";
import { hash } from "../index.js"
import { nanoid } from "nanoid";
import { otpModel } from "../../DB/models/otp.model.js";
import { emailTemplate } from "../../service/email.template.js";
export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email, id } = data;
  const otp = nanoid(4);
  const hashedOtp = hash({ plaintext: otp });
  await otpModel.create({ userId: id, otp: hashedOtp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  const isSend = await sendEmail({
    to: email,
    subject: "Confirm Email",
    html: emailTemplate({otp , subject: "Confirm Email"})
  });
  if (!isSend) {
    throw new Error("Please enter exist email", { cause: 400 });
  }
});


eventEmitter.on("sendOtp", async (data) => {
  const { email, otp } = data;
  const isSend = await sendEmail({
    to: email,
    subject: "otp",
    html: `<p>${otp}</p>`
  });
  if (!isSend) {
    throw new Error("Please enter exist email", { cause: 400 });
  }
});