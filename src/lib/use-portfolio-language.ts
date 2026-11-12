"use client";
import { useEffect, useState } from "react";
export function usePortfolioLanguage() {
  const [language, setLanguage] = useState("ru");
  useEffect(() => {
    const update = () => setLanguage(document.documentElement.lang);
    update();
    window.addEventListener("portfolio:language", update);
    return () => window.removeEventListener("portfolio:language", update);
  }, []);
  return language;
}
