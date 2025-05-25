// src/components/NostrUserBox.tsx
import { useState, useEffect, useRef } from "react";
import { decode, npubEncode } from "nostr-tools/nip19";
import { getPublicKey } from "nostr-tools";
import { generateAvatar } from "@/lib/utils";
import { useProfile } from "@/providers/NostrProvider";

export function NostrUserBox() {
  const [showPopover, setShowPopover] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [nsecInput, setNsecInput] = useState("");
  const [error, setError] = useState("");
  const { profile, updateProfile: updateNostrProfile } = useProfile();
  const [profileName, setProfileName] = useState(profile?.name || "");
  const [profilePicture, setProfilePicture] = useState(profile?.picture || "");
  const [currentNpub, setCurrentNpub] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initial = profile?.name?.[0]?.toUpperCase();
  const defaultAvatar = currentNpub ? generateAvatar(currentNpub) : null;

  useEffect(() => {
    const npub = localStorage.getItem("nostr_npub");
    if (npub) {
      setCurrentNpub(npub);
    } else {
      const npub = profile?.npub;
      if (npub) {
        setCurrentNpub(npub);
      }
    }
    const profileName = profile?.name || "";
    if (profileName) {
      setProfileName(profileName);
    }
    const profilePicture = profile?.picture || "";
    if (profilePicture) {
      setProfilePicture(profilePicture);
    }
  }, [profile?.name, profile?.picture, profile?.npub]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
        setShowInput(false);
        setShowEditProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNsecSubmit = () => {
    try {
      // Validate nsec
      const { type, data: secretKey } = decode(nsecInput);

      if (type !== "nsec") {
        throw new Error("Invalid nsec format");
      }

      const pubkey = getPublicKey(secretKey as Uint8Array);
      const npub = npubEncode(pubkey);

      // Update localStorage
      localStorage.setItem("nostr_nsec", nsecInput);
      localStorage.setItem("nostr_pubkey", pubkey);
      localStorage.setItem("nostr_npub", npub);

      // Reset state
      setNsecInput("");
      setShowInput(false);
      setError("");
      setCurrentNpub(npub);

      // Reload page to refresh provider
      window.location.reload();
    } catch (_) {
      setError("Invalid nsec key");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateNostrProfile({
        name: profileName.trim(),
        picture: profilePicture.trim(),
        about: profile?.about || "",
        website: profile?.website || "",
      });
      setShowEditProfile(false);
    } catch (error) {
      setError("Failed to update profile");
      console.error("Failed to update profile:", error);
    }
  };

  return (
    <div
      style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}
    >
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowPopover(!showPopover)}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "none",
          background: profile?.picture ? "transparent" : "#1a73e8",
          color: "white",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        {profile?.picture ? (
          <img
            src={profile.picture}
            alt={profile.name || "Profile"}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : initial ? (
          initial
        ) : defaultAvatar ? (
          <img
            src={defaultAvatar}
            alt="Default Avatar"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          initial
        )}
      </button>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            bottom: "48px",
            right: "0",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            padding: "12px",
            width: "250px",
            border: "1px solid #ddd",
          }}
        >
          {!showInput && !showEditProfile ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: profile?.picture ? "transparent" : "#1a73e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                  }}
                >
                  {profile?.picture ? (
                    <img
                      src={profile.picture}
                      alt={profile.name || "Profile"}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div>
                  <div
                    className="dark:text-black"
                    style={{
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {profile?.name || "Anonymous"}
                    <button
                      onClick={() => setShowEditProfile(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "2px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      fontFamily: "monospace",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {currentNpub?.slice(0, 12)}...{currentNpub?.slice(-8)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInput(true)}
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#f1f3f4",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#444",
                  fontSize: "13px",
                  textAlign: "left",
                  marginTop: "8px",
                }}
              >
                Use another account
              </button>
            </>
          ) : showEditProfile ? (
            <div>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter name..."
                className="dark:text-black"
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              <input
                type="url"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="Profile picture URL..."
                className="dark:text-black"
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleProfileUpdate}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "#1a73e8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEditProfile(false);
                    setProfileName(profile?.name || "");
                    setProfilePicture(profile?.picture || "");
                  }}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "#f1f3f4",
                    color: "#444",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="password"
                value={nsecInput}
                onChange={(e) => setNsecInput(e.target.value)}
                placeholder="Enter nsec..."
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: error ? "4px" : "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              {error && (
                <div
                  style={{
                    color: "#dc3545",
                    marginBottom: "8px",
                    fontSize: "11px",
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleNsecSubmit}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "#1a73e8",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Switch
                </button>
                <button
                  onClick={() => {
                    setShowInput(false);
                    setNsecInput("");
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "#f1f3f4",
                    color: "#444",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
