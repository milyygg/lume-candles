import type { Metadata } from "next";
import { StoreProvider } from "@/components/store";
import { RevealSections } from "@/components/reveal-sections";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { brand } from "@/lib/config";
import "./globals.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3014";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.title} | Свечи ручной работы`,
    template: `%s | ${brand.title}`,
  },
  description: brand.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: brand.title,
    title: brand.title,
    description: brand.description,
    images: [
      {
        url: `${siteUrl.replace(/\/$/, "")}/photography/studio/MEDIA-21-studio.png`,
        width: 1122,
        height: 1402,
        alt: "Декоративная свеча Объятие",
      },
    ],
  },
  robots:
    process.env.ORDER_MODE === "real"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <StoreProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <RevealSections />
        </StoreProvider>
      </body>
    </html>
  );
}
