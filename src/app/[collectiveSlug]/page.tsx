import { getCollectiveConfig } from "@/lib/config";
import CollectivePageContent from "@/components/CollectivePageContent";

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

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1>{collectiveConfig.profile.name}</h1>
      <CollectivePageContent collectiveConfig={collectiveConfig} />
    </div>
  );
}
