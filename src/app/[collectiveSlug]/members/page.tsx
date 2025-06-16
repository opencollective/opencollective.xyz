import { getCollectiveConfig } from "@/lib/config";
import CollectivePageHeader from "@/components/CollectivePageHeader";
import { PrivyLoginButton } from "@/components/PrivyLoginButton";
import CollectivePageMembers from "@/components/CollectivePageMembers";
import { getDiscordRoleMembers } from "@/lib/discord";

export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string }>;
}) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);

  if (!collectiveConfig) {
    return <div>Collective not found</div>;
  }

  const roleMembers = await getDiscordRoleMembers(collectiveConfig.slug, [
    ...(collectiveConfig.discord?.roles ?? [])
      .filter((r) => r.burnAmount && r.burnAmount > 0)
      .map((role) => role.id),
  ]);

  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-4">
      <div className="flex justify-end">
        <PrivyLoginButton collectiveConfig={collectiveConfig} />
      </div>

      <CollectivePageHeader collectiveConfig={collectiveConfig} />
      <CollectivePageMembers
        collectiveConfig={collectiveConfig}
        roleMembers={roleMembers}
      />
    </div>
  );
}
