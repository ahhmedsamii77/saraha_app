import nodemailer from "nodemailer"
export async function sendEmail({ to, html, subject }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  });
  const info = await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to: to || process.env.NODEMAILER_USER,
    subject: subject || "Hello ✔",
    html: html || "<b>Hello</b>"
  });
  if (info.accepted.length == 0) {
    return false;
  }
  return true;
}


