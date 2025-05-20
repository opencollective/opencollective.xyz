import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { ProfileData, URI } from "@/types";
import { generateURI, getAddressFromURI, getChainIdFromURI } from "@/lib/utils";
import { useNostr } from "@/providers/NostrProvider";
import { useState } from "react";
import chains from "@/data/chains.json";

export default function NostrEditProfileModal({
  uri,
  profile,
  open,
  onOpenChange,
}: {
  uri: URI;
  profile?: ProfileData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const chainId = getChainIdFromURI(uri);
  let chain;
  Object.entries(chains).forEach(([chainSlug, c]) => {
    if (c.id === chainId) {
      chain = chainSlug;
    }
  });
  const address = getAddressFromURI(uri);

  const { publishMetadata, notesByURI } = useNostr();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(
    profile || {
      uri,
      address,
      name: "",
      picture: "",
      website: "",
      about: "",
    }
  );

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setIsSubmittingProfile(true);

    try {
      const uri = generateURI("ethereum", { chainId, address });
      const previousNote = notesByURI[uri] ? notesByURI[uri][0] : null;

      const tags = [
        // Make sure we don't duplicate tags
        ...(previousNote?.tags || []).filter(
          (t) => ["i", "picture", "website", "about"].indexOf(t[0]) === -1
        ),
      ];
      if (profileData.picture) {
        tags.push(["picture", profileData.picture]);
      }
      if (profileData.about) {
        tags.push(["about", profileData.about]);
      }
      if (profileData.website) {
        tags.push(["website", profileData.website]);
      }

      await publishMetadata(uri, {
        content: profileData.name || "",
        tags,
      });

      onOpenChange(false);
      // You might want to refresh the UI or notify the user of success
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            <Link
              href={`https://txinfo.xyz/${chain}/address/${address}`}
              title="View address on TxInfo"
            >
              {address}
            </Link>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleProfileSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="name" className="sm:text-right">
                Name
              </Label>
              <Input
                id="name"
                defaultValue={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                className="sm:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="picture" className="sm:text-right">
                Website
              </Label>
              <Input
                id="website"
                defaultValue={profileData.website}
                onChange={(e) =>
                  setProfileData({ ...profileData, website: e.target.value })
                }
                className="sm:col-span-3"
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="picture" className="sm:text-right">
                Picture URL
              </Label>
              <Input
                id="picture"
                defaultValue={profileData.picture}
                onChange={(e) =>
                  setProfileData({ ...profileData, picture: e.target.value })
                }
                className="sm:col-span-3"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="about" className="sm:text-right">
                About
              </Label>
              <Textarea
                id="about"
                defaultValue={profileData.about}
                onChange={(e) =>
                  setProfileData({ ...profileData, about: e.target.value })
                }
                className="sm:col-span-3"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-col sm:flex-row-reverse gap-2">
              <Button type="submit" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
