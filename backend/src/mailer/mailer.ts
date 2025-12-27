import nodemailer from "nodemailer";
import { logger } from "../logger";

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

type SendMailParams = {
    to: string,
    subject: string,
    content: string
};

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