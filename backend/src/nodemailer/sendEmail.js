const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const verifyEmail = async (template, email, data = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD
      }
    });

    await transporter.verify();

    let subject;
    let html;


   if (template === "register") {
  subject = "Verify your BuddyCode account";
  const templatePath = path.join(
    __dirname,
    "templates",
    "otpVerification.html"
  );
  html = fs.readFileSync(templatePath, "utf-8");
  html = html.replace("{{OTP_CODE}}", data.otp);
}

    else if (template === "forgetPassword") {
      subject = "Reset your BuddyCode password";
      const templatePath  = path.join(
        __dirname ,
        "templates",
        "forgotPasswordOtp.html"
      );
      html  = fs.readFileSync(templatePath, "utf-8");
     html = html.replace("{{OTP_CODE}}", data.otp);
    }

    else if (template === "resetpaasword") {
      subject = "Your BuddyCode password has been reset";
      const templetpath = path.join(__dirname ,
        "templates",
        "passwordResetSuccess.html"
      );

      html = fs.readFileSync(templetpath ,  "utf-8");
    }

    else {
      throw new Error("Invalid email template type");
    }

    await transporter.sendMail({
      from: `"BuddyCode" <${process.env.APP_USER}>`,
      to: email,
      subject,
      html
    });

    console.log(`Email sent to ${email} [${template}]`);

  } catch (err) {
    console.error("Email Send Error:", err.message);
    throw err;
  }
};

module.exports = verifyEmail;
