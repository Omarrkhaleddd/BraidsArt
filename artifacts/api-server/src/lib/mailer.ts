import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface BookingNotificationData {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  designName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  withExtension?: boolean;
  finalPrice?: number;
}

export async function sendBookingNotification(data: BookingNotificationData): Promise<void> {
  // ──────────────────────────────────────────────────────────────
  // ADMIN EMAIL: Set the NOTIFICATION_EMAIL secret in Replit Secrets
  // (Tools → Secrets → NOTIFICATION_EMAIL = your@email.com)
  // ──────────────────────────────────────────────────────────────
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    logger.warn("NOTIFICATION_EMAIL not set, skipping booking notification");
    return;
  }

  const subject = `New Booking: ${data.designName} on ${data.date}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #faf7f4; padding: 32px; border-radius: 12px;">
      <h2 style="color: #8B4513; font-size: 24px; margin-bottom: 8px;">New Appointment Booked</h2>
      <p style="color: #6b5a4e; margin-bottom: 24px;">A new booking has been made at BraidsArt.</p>

      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
        <tr style="background: #c17b4a; color: white;">
          <td colspan="2" style="padding: 12px 16px; font-weight: bold; font-size: 16px;">Booking Details</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; width: 40%; border-bottom: 1px solid #f0e8e0;">Style</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.designName}${data.withExtension ? ' <span style="background:#c17b4a;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">+Extension</span>' : ""}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Date</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Time</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.startTime} – ${data.endTime}</td>
        </tr>
        ${data.finalPrice != null ? `
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Total Price</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;"><strong>${data.finalPrice} EGP</strong></td>
        </tr>` : ""}
        <tr style="background: #fffaf7;">
          <td colspan="2" style="padding: 12px 16px; font-weight: bold; font-size: 14px; color: #8B4513; border-bottom: 1px solid #f0e8e0; border-top: 8px solid #f0e8e0;">Customer Info</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Name</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.customerName}</td>
        </tr>
        ${data.customerPhone ? `
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Phone</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.customerPhone}</td>
        </tr>` : ""}
        ${data.customerEmail ? `
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold; border-bottom: 1px solid #f0e8e0;">Email</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0e8e0;">${data.customerEmail}</td>
        </tr>` : ""}
        ${data.notes ? `
        <tr>
          <td style="padding: 12px 16px; color: #8B4513; font-weight: bold;">Notes</td>
          <td style="padding: 12px 16px;">${data.notes}</td>
        </tr>` : ""}
      </table>

      <p style="margin-top: 24px; color: #9b8b7e; font-size: 13px;">Sent from BraidsArt booking system.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"BraidsArt" <${process.env.SMTP_USER}>`,
      to: notificationEmail,
      subject,
      html,
    });
    logger.info({ to: notificationEmail }, "Booking notification email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send booking notification email");
  }
}
