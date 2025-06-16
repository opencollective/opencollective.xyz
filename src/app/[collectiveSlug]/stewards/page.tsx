import { getCollectiveConfig } from "@/lib/config";
import CollectivePageHeader from "@/components/CollectivePageHeader";
import { PrivyLoginButton } from "@/components/PrivyLoginButton";
import CollectivePageStewards from "@/components/CollectivePageStewards";
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
      .filter((r) => r.mintAmount && r.mintAmount > 0)
      .map((role) => role.id),
  ]);

  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-4">
      <div className="flex justify-end">
        <PrivyLoginButton collectiveConfig={collectiveConfig} />
      </div>

      <CollectivePageHeader collectiveConfig={collectiveConfig} />
      <CollectivePageStewards
        collectiveConfig={collectiveConfig}
        roleMembers={roleMembers}
      />
    </div>
  );
}
