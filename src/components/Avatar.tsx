import {
  Avatar as AvatarUI,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  generateAvatar,
  getAddressFromURI,
  getChainIdFromURI,
  getChainSlugFromChainId,
} from "@/lib/utils";
import { Address, ProfileData, URI } from "@/types";
import { cn } from "@/lib/utils";
import { useNostr, getProfileFromNotes } from "@/providers/NostrProvider";
import { useRouter } from "next/navigation";
import { getENSDetailsFromAddress } from "@/utils/crypto.server";
import { useEffect, useState } from "react";

export default function Avatar({
  uri,
  defaultProfile,
  className,
  editable = true,
  title,
  onClick,
}: {
  uri: URI;
  defaultProfile?: ProfileData;
  className?: string;
  editable?: boolean;
  title?: string;
  onClick?: (uri: URI) => void;
}) {
  const { openEditProfileModal, notesByURI } = useNostr();
  const initialProfile =
    defaultProfile || getProfileFromNotes(uri, notesByURI[uri]);
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const router = useRouter();
  const handleAvatarClick = () => {
    if (editable) {
      openEditProfileModal(uri, profile);
    } else {
      if (onClick) {
        onClick(uri);
      } else {
        const chainId = getChainIdFromURI(uri);
        const chainName = getChainSlugFromChainId(chainId);
        const address = getAddressFromURI(uri);
        if (chainName && address) {
          router.push(`/${chainName}/address/${address}`);
        }
      }
    }
  };

  type ENSDetails = {
    name?: string;
    avatar?: string;
    url?: string;
    description?: string;
  };

  useEffect(() => {
    const updateProfileFromENSDetails = (
      address: Address,
      ensDetails: ENSDetails
    ) => {
      setProfile({
        uri,
        address,
        name: ensDetails.name,
        picture: ensDetails.avatar,
        website: ensDetails.url,
        about: ensDetails.description,
      });
    };

    const fetchENSDetails = async (address: Address) => {
      const cache = localStorage.getItem(`ens-${address}`);
      if (cache) {
        const cacheData = JSON.parse(cache);
        if (cacheData.timestamp > Date.now() - 1000 * 60 * 60 * 24) {
          updateProfileFromENSDetails(address, cacheData.profile);
          return;
        } else {
          localStorage.removeItem(`ens-${address}`);
          updateProfileFromENSDetails(address, cacheData.profile);
          return;
        }
      }
      const ensDetails = await getENSDetailsFromAddress(address);
      if (ensDetails.name) {
        localStorage.setItem(
          `ens-${address}`,
          JSON.stringify({
            timestamp: Date.now(),
            profile: ensDetails,
          })
        );
        updateProfileFromENSDetails(address, ensDetails);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!profile.name) {
            const profile = getProfileFromNotes(uri, notesByURI[uri]);
            if (profile.name) {
              setProfile(profile);
            } else {
              const address = getAddressFromURI(uri);
              fetchENSDetails(address);
            }
          }
          // Once we've loaded the data, we can disconnect the observer
          observer.disconnect();
        }
      });
    });

    // Get the avatar element and observe it
    const avatarElement = document.querySelector(`[data-uri="${uri}"]`);
    if (avatarElement) {
      observer.observe(avatarElement);
    }

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, [notesByURI, uri, profile.name]);

  return (
    <AvatarUI
      title={title || profile?.name || profile?.address}
      data-uri={uri}
      className={cn(
        "h-12 w-12  uppercase text-gray-500",
        className,
        "cursor-pointer hover:ring-2 hover:ring-primary transition-all"
      )}
      onClick={handleAvatarClick}
    >
      <AvatarImage src={profile?.picture} alt={profile?.address} />
      {profile?.name && (
        <AvatarFallback>{profile?.name?.slice(0, 2)}</AvatarFallback>
      )}
      {!profile?.name && (
        <AvatarFallback>
          <img src={generateAvatar(profile?.address as string)} />
        </AvatarFallback>
      )}
    </AvatarUI>
  );
}
