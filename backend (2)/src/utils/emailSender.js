const nodemailer = require("nodemailer");

const emailSender = async (email, payload) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASS
        }
    });

    const mailOptions = {
        from: `"DisasterGuard" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: payload.subject,
        text: payload.text || "DisasterGuard emergency report update",
        html: payload.html || ""
    };

    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(
            `Email delivery failed for ${email}:`,
            error.message
        );

        throw error;
    }
};

module.exports = emailSender;