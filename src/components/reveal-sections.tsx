"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function RevealSections() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("seen");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 },
    );
    const scan = () =>
      document
        .querySelectorAll("[data-reveal]:not(.seen)")
        .forEach((element) => observer.observe(element));
    scan();
    const main = document.getElementById("main");
    const mutations = new MutationObserver(scan);
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);
  return null;
}
