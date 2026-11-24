
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Pencil,
  Heart,
  MessageCircle,
  Users,
  Coffee,
  Camera,
  ImagePlus,
  Trash2,
  ArrowRight,
  X,
  Save,
  Plus,
} from "lucide-react";
import { authApi, mediaUrl, postApi } from "../../api/cafes";

const readJSON = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getUserId = (user) =>
  String(user?.id || user?.email || user?.username || "guest");

const getProfileKey = (user) =>
  `cafemate-profile-${getUserId(user)}`;

const getUsername = (user) =>
  user?.username?.trim() ||
  user?.email?.split("@")[0] ||
  "user";

const getProfile = (user) => {
  const saved = readJSON(getProfileKey(user), {});

  return {
    displayName:
      user?.displayName?.trim() ||
      user?.name?.trim() ||
      saved?.displayName?.trim() ||
      "User",
    username: saved?.username?.trim() || getUsername(user),
    bio: user?.bio || saved?.bio || "",
    location: user?.location || saved?.location || "Mandalay, Myanmar",
  };
};

function getInitials(name) {
  return (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function Avatar({ name, photo, small = false }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#f3e5d6] bg-[#ead7c2] font-bold text-[#704c36] ${
        small
          ? "h-11 w-11 text-sm"
          : "h-24 w-24 text-3xl sm:h-28 sm:w-28 sm:text-4xl"
      }`}
    >
      {photo ? (
        <img
          src={photo}
          alt={`${name}'s profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

export default function Profile({ user, onUserUpdated, favourites = [] }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(() =>
    user ? getProfile(user) : null
  );

  const [photo, setPhoto] = useState(() =>
    user
      ? mediaUrl(user?.avatar) ||
        user?.avatar ||
        ""
      : ""
  );

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [postCount, setPostCount] = useState(0);

  const [draft, setDraft] = useState({
    displayName: "",
    username: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return;

    postApi.list()
      .then((response) => {
        const posts = response.data?.data || [];
        setPostCount(posts.filter((post) => String(post.user_id) === String(user.id)).length);
      })
      .catch((requestError) => {
        console.error("Unable to load profile post count:", requestError);
        setPostCount(0);
      });
  }, [user, profile]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fbf6f0] px-4 py-16 text-[#38291f]">
        <section className="mx-auto max-w-lg rounded-3xl border border-[#eadbcf] bg-white p-8 text-center shadow-sm">
          <Users
            className="mx-auto mb-4 text-[#79543c]"
            size={40}
          />

          <h1 className="text-2xl font-extrabold">
            Sign in to view your profile
          </h1>

          <p className="mt-3 text-[#8b7768]">
            Sign in to manage your CafeMate profile.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-[#79543c] px-6 py-3 font-semibold text-white hover:bg-[#60412f]"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const displayName =
    profile?.displayName || user?.displayName || "User";

  const username =
    profile?.username || getUsername(user);

  function openEditProfile() {
    setDraft({
      displayName,
      username,
      bio: profile?.bio || "",
      location: profile?.location || "Mandalay, Myanmar",
    });

    setError("");
    setNotice("");
    setEditing(true);
  }

  function handleDraftChange(event) {
    const { name, value } = event.target;

    setDraft((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const cleanDisplayName = draft.displayName.trim();
    const cleanUsername = draft.username
      .trim()
      .replace(/^@+/, "")
      .replace(/\s+/g, "");

    if (!cleanDisplayName || !cleanUsername) {
      setError("Please enter your display name and username.");
      return;
    }

    const updatedProfile = {
      displayName: cleanDisplayName,
      username: cleanUsername,
      bio: draft.bio.trim(),
      location:
        draft.location.trim() || "Mandalay, Myanmar",
    };

    try {
      const response = await authApi.updateProfile({
        name: cleanDisplayName,
        username: cleanUsername,
        bio: updatedProfile.bio,
        location: updatedProfile.location,
      });
      localStorage.setItem(getProfileKey(user), JSON.stringify(updatedProfile));
      onUserUpdated?.(response.data);
      setProfile(updatedProfile);
      setEditing(false);
      setNotice("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not save your profile. Please try again.");
    }
  }

  function handlePhotoChange(event) {
    setError("");
    setNotice("");

    const input = event.currentTarget
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photos must be 2 MB or smaller.");
      input.value = "";
      return;
    }
    const body = new FormData();
    body.append("avatar", file);
    authApi.updateProfile(body)
      .then((response) => {
        onUserUpdated?.(response.data)
        setPhoto(mediaUrl(response.data.avatar))
        setNotice("Profile photo updated successfully.")
      })
      .catch((requestError) => setError(requestError.message || "Unable to update the profile photo."))
      .finally(() => { input.value = "" })
  }

  async function removePhoto() {
    try {
      const response = await authApi.removeAvatar()
      onUserUpdated?.(response.data)
      setPhoto("")
      setNotice("Profile photo removed.")
      setError("")
    } catch (requestError) {
      setError(requestError.message || "Could not remove the profile photo.")
    }
  }

  const favouriteCount = Array.isArray(favourites)
    ? favourites.length
    : 0;

  return (
    <main className="min-h-screen bg-[#fbf6f0] px-4 pb-14 pt-8 text-[#38291f] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        <header className="mb-7">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#9b7a62]">
            CafeMate Mandalay
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {displayName}&apos;s profile
          </h1>

          <p className="mt-2 text-sm text-[#8b7768]">
            Your cafe journey, favourites, and community activity.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        <section className="rounded-[28px] border border-[#eadbcf] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">

            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative w-fit">
                <Avatar name={displayName} photo={photo} />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#79543c] text-white shadow hover:bg-[#60412f]"
                >
                  <Camera size={17} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="min-w-0">
                <h2 className="break-words text-3xl font-extrabold sm:text-4xl">
                  {displayName}
                </h2>

                <p className="mt-2 break-all text-base text-[#9b7a62]">
                  @{username}
                </p>

                <p className="mt-3 flex items-center gap-2 text-sm text-[#8b7768] sm:text-base">
                  <MapPin size={18} className="shrink-0" />
                  {profile?.location || "Mandalay, Myanmar"}
                </p>

                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#79543c] hover:underline"
                  >
                    <ImagePlus size={16} />
                    Change photo
                  </button>

                  {photo && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 size={15} />
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/community/create")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#79543c] px-6 py-3.5 font-semibold text-white transition hover:bg-[#60412f]"
              >
                <Plus size={19} />
                Add Post
              </button>
              <button
                type="button"
                onClick={() => navigate("/my/cafes")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#79543c] bg-white px-6 py-3.5 font-semibold text-[#79543c] transition hover:bg-[#fbf6f0]"
              >
                <Coffee size={18} />
                My cafés
              </button>

              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#79543c] bg-white px-6 py-3.5 font-semibold text-[#79543c] transition hover:bg-[#fbf6f0]"
              >
                <Pencil size={18} />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="mt-8 min-h-10">
            {profile?.bio ? (
              <p className="whitespace-pre-wrap leading-7 text-[#594538]">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[#594538]">No bio added yet.</p>
            )}
          </div>

          <div className="my-8 border-t border-[#eadbcf]" />

          <div className="flex items-center justify-center py-5 text-center">
            <div>
              <p className="text-3xl font-extrabold text-[#79543c]">
                {postCount}
              </p>
              <p className="mt-2 text-base text-[#8b7768]">
                Posts
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2">

          <Link
            to="/bookmarks"
            className="group rounded-3xl border border-[#eadbcf] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
          >
            <Heart size={31} className="text-[#79543c]" />

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold">
                  Your favourites
                </h3>
                <p className="mt-2 text-sm text-[#9b7a62] sm:text-base">
                  You have {favouriteCount} saved{" "}
                  {favouriteCount === 1 ? "cafe" : "cafes"}.
                </p>
              </div>
              <ArrowRight size={21} className="shrink-0 text-[#79543c] transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/community"
            className="group rounded-3xl border border-[#eadbcf] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
          >
            <MessageCircle size={31} className="text-[#79543c]" />

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold">
                  Reviews &amp; Community
                </h3>
                <p className="mt-2 text-sm text-[#9b7a62] sm:text-base">
                  Share your cafe experiences with the community.
                </p>
              </div>
              <ArrowRight size={21} className="shrink-0 text-[#79543c] transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/explore"
            className="group rounded-3xl border border-[#eadbcf] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
          >
            <Coffee size={31} className="text-[#79543c]" />

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold">
                  Explore cafes
                </h3>
                <p className="mt-2 text-sm text-[#9b7a62] sm:text-base">
                  Find a new cafe in Mandalay for your next visit.
                </p>
              </div>
              <ArrowRight size={21} className="shrink-0 text-[#79543c] transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/community"
            className="group rounded-3xl border border-[#eadbcf] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
          >
            <Users size={31} className="text-[#79543c]" />

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold">
                  Community activity
                </h3>
                <p className="mt-2 text-sm text-[#9b7a62] sm:text-base">
                  Connect with other cafe lovers and share recommendations.
                </p>
              </div>
              <ArrowRight size={21} className="shrink-0 text-[#79543c] transition group-hover:translate-x-1" />
            </div>
          </Link>
        </section>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditing(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 id="edit-profile-title" className="text-2xl font-extrabold">
                  Edit Profile
                </h2>
                <p className="mt-1 text-sm text-[#9b7a62]">
                  Update your CafeMate information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close edit profile"
                className="rounded-full p-2 text-[#79543c] hover:bg-[#fbf6f0]"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex items-center gap-4 rounded-2xl bg-[#fbf6f0] p-4">
                <Avatar name={displayName} photo={photo} small />
                <div>
                  <p className="font-semibold">{displayName}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-sm font-semibold text-[#79543c] hover:underline"
                  >
                    Change profile photo
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="mb-2 block text-sm font-semibold">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  maxLength={60}
                  value={draft.displayName}
                  onChange={handleDraftChange}
                  required
                  className="w-full rounded-xl border border-[#e4d5c8] px-4 py-3 outline-none focus:border-[#79543c]"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold">
                  Username
                </label>
                <div className="flex items-center rounded-xl border border-[#e4d5c8] px-4 focus-within:border-[#79543c]">
                  <span className="text-[#9b7a62]">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    maxLength={30}
                    value={draft.username}
                    onChange={handleDraftChange}
                    required
                    className="w-full bg-transparent px-2 py-3 outline-none"
                    placeholder="yourusername"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="mb-2 block text-sm font-semibold">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  maxLength={100}
                  value={draft.location}
                  onChange={handleDraftChange}
                  className="w-full rounded-xl border border-[#e4d5c8] px-4 py-3 outline-none focus:border-[#79543c]"
                  placeholder="Mandalay, Myanmar"
                />
              </div>

              <div>
                <label htmlFor="bio" className="mb-2 block text-sm font-semibold">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={300}
                  value={draft.bio}
                  onChange={handleDraftChange}
                  className="w-full resize-y rounded-xl border border-[#e4d5c8] px-4 py-3 outline-none focus:border-[#79543c]"
                  placeholder="Tell the community about yourself..."
                />
                <p className="mt-1 text-right text-xs text-[#9b7a62]">
                  {draft.bio.length}/300
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-[#e4d5c8] px-5 py-3 font-semibold text-[#79543c] hover:bg-[#fbf6f0]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79543c] px-5 py-3 font-semibold text-white hover:bg-[#60412f]"
                >
                  <Save size={17} />
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
