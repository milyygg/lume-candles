// A supplied invitation is the fallback, never a fabricated personal profile.
const personal = process.env.NEXT_PUBLIC_TELEGRAM_CONTACT;
export const personalTelegram = personal && /^https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}$/.test(personal) ? personal : null;
export const telegramContact = personalTelegram || "https://t.me/+qQX5YNnktWlkOTIy";
export const serverCheckout = process.env.NEXT_PUBLIC_CHECKOUT_MODE === "server";
