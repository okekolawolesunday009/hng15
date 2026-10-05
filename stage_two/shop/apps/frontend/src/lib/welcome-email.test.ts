import assert from "node:assert/strict";
import test from "node:test";
import { buildWelcomeEmail, getWelcomeEmailEventKey } from "./welcome-email";

test("builds welcome email text and links from the app URL", () => {
  const email = buildWelcomeEmail({
    name: "Avery",
    appUrl: "https://shop.example.test",
  });

  assert.equal(email.subject, "Welcome to Northstar");
  assert.match(email.text, /Hi Avery/);
  assert.match(email.text, /https:\/\/shop\.example\.test\/products/);
  assert.match(email.html, /href="https:\/\/shop\.example\.test\/products"/);
});

test("uses a fallback greeting and escapes user-provided HTML", () => {
  const email = buildWelcomeEmail({
    name: " <img src=x onerror=alert(1)> & \"friend\" ",
    appUrl: "https://shop.example.test",
  });

  assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; &quot;friend&quot;/);
  assert.doesNotMatch(email.html, /<img/);
  assert.match(buildWelcomeEmail({ appUrl: "https://shop.example.test" }).text, /Hi there/);
});

test("creates one stable welcome event key per user", () => {
  assert.equal(getWelcomeEmailEventKey("user-123"), "welcome:user-123");
  assert.equal(getWelcomeEmailEventKey("user-123"), getWelcomeEmailEventKey("user-123"));
  assert.notEqual(getWelcomeEmailEventKey("user-123"), getWelcomeEmailEventKey("user-456"));
});