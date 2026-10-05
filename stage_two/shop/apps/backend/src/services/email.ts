import { eq } from "drizzle-orm";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { db } from "../db/index.ts";
import { emailEvents } from "../db/schema/email-events.ts";

type WelcomeUser = { id: string; name?: string | null; email?: string | null };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function sendWelcomeEmail(user: WelcomeUser) {
  const { email, id, name } = user;
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  if (!email || !apiKey || !domain || !fromEmail) return;

  const eventKey = `welcome:${id}`;
  try {
    const [claim] = await db.insert(emailEvents).values({
      eventKey,
      eventType: "welcome",
      userId: id,
      recipient: email,
      status: "sending",
    }).onConflictDoNothing().returning({ eventKey: emailEvents.eventKey });
    if (!claim) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const productsUrl = new URL("/products", appUrl).toString();
    const greeting = name?.trim() || "there";
    const client = new Mailgun(formData).client({ username: "api", key: apiKey });
    await client.messages.create(domain, {
      from: fromEmail,
      to: email,
      subject: "Welcome to Northstar",
      text: `Hi ${greeting},\n\nThanks for joining Northstar. Explore our collection at ${productsUrl}.\n\nThe Northstar team`,
      html: `<p>Hi ${escapeHtml(greeting)},</p><p>Thanks for joining Northstar.</p><p><a href="${escapeHtml(productsUrl)}">Explore the collection</a></p>`,
    });

    await db.update(emailEvents).set({ status: "sent", sentAt: new Date() })
      .where(eq(emailEvents.eventKey, eventKey));
  } catch (error) {
    await db.update(emailEvents).set({ status: "failed" })
      .where(eq(emailEvents.eventKey, eventKey)).catch(() => undefined);
    const status = typeof error === "object" && error !== null && "status" in error
      ? error.status
      : "unknown";
    console.error(`[mailgun] Welcome email failed (status: ${String(status)}).`);
  }
}
export type WelcomeEmailPayload = {
  id: string;
  name: string | null;
  email: string | null;
};

export type OrderEmailPayload = {
  orderId: string;
  email: string;
  customerName: string;
  subtotal: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

export function shouldSendWelcomeEmail(payload: WelcomeEmailPayload) {
  return Boolean(payload.email && payload.id);
}

export function shouldSendOrderEmail(payload: OrderEmailPayload) {
  return Boolean(payload.orderId && payload.email && payload.items.length > 0);
}
