const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const verifyEmail = async (template, email, data = {}) => {
  const t = (template || "").toLowerCase();
  let subject = "";
  let html = "";

  try {
    if (t === "register") {
      subject = "Verify your BuddyCode account";
      const templatePath = path.join(__dirname, "templates", "otpVerification.html");
      html = fs.readFileSync(templatePath, "utf-8");
      if (data.otp) html = html.replace("{{OTP_CODE}}", data.otp);
    } else if (t === "forgetpassword" || t === "forgotpassword") {
      subject = "Reset your BuddyCode password";
      const templatePath = path.join(__dirname, "templates", "forgotPasswordOtp.html");
      html = fs.readFileSync(templatePath, "utf-8");
      if (data.otp) html = html.replace("{{OTP_CODE}}", data.otp);
    } else if (t === "resetpassword" || t === "resetpaasword") {
      subject = "Your BuddyCode password has been reset";
      const templatePath = path.join(__dirname, "templates", "passwordResetSuccess.html");
      html = fs.readFileSync(templatePath, "utf-8");
    } else {
      throw new Error(`Invalid email template type: ${template}`);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"BuddyCode" <${process.env.APP_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`Email successfully sent to ${email} [${template}]`);
  } catch (err) {
    console.error(`Email Send Error [${template}]:`, err.message);
    if (data.otp) {
      console.log(`🔑 [DEV OTP FALLBACK] OTP for ${email}: ${data.otp}`);
    }
    // Do not crash the entire request if SMTP/Gmail fails in local dev; allow flow to continue
  }
};

module.exports = verifyEmail;

module.exports = verifyEmail;
