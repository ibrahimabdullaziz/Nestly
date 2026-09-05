import nodemailer from "nodemailer";
import config from "../../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  //   const html = `
  //     <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
  //       <h1 style="color: #4CAF50;">Welcome ${username}</h1>
  //       <p>Thank you for signing up. Click the button below to get started:</p>
  //       <a href="https://example.com" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Account</a>
  //     </div>
  // `;

  const mailOptions = {
    from: config.mailUser,
    to: to,
    subject: subject,
    html: html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
