const nodeMailer = require('nodemailer');
require('dotenv').config(); // make sure this is used properly

console.log("SMTP FROM:", process.env.SMTP_FROM_EMAIL);

async function sendEmail(email, subject, body) {
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    secure: true,
    port: process.env.SMTP_PORT || 465,
    auth: {
      user: process.env.SMTP_FROM_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // <<< key line to bypass certificate error
    },
  });

  const receiver = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: subject,
    html: body,
  };

  transporter.sendMail(receiver, (error, emailResponse) => {
    if (error) {
      console.error("❌ Email not sent:", error);
    } else {
      console.log("✅ Email sent successfully");
    }
  });
}

module.exports = sendEmail;
