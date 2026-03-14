import nodemailer from "nodemailer";
import { logger } from "../logger";

/**
 * Nodemailer transporter configured with SMTP settings from environment variables
 */
export const mailTransporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: Number(process.env.SMTP_PORT),
   secure: false,
   auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
   },
    tls: {
       rejectUnauthorized: false
    }
});

/**
 * Parameters for sending an email
 */
type SendMailParams = {
    to: string,
    subject: string,
    content: string
};

/**
 * Sends an email using the configured SMTP transporter
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param content - HTML content of the email
 */
export async function sendMail({ to, subject, content }: SendMailParams) {
    try {
        await mailTransporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html: content
        });
    } catch (err) {
        logger.error({ err }, "sendMail failed");
    }
}