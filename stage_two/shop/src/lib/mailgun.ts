import "server-only";

import { eq } from "drizzle-orm";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { db } from "@/db";
import { emailEvents } from "@/db/schema/email-events";
import { buildOrderConfirmationEmail, getOrderEmailEventKey, type OrderEmailItem } from "@/lib/order-email";
import { buildWelcomeEmail, getWelcomeEmailEventKey } from "@/lib/welcome-email";

type WelcomeUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type OrderConfirmation = {
  orderId: string;
  name: string;
  email: string;
  items: OrderEmailItem[];
};

export async function sendOrderConfirmationEmail(order: OrderConfirmation) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  const missingConfiguration = [
    !apiKey ? "MAILGUN_API_KEY" : null,
    !domain ? "MAILGUN_DOMAIN" : null,
    !fromEmail ? "MAILGUN_FROM_EMAIL" : null,
  ].filter((item): item is string => item !== null);

  if (missingConfiguration.length > 0) {
    console.error(`[mailgun] Order confirmation skipped; missing ${missingConfiguration.join(", ")}.`);
    return false;
  }

  if (!apiKey || !domain || !fromEmail) return false;

  const eventKey = getOrderEmailEventKey(order.orderId);

  try {
    const [claim] = await db
      .insert(emailEvents)
      .values({
        eventKey,
        eventType: "order_confirmation",
        recipient: order.email,
        status: "sending",
      })
      .onConflictDoNothing()
      .returning({ eventKey: emailEvents.eventKey });

    if (!claim) {
      return false;
    }

    const mailgun = new Mailgun(formData);
    const client = mailgun.client({ username: "api", key: apiKey });
    const content = buildOrderConfirmationEmail({
      orderId: order.orderId,
      name: order.name,
      items: order.items,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });

    await client.messages.create(domain, {
      from: fromEmail,
      to: order.email,
      ...content,
    });

    await db
      .update(emailEvents)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailEvents.eventKey, eventKey));
    return true;
  } catch (error) {
    try {
      await db
        .update(emailEvents)
        .set({ status: "failed" })
        .where(eq(emailEvents.eventKey, eventKey));
    } catch {
      // Keep an email logging failure from blocking checkout.
    }
    const status =
      typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number"
        ? error.status
        : "unknown";
    console.error(`[mailgun] Order confirmation failed (status: ${status}).`);
    return false;
  }
}

export async function sendWelcomeEmail(user: WelcomeUser) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const missingConfiguration = [
    !user.email ? "recipient email" : null,
    !apiKey ? "MAILGUN_API_KEY" : null,
    !domain ? "MAILGUN_DOMAIN" : null,
    !fromEmail ? "MAILGUN_FROM_EMAIL" : null,
  ].filter((item): item is string => item !== null);

  if (missingConfiguration.length > 0) {
    console.error(`[mailgun] Welcome email skipped; missing ${missingConfiguration.join(", ")}.`);
  }

  if (!user.email || !apiKey || !domain || !fromEmail) {
    return;
  }

  const eventKey = getWelcomeEmailEventKey(user.id);

  try {
    const [claim] = await db
      .insert(emailEvents)
      .values({
        eventKey,
        eventType: "welcome",
        userId: user.id,
        recipient: user.email,
        status: "sending",
      })
      .onConflictDoNothing()
      .returning({ eventKey: emailEvents.eventKey });

    if (!claim) {
      return;
    }

    const mailgun = new Mailgun(formData);
    const client = mailgun.client({ username: "api", key: apiKey });
    const content = buildWelcomeEmail({ name: user.name, appUrl });

    await client.messages.create(domain, {
      from: fromEmail,
      to: user.email,
      ...content,
    });

    await db
      .update(emailEvents)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailEvents.eventKey, eventKey));
  } catch (error) {
    try {
      await db
        .update(emailEvents)
        .set({ status: "failed" })
        .where(eq(emailEvents.eventKey, eventKey));
    } catch {
      // Keep an email logging failure from breaking authentication.
    }
    const status =
      typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number"
        ? error.status
        : "unknown";
    console.error(
      `[mailgun] Welcome email failed (status: ${status}); check Mailgun sender/domain, sandbox recipient authorization, API credentials, and email_events migration.`,
    );
  }
}