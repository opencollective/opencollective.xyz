import { getCollectiveConfig, getWalletAddresses } from "@/lib/config";
import { getURIFromNostrEvent, subscribeToNotesByURI } from "@/lib/nostr";
import { getTransactionsForCollective } from "@/lib/transactions";
import { filterTransactions, getAddressFromURI } from "@/lib/utils";
import { getLeaderboard, Leaderboard } from "@/lib/utils";
import { FiatCurrencySymbol, URI } from "@/types";
import { ImageResponse } from "@vercel/og";
import { NostrEvent } from "nostr-tools";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collectiveSlug: string }> }
) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug as string);

  const transactions = await getTransactionsForCollective(
    collectiveSlug as string
  );

  const walletAddresses = getWalletAddresses(collectiveSlug as string);

  const inboundFiatTransactions = filterTransactions(
    transactions,
    "fiat",
    "inbound",
    walletAddresses
  );
  const outboundTokenTransactions = filterTransactions(
    transactions,
    "token",
    "outbound",
    walletAddresses
  );

  console.log(
    ">>> outboundTokenTransactions",
    outboundTokenTransactions.length
  );

  const inboundLeaderboard: Leaderboard = getLeaderboard(
    inboundFiatTransactions,
    collectiveConfig?.primaryCurrency as FiatCurrencySymbol
  );
  const outboundLeaderboard: Leaderboard = getLeaderboard(
    outboundTokenTransactions,
    collectiveConfig?.primaryCurrency as FiatCurrencySymbol
  );

  if (!collectiveConfig) {
    // return 404
    return new Response("Not found", { status: 404 });
  }

  const topSupporters = inboundLeaderboard.slice(0, 20);
  const topSupportersURIs = topSupporters.map((entry) => entry.uri);
  const topContributors = outboundLeaderboard.slice(0, 20);
  const topContributorsURIs = topContributors.map((entry) => entry.uri);
  // Connect to nostr and subscribe to the notes
  const notes = await subscribeToNotesByURI([
    ...topSupportersURIs,
    ...topContributorsURIs,
  ]);

  const profileByURI: Record<URI, { name?: string; picture?: string }> = {};
  for (const note of notes) {
    const uri = getURIFromNostrEvent(note as NostrEvent);
    const name = note.content;
    const picture = note.tags.find((tag) => tag[0] === "picture")?.[1];
    profileByURI[uri as URI] = profileByURI[uri as URI] || {};
    profileByURI[uri as URI].name = profileByURI[uri as URI].name || name;
    profileByURI[uri as URI].picture =
      profileByURI[uri as URI].picture || picture;
  }

  const avatarsUsed: Record<string, boolean> = {};

  const contributorsToShow = inboundLeaderboard
    .filter((entry) => {
      if (
        profileByURI[entry.uri as URI]?.picture &&
        !avatarsUsed[profileByURI[entry.uri as URI]?.picture || ""]
      ) {
        avatarsUsed[profileByURI[entry.uri as URI]?.picture || ""] = true;
        return true;
      }
      return false;
    })
    .slice(0, 10);

  // Reset avatarsUsed for core contributors
  const coreContributorsAvatarsUsed: Record<string, boolean> = {};
  const coreContributorsToShow = outboundLeaderboard
    .filter((entry) => {
      if (
        profileByURI[entry.uri as URI]?.picture &&
        !coreContributorsAvatarsUsed[
          profileByURI[entry.uri as URI]?.picture || ""
        ]
      ) {
        coreContributorsAvatarsUsed[
          profileByURI[entry.uri as URI]?.picture || ""
        ] = true;
        return true;
      }
      return false;
    })
    .slice(0, 10);

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#1E1E1E",
          color: "white",
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          padding: "40px 40px 0px 40px",
          gap: "30px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Large faded logo in background corner */}
        {collectiveConfig.profile?.picture && (
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              opacity: 0.08,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={collectiveConfig.profile.picture}
              alt=""
              width={400}
              height={400}
              style={{
                borderRadius: "50%",
                filter: "grayscale(100%)",
              }}
            />
          </div>
        )}

        {/* Header - Logo and Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          {collectiveConfig.profile?.picture && (
            <img
              src={collectiveConfig.profile.picture}
              alt={collectiveConfig.profile.name || ""}
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                border: "4px solid #ffffff",
              }}
            />
          )}
          <h1
            style={{
              fontSize: 52,
              fontWeight: "bold",
              margin: 0,
              color: "#ffffff",
            }}
          >
            {collectiveConfig.profile.name}
          </h1>
        </div>

        {/* Bio */}
        {collectiveConfig.profile?.about && (
          <div style={{ display: "flex" }}>
            <p
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "#cccccc",
                margin: 0,
                maxHeight: "84px",
                overflow: "hidden",
              }}
            >
              {collectiveConfig.profile.about.split("\n")[0]}
            </p>
          </div>
        )}

        {/* Contributors and Funders Section */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "40px",
            marginTop: "60px",
          }}
        >
          {/* Core Contributors */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              padding: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: "bold",
                color: "#ffffff",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Core Contributors
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                height: "180px",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {coreContributorsToShow.map((entry) => {
                const profilePicture = profileByURI[entry.uri as URI]?.picture;
                const imageUrl = profilePicture
                  ? `${
                      process.env.NEXT_PUBLIC_WEBAPP_URL
                    }/api/image-proxy?url=${encodeURIComponent(
                      profilePicture
                    )}&width=128&height=128&seed=${getAddressFromURI(
                      entry.uri
                    )}`
                  : `${
                      process.env.NEXT_PUBLIC_WEBAPP_URL
                    }/api/avatar?seed=${getAddressFromURI(entry.uri)}`;

                return (
                  <img
                    key={entry.uri}
                    src={imageUrl}
                    alt={entry.uri}
                    width={80}
                    height={80}
                    style={{
                      borderRadius: "50%",
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Funded By */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              padding: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: "bold",
                color: "#ffffff",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Funded by
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                height: "180px",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {contributorsToShow.map((entry) => {
                const profilePicture = profileByURI[entry.uri as URI]?.picture;
                const imageUrl = profilePicture
                  ? `${
                      process.env.NEXT_PUBLIC_WEBAPP_URL
                    }/api/image-proxy?url=${encodeURIComponent(
                      profilePicture
                    )}&width=128&height=128&seed=${getAddressFromURI(
                      entry.uri
                    )}`
                  : `${
                      process.env.NEXT_PUBLIC_WEBAPP_URL
                    }/api/avatar?seed=${getAddressFromURI(entry.uri)}`;

                return (
                  <img
                    key={entry.uri}
                    src={imageUrl}
                    alt={entry.uri}
                    width={80}
                    height={80}
                    style={{
                      borderRadius: "50%",
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
