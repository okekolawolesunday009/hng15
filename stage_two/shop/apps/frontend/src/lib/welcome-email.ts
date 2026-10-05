export type WelcomeEmailInput = {
  name?: string | null;
  appUrl: string;
};

export function getWelcomeEmailEventKey(userId: string) {
  return `welcome:${userId}`;
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

export function buildWelcomeEmail({ name, appUrl }: WelcomeEmailInput) {
  const recipientName = name?.trim() || "there";
  const homeUrl = new URL("/", appUrl).toString();
  const productsUrl = new URL("/products", appUrl).toString();

  return {
    subject: "Welcome to Northstar",
    text: `Hi ${recipientName},\n\nThanks for joining Northstar. Explore our collection at ${productsUrl}.\n\nThe Northstar team`,
    html: `<p>Hi ${escapeHtml(recipientName)},</p><p>Thanks for joining Northstar.</p><p><a href="${escapeHtml(productsUrl)}">Explore the collection</a></p><p><a href="${escapeHtml(homeUrl)}">Northstar</a></p>`,
  };
}