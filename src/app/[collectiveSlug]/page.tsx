import { getCollectiveConfig } from "@/lib/config";
import CollectivePageContent from "@/components/CollectivePageContent";
import Image from "next/image";

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
      <div className="flex flex-row gap-2 sm:gap-4 items-center mt-4 sm:mt-8">
        {collectiveConfig.profile?.picture && (
          <Image
            src={collectiveConfig.profile.picture}
            alt={collectiveConfig.profile.name || ""}
            width={100}
            height={100}
            className="rounded-full w-12 h-12 sm:w-24 sm:h-24"
          />
        )}
        <h1 className="text-2xl sm:text-4xl font-bold">
          {collectiveConfig.profile.name}
        </h1>
      </div>
      <CollectivePageContent collectiveConfig={collectiveConfig} />
    </div>
  );
}
