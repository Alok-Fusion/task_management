import nodemailer from "nodemailer";
import { config } from "../config/app.config";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
});

export const sendEmail = async (
    to: string,
    subject: string,
    html: string
): Promise<void> => {
    if (!config.SMTP_USER || !config.SMTP_PASS) {
        console.warn("[Email] SMTP credentials not configured. Skipping email.");
        return;
    }
    try {
        await transporter.sendMail({
            from: config.SMTP_FROM,
            to,
            subject,
            html,
        });
        console.log(`[Email] Sent "${subject}" to ${to}`);
    } catch (error) {
        console.error("[Email] Failed to send email:", error);
    }
};
