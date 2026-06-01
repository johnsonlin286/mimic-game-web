import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import MainWarper from "@/components/MainWarper";
import Toast from "@/components/Toast";

import "./tailwind.css";
import "./globals.scss";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const siteTitle = "MORF - A bluffing word game";
const siteDescription =
  "MORF is a bluffing word game where you and your friends compete to guess the word before the others. It's a fun and challenging game that will test your vocabulary and your ability to think on your feet.";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3002";

const ogImageUrl = process.env.NEXT_PUBLIC_R2_ASSETS_URL
  ? `${process.env.NEXT_PUBLIC_R2_ASSETS_URL}/images/invitation.webp`
  : `${siteUrl}/images/morf-logo.webp`;

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: siteTitle,
    description: "Agent, you are invited to a classified MORF briefing. Bring your best bluff—trust no one.",
    url: siteUrl,
    siteName: "MORF",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${fredoka.variable} antialiased`}
      >
        <MainWarper>
          <Toast />
          {children}
        </MainWarper>
      </body>
    </html>
  );
}
