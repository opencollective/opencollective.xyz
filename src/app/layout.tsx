import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Open Collective - Open source your organization";
const description = "Open Source Organization";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://opencollective.xyz",
    siteName: "opencollective.xyz",
    images: [
      {
        url: "https://opencollective.xyz/opencollective-ogimage.png", // 1200x630px recommended
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@opencollect",
    images: ["https://opencollective.xyz/opencollective-light.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="[@media(prefers-color-scheme:dark)]:dark">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <main className="max-w-screen-lg mx-auto ">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}
