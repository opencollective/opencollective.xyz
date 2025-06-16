"use client";

import { CollectiveConfig } from "@/types";
import Image from "next/image";
import { DiscordMember } from "@/lib/discord";
import { formatDate } from "@/lib/utils";

type RoleMembers = {
  roleId: string;
  members: DiscordMember[];
};

export default function CollectivePageStewards({
  collectiveConfig,
  roleMembers,
}: {
  collectiveConfig: CollectiveConfig;
  roleMembers: RoleMembers[];
}) {
  if (!collectiveConfig.discord?.roles) {
    return null;
  }

  // Sort roles by mintAmount (descending)
  const sortedRoles = [...collectiveConfig.discord?.roles]
    .filter((role) => role.mintAmount && role.mintAmount > 0)
    .sort((a, b) => {
      const aAmount = a.mintAmount || 0;
      const bAmount = b.mintAmount || 0;
      return bAmount - aAmount;
    });

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="mt-4 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
          Our stewards
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedRoles.map((role) => {
            const roleData = roleMembers.find((r) => r.roleId === role.id);
            const members = roleData?.members || [];

            return (
              <div
                key={role.id}
                className="flex items-center justify-between p-6 rounded-xl border bg-card text-card-foreground shadow-sm"
              >
                {/* Role Information */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{role.name}</h3>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: role.mintAmount || 0 }).map(
                      (_, i) =>
                        collectiveConfig.profile.picture && (
                          <Image
                            key={i}
                            src={collectiveConfig.profile.picture}
                            alt="Token"
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )
                    )}
                    <span className="text-sm text-muted-foreground ml-2">
                      {role.frequency}
                    </span>
                  </div>
                </div>

                {/* Current Steward */}
                {members[0] && (
                  <div className="flex items-center gap-3 ml-6 flex-row-reverse sm:flex-row">
                    <Image
                      src={members[0].avatar}
                      alt={members[0].username}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-background"
                    />
                    <div>
                      <p className="font-medium text-right sm:text-left">
                        {members[0].name || members[0].username}
                      </p>
                      <p className="text-sm text-muted-foreground text-right sm:text-left">
                        <span className="hidden sm:inline">Member since</span>{" "}
                        {formatDate(members[0].since)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
