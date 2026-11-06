import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((error) => {
    if(error){
        console.error("Mail transporter error: ", error);
    } else {
        console.log("Mail server ready...");
    }
});

export const sendOtpMail = async (to, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Dharma AI's Password Reset",
        html:`<p>
                Dear User, we have received a request to reset your password.
                <br/>Your OTP to reset your password is <b>${otp}</b>.
                <br/>It will expire after 5 minutes.
                <br/>Do not share this code with anyone.
              </p>`,
    });
}

// Escape user text so someone can't inject HTML into the email you receive
const escapeHtml = (str = "") =>
    String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

export const sendContactMail = async ({ name, email, subject, message }) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER,
        replyTo: email, // hitting "Reply" in Gmail answers the visitor directly
        subject: `Dharma AI Contact: ${subject}`,
        html: `<p>
                <b>Name:</b> ${escapeHtml(name)}<br/>
                <b>Email:</b> ${escapeHtml(email)}<br/>
                <b>Subject:</b> ${escapeHtml(subject)}<br/><br/>
                ${escapeHtml(message).replace(/\n/g, "<br/>")}
              </p>`,
    });
};