// lib/emailService.ts
// Server-side email service
// Can be configured with any SMTP provider (Gmail, SendGrid, Resend, etc.)

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export function welcomeEmailTemplate(
  name: string,
  membershipId: string,
  department: string
): { subject: string; html: string } {
  return {
    subject: "Welcome to Mind Mesh Club!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6C3CE1;">Welcome, ${name}!</h1>
        <p>Your membership has been approved. We're excited to have you on board!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Membership ID:</strong> ${membershipId}</p>
          <p><strong>Department:</strong> ${department}</p>
        </div>
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Best regards,<br/>Mind Mesh Club Team</p>
      </div>
    `,
  };
}

export function promotionEmailTemplate(
  name: string,
  previousRole: string,
  newRole: string
): { subject: string; html: string } {
  return {
    subject: `Promotion to ${newRole}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6C3CE1;">Congratulations, ${name}!</h1>
        <p>You have been promoted from <strong>${previousRole}</strong> to <strong>${newRole}</strong>.</p>
        <p>Keep up the great work!</p>
        <p>Best regards,<br/>Mind Mesh Club Team</p>
      </div>
    `,
  };
}

export function registrationConfirmationTemplate(
  userName: string,
  eventTitle: string,
  eventDate: string,
  ticketId: string
): { subject: string; html: string } {
  return {
    subject: `Registration Confirmed: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6C3CE1;">Registration Confirmed!</h1>
        <p>Hi ${userName},</p>
        <p>You are registered for <strong>${eventTitle}</strong> on <strong>${eventDate}</strong>.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
        </div>
        <p>Please keep your ticket ID for check-in at the event.</p>
        <p>Best regards,<br/>Mind Mesh Club Team</p>
      </div>
    `,
  };
}

export function designationEmailTemplate(
  name: string,
  designation: string,
  department: string
): { subject: string; html: string } {
  return {
    subject: `Designation Assigned: ${designation}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6C3CE1;">Congratulations, ${name}!</h1>
        <p>You have been assigned the designation: <strong>${designation}</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Department:</strong> ${department}</p>
        </div>
        <p>Best regards,<br/>Mind Mesh Club Team</p>
      </div>
    `,
  };
}

// Send email function - uses fetch to a configurable email endpoint
// For production, configure EMAIL_WEBHOOK_URL to point to your email service
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Email] No EMAIL_WEBHOOK_URL configured, skipping email:", options.subject);
    return false;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    return response.ok;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

// Generate a unique ticket ID
export function generateTicketId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ticketId = "TKT-";
  for (let i = 0; i < 8; i++) {
    ticketId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ticketId;
}

// Generate QR code URL (using free QR code API)
export function generateQRCode(ticketId: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketId)}`;
}

// Backward-compatible registration email sender
export async function sendRegistrationEmail(
  userEmail: string,
  userName: string,
  eventData: {
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    organizerName: string;
    price: number;
    discountPrice?: number | null;
  }
): Promise<{ success: boolean; ticketId: string }> {
  try {
    const ticketId = generateTicketId();
    const template = registrationConfirmationTemplate(
      userName,
      eventData.title,
      eventData.date,
      ticketId
    );
    const sent = await sendEmail({ to: userEmail, ...template });
    return { success: sent, ticketId };
  } catch (error) {
    console.error("Registration email failed:", error);
    return { success: false, ticketId: generateTicketId() };
  }
}
