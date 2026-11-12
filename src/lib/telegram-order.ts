/** Invite links cannot carry a draft. Telegram's share picker can. */
export function telegramOrderLink(contact:string, message:string) {
 if (/^https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}$/.test(contact))
  return `${contact}?${new URLSearchParams({text:message})}`;
 return `https://t.me/share/url?${new URLSearchParams({url:"https://milyygg.github.io/lume-candles/",text:message})}`;
}
