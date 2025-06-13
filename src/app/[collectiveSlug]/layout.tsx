import { NostrProvider } from "@/providers/NostrProvider";
import { getCollectiveConfig } from "@/lib/config";
import ThemeProvider from "@/components/ThemeProvider";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ collectiveSlug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);

  const title =
    collectiveConfig?.profile?.name ||
    "Open Collective - Open source your organization";
  const description =
    collectiveConfig?.profile?.about || "Open Source Organization";
  const ogImageUrl = `${
    process.env.NEXT_PUBLIC_WEBAPP_URL
  }/${collectiveSlug}/ogimage.png?t=${new Date().toISOString().split("T")[0]}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://opencollective.xyz/${collectiveSlug}`,
      siteName: "opencollective.xyz",
      images: [
        {
          url: ogImageUrl,
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
      images: [ogImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ collectiveSlug: string }>;
}) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);

  return (
    <ThemeProvider theme={collectiveConfig?.theme}>
      <NostrProvider>{children}</NostrProvider>
    </ThemeProvider>
  );
}
