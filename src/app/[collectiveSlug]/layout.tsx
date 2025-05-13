import { NostrProvider } from "@/providers/NostrProvider";
import type { Metadata } from "next";

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
    <div className="">
      <NostrProvider>{children}</NostrProvider>
    </div>
  );
}
