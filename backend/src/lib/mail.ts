import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.SMTP_FROM || "RACEPORTAL <noreply@raceportal.local>";
  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    return { ok: true as const, messageId: info.messageId };
  } catch (error) {
    console.error("[mail]", error);
    return { ok: false as const, error };
  }
}
