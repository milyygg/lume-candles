import { describe, expect, it } from "vitest";
import { telegramOrderLink } from "@/lib/telegram-order";

describe("Telegram order drafts",()=>{
 const message="Свеча LUMÉ\nРоза & ваниль + декор\nИтого: 2 700 ₽";
 it("opens a public contact with the complete draft",()=>{
  const url=new URL(telegramOrderLink("https://t.me/candle_shop",message));
  expect(url.pathname).toBe("/candle_shop");
  expect(url.searchParams.get("text")).toBe(message);
 });
 it("uses the chat picker for an invitation without losing the draft",()=>{
  const url=new URL(telegramOrderLink("https://t.me/+qQX5YNnktWlkOTIy",message));
  expect(url.pathname).toBe("/share/url");
  expect(url.searchParams.get("url")).toBe("https://milyygg.github.io/lume-candles/");
  expect(url.searchParams.get("text")).toBe(message);
 });
});
