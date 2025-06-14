"use client";

import { PrivyProvider as PrivyProviderComponent } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviderComponent
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#1a73e8",
        },
        embeddedWallets: {
          createOnLogin: "all-users",
        },
      }}
    >
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProviderComponent>
  );
}
