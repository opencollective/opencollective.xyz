"use server";

import { getCollectiveConfig } from "@/lib/config";

const DISCORD_API_BASE = "https://discord.com/api/v10";

export interface DiscordMember {
  id: string;
  username: string;
  since: string;
  name?: string;
  avatar: string;
  roles?: string[];
}

interface DiscordApiMember {
  roles?: string[];
  joined_at: string;
  nick?: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    global_name: string;
    discriminator: string;
  };
}

interface DiscordRoleMembers {
  roleId: string;
  members: DiscordMember[];
}

const cache = new Map<string, DiscordMember[]>();

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord API error: ${response.statusText}`);
  }

  return response.json();
}

async function getGuildMembers(guildId: string): Promise<DiscordMember[]> {
  const cacheKey = `guild:${guildId}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) || [];
  }

  const members: DiscordMember[] = [];
  let after = "0";

  while (true) {
    const response = await fetchWithAuth(
      `${DISCORD_API_BASE}/guilds/${guildId}/members?limit=1000&after=${after}`
    );

    if (!response.length) break;

    members.push(
      ...response.map((member: DiscordApiMember) => ({
        id: member.user.id,
        username: member.user.username,
        since: member.joined_at,
        name: member.nick || member.user.global_name,
        roles: member.roles,
        avatar: member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${
              Number(member.user.discriminator) % 5
            }.png`,
      }))
    );

    members.sort((a, b) => {
      const nameA = a.name || a.username;
      const nameB = b.name || b.username;
      return nameA.localeCompare(nameB) || 0;
    });

    after = response[response.length - 1].user.id;
  }

  cache.set(cacheKey, members);
  return members;
}

export async function getDiscordRoleMembers(
  collectiveSlug: string,
  roleIds: string[]
): Promise<DiscordRoleMembers[]> {
  if (!collectiveSlug) {
    throw new Error("Missing collectiveSlug");
  }

  const collectiveConfig = await getCollectiveConfig(collectiveSlug);

  if (!collectiveConfig) {
    throw new Error("Collective not found");
  }

  if (!collectiveConfig.discord?.guildId) {
    throw new Error("Discord guild ID not configured");
  }

  const members = await getGuildMembers(collectiveConfig.discord.guildId);

  try {
    const results = roleIds.map((roleId) => {
      return {
        roleId,
        members: members.filter((member) => member.roles?.includes(roleId)),
      };
    });

    return results;
  } catch (error) {
    console.error("Error fetching Discord role members:", error);
    throw new Error("Failed to fetch Discord members");
  }
}
