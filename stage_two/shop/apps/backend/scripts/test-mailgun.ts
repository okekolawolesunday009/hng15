import "dotenv/config";
import formData from "form-data";
import Mailgun from "mailgun.js";
import { z } from "zod";

const recipient = process.argv[2] ?? process.env.MAILGUN_TEST_TO;
const recipientResult = z.string().email().safeParse(recipient);
const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const fromEmail = process.env.MAILGUN_FROM_EMAIL;

if (!recipientResult.success) {
  console.error("Usage: npm run mailgun:test -- recipient@example.com");
  console.error("Or set MAILGUN_TEST_TO in your local environment.");
  process.exit(1);
}

if (!apiKey || !domain || !fromEmail) {
  const missing = [
    !apiKey ? "MAILGUN_API_KEY" : null,
    !domain ? "MAILGUN_DOMAIN" : null,
    !fromEmail ? "MAILGUN_FROM_EMAIL" : null,
  ].filter((key): key is string => key !== null);
  console.error(`Mailgun test cannot run; missing: ${missing.join(", ")}`);
  process.exit(1);
}

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: "api", key: apiKey });

void client.messages
  .create(domain, {
    from: fromEmail,
    to: recipientResult.data,
    subject: "Northstar Mailgun test",
    text: "This is a test email from the Northstar storefront Mailgun configuration.",
  })
  .then((result) => {
    console.log("Mailgun accepted the test email.");
    console.log(`Message ID: ${result.id}`);
    console.log("Acceptance does not guarantee inbox delivery; check Mailgun logs and spam if it does not arrive.");
  })
  .catch((error: unknown) => {
    const status =
      typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number"
        ? error.status
        : "unknown";
    console.error(`Mailgun rejected or could not send the test email (status: ${status}).`);
    console.error("Check the sender domain, API key, and sandbox recipient authorization in Mailgun.");
    process.exitCode = 1;
  });
