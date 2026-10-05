import assert from "node:assert/strict";
import test from "node:test";

import { buildDemoOrder, checkoutSchema } from "./orders.ts";

test("buildDemoOrder creates a no-payment confirmation", () => {
  const order = buildDemoOrder({
    name: "Ada Lovelace",
    email: "ada@example.com",
    address: "1 Test Street",
    city: "Lagos",
    postalCode: "100001",
    items: [
      { productId: "123e4567-e89b-12d3-a456-426614174000", quantity: 1 },
    ],
  });

  assert.match(order.orderId, /^demo-/);
  assert.equal(order.paymentStatus, "demo");
  assert.equal(order.paymentAmount, 0);
  assert.equal(order.status, "confirmed");
  assert.equal(order.customer.name, "Ada Lovelace");
});

test("checkoutSchema rejects invalid checkout details", () => {
  const result = checkoutSchema.safeParse({
    name: "A",
    email: "not-an-email",
    address: "short",
    city: "L",
    postalCode: "1",
    items: [],
  });

  assert.equal(result.success, false);
});
