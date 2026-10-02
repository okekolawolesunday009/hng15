import assert from "node:assert/strict";
import test from "node:test";
import { buildOrderConfirmationEmail, getOrderEmailEventKey } from "./order-email";

test("builds an order confirmation with line totals and a stable event key", () => {
  const email = buildOrderConfirmationEmail({
    orderId: "order-123",
    name: "Avery",
    appUrl: "https://shop.example.test",
    items: [{ name: "Everyday Tote", quantity: 2, price: 24.5 }],
  });

  assert.equal(email.subject, "Order confirmation order-123");
  assert.match(email.text, /Everyday Tote x 2 - \$49\.00/);
  assert.match(email.html, /Total: \$49\.00/);
  assert.equal(getOrderEmailEventKey("order-123"), "order-confirmation:order-123");
});

test("escapes customer and product names in the HTML confirmation", () => {
  const email = buildOrderConfirmationEmail({
    orderId: "order-123",
    name: "<img src=x>",
    appUrl: "https://shop.example.test",
    items: [{ name: "<script>alert(1)</script>", quantity: 1, price: 10 }],
  });

  assert.match(email.html, /&lt;img src=x&gt;/);
  assert.match(email.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
});