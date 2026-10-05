import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCartLineMutation,
  getCartItemCount,
  getCartSubtotal,
  isCartQuantityAvailable,
  type CartItem,
} from "./cart";

const initialLines = [
  { productId: "first-product", quantity: 2 },
  { productId: "second-product", quantity: 1 },
];

test("accepts positive integer quantities up to stock", () => {
  assert.equal(isCartQuantityAvailable(1, 1), true);
  assert.equal(isCartQuantityAvailable(3, 8), true);
  assert.equal(isCartQuantityAvailable(8, 8), true);
});

test("rejects quantities that are invalid or exceed stock", () => {
  assert.equal(isCartQuantityAvailable(0, 8), false);
  assert.equal(isCartQuantityAvailable(-1, 8), false);
  assert.equal(isCartQuantityAvailable(1.5, 8), false);
  assert.equal(isCartQuantityAvailable(9, 8), false);
  assert.equal(isCartQuantityAvailable(1, 0), false);
});

test("adds new lines and increments existing lines", () => {
  assert.deepEqual(
    applyCartLineMutation(initialLines, "add", "third-product", 1),
    {
      lines: [...initialLines, { productId: "third-product", quantity: 1 }],
      error: null,
    },
  );
  assert.deepEqual(
    applyCartLineMutation(initialLines, "add", "first-product", 3),
    {
      lines: [
        { productId: "second-product", quantity: 1 },
        { productId: "first-product", quantity: 5 },
      ],
      error: null,
    },
  );
});

test("sets quantities and removes a line when set to zero", () => {
  assert.deepEqual(
    applyCartLineMutation(initialLines, "set", "first-product", 4).lines,
    [
      { productId: "second-product", quantity: 1 },
      { productId: "first-product", quantity: 4 },
    ],
  );
  assert.deepEqual(
    applyCartLineMutation(initialLines, "set", "first-product", 0).lines,
    [{ productId: "second-product", quantity: 1 }],
  );
});

test("removes and clears cart lines", () => {
  assert.deepEqual(
    applyCartLineMutation(initialLines, "remove", "first-product").lines,
    [{ productId: "second-product", quantity: 1 }],
  );
  assert.deepEqual(applyCartLineMutation(initialLines, "clear").lines, []);
});

test("rejects invalid line mutations without changing the cart", () => {
  assert.deepEqual(
    applyCartLineMutation(initialLines, "add", "first-product", 98),
    { lines: initialLines, error: "Requested quantity is invalid." },
  );
  assert.equal(applyCartLineMutation(initialLines, "set", "first-product").error, "Requested quantity is invalid.");
  assert.equal(applyCartLineMutation(initialLines, "add", undefined, 1).error, "Choose a valid product.");
});

test("calculates item count and subtotal", () => {
  const items: CartItem[] = [
    { id: "first", name: "First", slug: "first", price: 12.5, quantity: 2, stock: 4, isActive: true },
    { id: "second", name: "Second", slug: "second", price: 7, quantity: 3, stock: 5, isActive: true },
  ];

  assert.equal(getCartItemCount(items), 5);
  assert.equal(getCartSubtotal(items), 46);
});