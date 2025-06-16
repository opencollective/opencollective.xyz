"use client";

import { CollectiveConfig } from "@/types";
import Image from "next/image";
import { DiscordMember } from "@/lib/discord";

type RoleMembers = {
  roleId: string;
  members: DiscordMember[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

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

  // Sort roles by burnAmount (descending)
  const sortedRoles = [...collectiveConfig.discord?.roles]
    .filter((role) => role.burnAmount && role.burnAmount > 0)
    .sort((a, b) => {
      const aAmount = a.burnAmount || 0;
      const bAmount = b.burnAmount || 0;
      return bAmount - aAmount;
    });

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="mt-4 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
          Our members
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedRoles.map((role) => {
            const roleData = roleMembers.find((r) => r.roleId === role.id);
            const members = roleData?.members || [];

            return (
              <div
                key={role.id}
                className="flex flex-col p-8 rounded-xl border bg-card text-card-foreground shadow-sm"
              >
                {/* Role Information */}
                <div className="mb-6">
                  <div className="flex flex-row justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-semibold mb-4">
                        {members.length} {role.name}
                      </h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground ml-4 hidden sm:block">
                        {role.frequency}
                      </span>{" "}
                      <div className="relative flex ml-2">
                        {Array.from({ length: role.burnAmount || 0 }).map(
                          (_, i) =>
                            collectiveConfig.profile.picture && (
                              <Image
                                key={i}
                                src={collectiveConfig.profile.picture}
                                alt="Token"
                                width={32}
                                height={32}
                                className="rounded-full border-2 border-background"
                                style={{
                                  marginLeft: i > 0 ? "-18px" : "0",
                                  zIndex: (role.burnAmount || 0) - i,
                                }}
                              />
                            )
                        )}
                      </div>
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {role.description}
                    </p>
                  )}
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Image
                        src={member.avatar}
                        alt={member.name || member.username}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-background"
                      />
                      <div>
                        <p className="font-medium">
                          {member.name || member.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.roles?.[0] ? (
                            <div>
                              {
                                collectiveConfig.discord?.roles
                                  .filter(
                                    (r) => r.mintAmount && r.mintAmount > 0
                                  )
                                  .find((r) => member.roles?.includes(r.id))
                                  ?.name
                              }
                            </div>
                          ) : (
                            ""
                          )}
                          Member since {formatDate(member.since)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
