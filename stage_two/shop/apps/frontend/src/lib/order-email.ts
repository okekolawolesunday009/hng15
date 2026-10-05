export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderEmailInput = {
  orderId: string;
  name: string;
  items: OrderEmailItem[];
  appUrl: string;
};

export function getOrderEmailEventKey(orderId: string) {
  return `order-confirmation:${orderId}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function buildOrderConfirmationEmail({ orderId, name, items, appUrl }: OrderEmailInput) {
  const recipientName = name.trim() || "there";
  const homeUrl = new URL("/", appUrl).toString();
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const textItems = items
    .map((item) => `${item.name} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`)
    .join("\n");
  const htmlItems = items
    .map((item) => `<li>${escapeHtml(item.name)} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}</li>`)
    .join("");

  return {
    subject: `Order confirmation ${orderId}`,
    text: `Hi ${recipientName},\n\nThanks for your order.\n\nOrder: ${orderId}\n${textItems}\n\nTotal: ${formatPrice(total)}\n\n${homeUrl}\nThe Northstar team`,
    html: `<p>Hi ${escapeHtml(recipientName)},</p><p>Thanks for your order.</p><p>Order: ${escapeHtml(orderId)}</p><ul>${htmlItems}</ul><p><strong>Total: ${formatPrice(total)}</strong></p><p><a href="${escapeHtml(homeUrl)}">Visit Northstar</a></p>`,
  };
}