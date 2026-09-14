import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Hulan Jewelry — Өөрийнхөөрөө гэрэлт", template: "%s · Hulan Jewelry" },
  description:
    "Байгалийн чулуугаар өөрийн түүхийг бүтээ. Чулуу, өнгө, хэмжээгээ сонгож зөвхөн өөртөө зориулсан бугуйвч захиалаарай.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Үндсэн хэсэг рүү очих
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
