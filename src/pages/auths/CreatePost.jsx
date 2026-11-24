
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Coffee,
  Users,
  FileText,
  ImagePlus,
  Pencil,
  MapPin,
  Star,
  Eye,
  Heart,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Wifi,
  Plug,
  Armchair,
  Leaf,
  Music,
  Plus,
  X,
  Send,
  CheckCircle2,
  Bookmark,
  MessageCircle,
  Lightbulb,
  UserRound,
} from "lucide-react";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 400 * 1024;
const MAX_CONTENT_LENGTH = 2000;

const PURPOSES = [
  { name: "Study", icon: BookOpen },
  { name: "Relax", icon: Coffee },
  { name: "Meeting", icon: Users },
  { name: "Dating", icon: Heart },
  { name: "Work", icon: BriefcaseBusiness },
  { name: "Event", icon: CalendarDays },
];

const FACTOR_ICONS = {
  "Fast Wi-Fi": Wifi,
  "Power Outlets": Plug,
  "Comfortable Seating": Armchair,
  "Quiet Environment": Leaf,
  "Good Music": Music,
};

import { mediaUrl, postApi } from "../../api/cafes";
import { FACTORS_BY_PURPOSE } from "../../utils/postTags";

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <Icon size={21} className="mt-0.5 shrink-0 text-[#8a4b20]" />
      <div>
        <h2 className="font-bold text-[#382016]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-stone-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function TagButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition sm:text-sm ${
        active
          ? "border-[#8a4b20] bg-[#8a4b20] text-white"
          : "border-[#d8cbc2] bg-white text-[#382016] hover:bg-[#fbf0e7]"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export default function CreatePost({ user }) {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);

  const [cafeName, setCafeName] = useState("");
  const [township, setTownship] = useState("Mandalay");
  const [street, setStreet] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);

  const [images, setImages] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [customFactors, setCustomFactors] = useState([]);
  const [customFactorInput, setCustomFactorInput] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fbf6f2] p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <Coffee size={42} className="mx-auto text-[#8a4b20]" />
          <h1 className="mt-4 text-2xl font-bold">Sign in first</h1>
          <p className="mt-2 text-stone-500">
            You need to sign in before creating a Community post.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-block rounded-xl bg-[#8a4b20] px-6 py-3 font-semibold text-white"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const author = {
    name: user.name || user.displayName || "User",
    username: user.username || user.email?.split("@")[0] || "user",
    photo: mediaUrl(user.avatar),
  };

  const availableFactors = [
    ...new Set(
      purposes.flatMap(
        (purpose) => FACTORS_BY_PURPOSE[purpose] || []
      )
    ),
  ];

  const allFactors = [
    ...new Set([...availableFactors, ...customFactors]),
  ];

  function togglePurpose(purpose) {
    setError("");

    const nextPurposes = purposes.includes(purpose)
      ? purposes.filter((item) => item !== purpose)
      : [...purposes, purpose];

    const nextAvailableFactors = [
      ...new Set(
        nextPurposes.flatMap(
          (item) => FACTORS_BY_PURPOSE[item] || []
        )
      ),
    ];

    setPurposes(nextPurposes);

    setSelectedFactors((current) =>
      current.filter(
        (factor) =>
          nextAvailableFactors.includes(factor) ||
          customFactors.includes(factor)
      )
    );
  }

  function toggleFactor(factor) {
    setSelectedFactors((current) =>
      current.includes(factor)
        ? current.filter((item) => item !== factor)
        : [...current, factor]
    );
    setError("");
  }

  function addCustomFactor() {
    const value = customFactorInput.trim();

    if (!value) return;

    if (
      allFactors.some(
        (factor) => factor.toLowerCase() === value.toLowerCase()
      )
    ) {
      setError("This attraction factor already exists.");
      return;
    }

    if (customFactors.length >= 10) {
      setError("You can add up to 10 custom factors.");
      return;
    }

    setCustomFactors((current) => [...current, value]);
    setSelectedFactors((current) => [...current, value]);
    setCustomFactorInput("");
    setError("");
  }

  async function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    const remaining = MAX_IMAGES - images.length;

    setError("");

    if (remaining <= 0) {
      setError("You can upload a maximum of 5 photos.");
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remaining);
    const newImages = [];

    try {
      for (const file of selectedFiles) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Please upload JPG, PNG, or WEBP images.");
        }

        if (file.size > MAX_IMAGE_SIZE) {
          throw new Error("Each image must be smaller than 400 KB.");
        }

        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Could not read image."));
          reader.readAsDataURL(file);
        });

        newImages.push(data);
      }

      setImages((current) =>
        [...current, ...newImages].slice(0, MAX_IMAGES)
      );

      if (files.length > remaining) {
        setError("Only the first available photo slots were used.");
      }
    } catch (err) {
      setError(err.message || "Image upload failed.");
    }

    event.target.value = "";
  }

  function removeImage(index) {
    setImages((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function handlePublish(event) {
    event.preventDefault();
    setError("");

    if (!cafeName.trim()) {
      setError("Please enter the café name.");
      return;
    }

    if (!township.trim()) {
      setError("Please enter the township.");
      return;
    }

    if (!content.trim()) {
      setError("Please write your café experience.");
      return;
    }

    if (purposes.length === 0) {
      setError("Please select at least one purpose.");
      return;
    }

    if (selectedFactors.length === 0) {
      setError("Please select at least one attraction factor.");
      return;
    }

    try {
      setSaving(true);
      const body = new FormData();
      body.append("title", cafeName.trim());
      body.append("cafe_name", cafeName.trim());
      body.append("township", township.trim());
      if (street.trim()) {
        body.append("street_address", street.trim());
      }
      body.append("body", content.trim());
      body.append("category", purposes[0] || "General");
      body.append("rating", rating ? String(rating) : "");
      purposes.forEach((purpose) => body.append("purposes[]", purpose));
      selectedFactors.forEach((factor) => body.append("attraction_factors[]", factor));

      for (const [index, imageData] of images.entries()) {
        const imageBlob = await fetch(imageData).then((response) => response.blob());
        body.append("images[]", imageBlob, `cafe-photo-${index + 1}.${imageBlob.type.split("/")[1] || "jpg"}`);
      }

      await postApi.create(body);

      navigate("/community", {
        replace: true,
        state: { postPublished: true },
      });
    } catch (requestError) {
      setError(requestError.message || "Could not publish your post. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf6f2] px-3 py-6 text-[#382016] sm:px-5 lg:px-6">

      <div className="mx-auto grid max-w-[1600px] items-start gap-4 xl:grid-cols-[210px_minmax(0,1fr)_330px]">

        {/* LEFT COMMUNITY SIDEBAR */}
        <aside className="rounded-2xl border border-[#eee1d9] bg-white p-4 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-extrabold">
            <Users size={23} />
            Community
          </h2>

          <nav className="space-y-1">
            <Link
              to="/community"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#fbf0e7]"
            >
              <FileText size={19} />
              All Posts
            </Link>

            <div className="flex items-center gap-3 rounded-xl bg-[#ffeadb] px-3 py-3 text-sm font-bold text-[#75401e]">
              <Pencil size={19} />
              Create Post
            </div>

            <Link
              to="/community"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#fbf0e7]"
            >
              <UserRound size={19} />
              My Posts
            </Link>

            <Link
              to="/community"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#fbf0e7]"
            >
              <Users size={19} />
              Following
            </Link>

            <Link
              to="/bookmarks"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#fbf0e7]"
            >
              <Bookmark size={19} />
              Saved
            </Link>
          </nav>
        </aside>

        {/* CENTRAL CREATE POST FORM */}
        <section className="min-w-0 rounded-2xl border border-[#eee1d9] bg-white p-4 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center gap-3 border-b border-[#eadfd8] pb-4">
            <Pencil size={32} className="shrink-0 text-[#8a4b20]" />
            <div>
              <h1 className="text-2xl font-extrabold">
                Create Post
              </h1>
              <p className="text-sm text-stone-600">
                Share your café experience, review, tips, or questions with the CafeMate community.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-5">

            {/* CAFE NAME, TOWNSHIP, AND STREET */}
            <div className="grid gap-4 border-b border-[#eadfd8] pb-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Coffee size={19} className="text-[#8a4b20]" />
                  Café Name <span className="text-red-500">*</span>
                </label>

                <input
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="Enter café name"
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-[#d9cfc8] px-4 py-3 text-sm outline-none focus:border-[#8a4b20]"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <MapPin size={19} className="text-[#8a4b20]" />
                  Township <span className="text-red-500">*</span>
                </label>

                <input
                  value={township}
                  onChange={(e) => setTownship(e.target.value)}
                  placeholder="e.g. Chanayethazan"
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-[#d9cfc8] px-4 py-3 text-sm outline-none focus:border-[#8a4b20]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <MapPin size={19} className="text-[#8a4b20]" />
                  Street
                </label>

                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 26th Street, between 80th and 81st"
                  maxLength={255}
                  className="w-full rounded-xl border border-[#d9cfc8] px-4 py-3 text-sm outline-none focus:border-[#8a4b20]"
                />
              </div>
            </div>

            {/* RATING */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#eadfd8] pb-4">
              <Star size={23} className="text-[#8a4b20]" />

              <span className="text-sm font-bold">
                Overall Rating
                <span className="font-normal text-stone-500"> (optional)</span>
              </span>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value} out of 5`}
                    onClick={() => setRating(value)}
                  >
                    <Star
                      size={24}
                      fill={value <= rating ? "#9a531f" : "transparent"}
                      className={
                        value <= rating
                          ? "text-[#9a531f]"
                          : "text-[#9a531f]"
                      }
                    />
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <span className="rounded-full bg-[#fff0e3] px-3 py-1 text-sm font-semibold">
                  {rating}.0 / 5
                </span>
              )}

              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-stone-500 underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="border-b border-[#eadfd8] pb-4">
              <SectionHeading
                icon={Pencil}
                title={<>What's on your mind? <span className="text-red-500">*</span></>}
                subtitle="Share your experience at this café."
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience at this cafe"
                rows={4}
                maxLength={MAX_CONTENT_LENGTH}
                required
                className="w-full resize-y rounded-xl border border-[#d9cfc8] px-4 py-3 text-sm outline-none focus:border-[#8a4b20]"
              />

              <p className="mt-1 text-right text-xs text-stone-500">
                {content.length} / {MAX_CONTENT_LENGTH}
              </p>
            </div>

            {/* PHOTOS */}
            <div className="border-b border-[#eadfd8] pb-4">
              <SectionHeading
                icon={ImagePlus}
                title="Add Photos"
                subtitle={`Upload up to ${MAX_IMAGES} photos. JPG, PNG, or WEBP. Max 400 KB each.`}
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-xl border"
                  >
                    <img
                      src={image}
                      alt={`Selected café photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c9b9ae] bg-[#fdfaf8] text-center text-sm hover:bg-[#fff0e3]"
                  >
                    <ImagePlus size={25} />
                    <span className="mt-2 font-semibold">Add Photo</span>
                    <span className="text-xs text-stone-500">
                      ({images.length}/{MAX_IMAGES})
                    </span>
                  </button>
                )}
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* PURPOSE TAGS */}
            <div className="border-b border-[#eadfd8] pb-4">
              <SectionHeading
                icon={Coffee}
                title={<>Purpose Tags <span className="text-red-500">*</span></>}
                subtitle="Select one or more purposes."
              />

              <div className="flex flex-wrap gap-2">
                {PURPOSES.map(({ name, icon: Icon }) => (
                  <TagButton
                    key={name}
                    icon={Icon}
                    active={purposes.includes(name)}
                    onClick={() => togglePurpose(name)}
                  >
                    {name}
                  </TagButton>
                ))}
              </div>
            </div>

            {/* ATTRACTION FACTORS */}
            <div className="border-b border-[#eadfd8] pb-4">
              <SectionHeading
                icon={Lightbulb}
                title={<>Attraction Factors <span className="text-red-500">*</span></>}
                subtitle="Select the features you liked about this café."
              />

              {purposes.length === 0 ? (
                <p className="rounded-xl bg-[#fbf6f2] p-4 text-sm text-stone-500">
                  Select a purpose to see its attraction factors.
                </p>
              ) : (
                <div className="space-y-3">
                  {purposes.map((purpose) => (
                    <div key={purpose}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#8a4b20]">
                        {purpose}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {(FACTORS_BY_PURPOSE[purpose] || []).map((factor) => {
                          const Icon = FACTOR_ICONS[factor] || CheckCircle2;

                          return (
                            <TagButton
                              key={`${purpose}-${factor}`}
                              icon={Icon}
                              active={selectedFactors.includes(factor)}
                              onClick={() => toggleFactor(factor)}
                            >
                              {factor}
                            </TagButton>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={customFactorInput}
                      onChange={(e) => setCustomFactorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomFactor();
                        }
                      }}
                      maxLength={100}
                      placeholder="Add a custom attraction factor"
                      className="min-w-0 flex-1 rounded-xl border border-[#d9cfc8] px-3 py-2 text-sm outline-none focus:border-[#8a4b20]"
                    />

                    <button
                      type="button"
                      onClick={addCustomFactor}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9cfc8] px-4 py-2 text-sm font-semibold hover:bg-[#fff0e3]"
                    >
                      <Plus size={16} />
                      Custom Factor
                    </button>
                  </div>

                  {customFactors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customFactors.map((factor) => (
                        <TagButton
                          key={factor}
                          active={selectedFactors.includes(factor)}
                          onClick={() => toggleFactor(factor)}
                        >
                          {factor}
                        </TagButton>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-stone-500">
                    {selectedFactors.length} factor(s) selected.
                  </p>
                </div>
              )}
            </div>

            {/* FORM ACTIONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd8] pt-4 sm:flex-row sm:justify-between">
              <Link
                to="/community"
                className="rounded-xl border border-[#8a4b20] px-6 py-3 text-center font-bold text-[#8a4b20] hover:bg-[#fff4eb]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8a4b20] px-8 py-3 font-bold text-white hover:bg-[#6e3919] disabled:opacity-60"
              >
                <Send size={19} />
                {saving ? "Publishing..." : "Post"}
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-5">

          {/* POST GUIDELINES */}
          <section className="rounded-2xl border border-[#eee1d9] bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Lightbulb size={22} className="text-[#8a4b20]" />
              Post Guidelines
            </h2>

            <ul className="space-y-3 text-sm">
              {[
                "Share a real and helpful experience.",
                "Be respectful and friendly.",
                "Add clear and relevant photos.",
                "Choose appropriate tags and attraction factors.",
                "Avoid spam or unrelated content.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* LIVE PREVIEW */}
          <section className="rounded-2xl border border-[#eee1d9] bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Eye size={22} className="text-[#8a4b20]" />
              Post Preview
            </h2>

            <article className="rounded-xl border border-[#eee1d9] p-3">

              {/* Preview Author */}
              <div className="mb-4 flex items-center gap-3">
                {author.photo ? (
                  <img
                    src={author.photo}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-10 place-items-center rounded-full bg-[#f1dfd0]">
                    <UserRound size={20} />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {author.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    @{author.username}
                  </p>
                </div>

                <span className="ml-auto text-xs text-stone-500">
                  Just now
                </span>
              </div>

              {/* Preview Cafe */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-bold">
                  <Coffee size={18} className="text-[#8a4b20]" />
                  {cafeName || "Your Café Name"}
                </h3>

                {rating > 0 && (
                  <span className="rounded-lg bg-[#fff0e3] px-2 py-1 text-xs font-bold">
                    <Star
                      size={13}
                      fill="#a45b2b"
                      className="mr-1 inline text-[#a45b2b]"
                    />
                    {rating}.0 / 5
                  </span>
                )}
              </div>

              {(township || street) && (
                <p className="mb-2 flex items-center gap-1 text-xs text-stone-500">
                  <MapPin size={13} />
                  {[street, township].filter(Boolean).join(', ')}
                </p>
              )}

              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
                {content || "Your café experience will appear here..."}
              </p>

              {/* Preview Images */}
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Preview Purposes */}
              {purposes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {purposes.map((purpose) => (
                    <span
                      key={purpose}
                      className="rounded-lg bg-[#fff0e3] px-3 py-1.5 text-xs font-semibold text-[#75401e]"
                    >
                      {purpose}
                    </span>
                  ))}
                </div>
              )}

              {/* Preview Factors */}
              {selectedFactors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedFactors.map((factor) => (
                    <span
                      key={factor}
                      className="rounded-lg border border-[#eadfd8] px-2 py-1.5 text-xs text-[#75401e]"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[#eee1d9] pt-3 text-sm text-stone-600">
                <span className="flex items-center gap-1">
                  <Heart size={17} />
                  0
                </span>

                <span className="flex items-center gap-1">
                  <MessageCircle size={17} />
                  0
                </span>

                <Bookmark size={18} />
              </div>
            </article>

            <p className="mt-3 text-xs leading-5 text-stone-500">
              This is a live preview. Your post will appear in Community after publishing.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
