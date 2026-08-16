import { FormEvent, useState } from "react";
import Head from "next/head";

export default function CreatorUpload() {
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!video) {
      setMessage("Please select a video file.");
      return;
    }

    const formData = new FormData(form);
    formData.set("video", video);

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Upload failed."
        );
      }

      setMessage("Video uploaded successfully.");

      form.reset();
      setVideo(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Upload Video | MediaNest</title>
        <meta
          name="description"
          content="Upload and publish videos to MediaNest."
        />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <a
              href="/"
              className="text-2xl font-black tracking-tight"
            >
              Media
              <span className="text-red-600">Nest</span>
            </a>

            <a
              href="/creator"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
            >
              ← Creator Dashboard
            </a>
          </div>
        </header>

        {/* Main Content */}
        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Heading */}
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              Creator Studio
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Upload a video.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
              Add your video and provide the metadata required
              to publish it on MediaNest.
            </p>
          </div>

          {/* Upload Area */}
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl"
          >
            {/* Form Header */}
            <div className="border-b border-white/10 px-6 py-6 sm:px-8">
              <h2 className="text-xl font-bold">
                Video details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Complete the information below before uploading.
              </p>
            </div>

            <div className="space-y-7 p-6 sm:p-8">
              {/* Video File */}
              <div>
                <label className="mb-3 block text-sm font-semibold">
                  Video File
                </label>

                <label
                  htmlFor="video-upload"
                  className={`group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition ${
                    video
                      ? "border-red-600/60 bg-red-600/[0.04]"
                      : "border-white/15 bg-white/[0.02] hover:border-red-600/50 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10 text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-7 w-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16V4m0 0L8 8m4-4 4 4"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 14v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3"
                      />
                    </svg>
                  </div>

                  {video ? (
                    <>
                      <p className="max-w-full truncate text-sm font-semibold text-white">
                        {video.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {(video.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white">
                        Select a video
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Click here to choose a video file
                      </p>
                    </>
                  )}

                  <input
                    id="video-upload"
                    type="file"
                    name="video"
                    accept="video/*"
                    required
                    onChange={(event) => {
                      setVideo(
                        event.target.files?.[0] || null
                      );
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Metadata Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Title */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Title
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="Enter video title"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-600 focus:bg-white/[0.05]"
                  />
                </div>

                {/* Publisher */}
                <div>
                  <label
                    htmlFor="publisher"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Publisher
                  </label>

                  <input
                    id="publisher"
                    name="publisher"
                    type="text"
                    required
                    placeholder="Enter publisher"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-600 focus:bg-white/[0.05]"
                  />
                </div>

                {/* Producer */}
                <div>
                  <label
                    htmlFor="producer"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Producer
                  </label>

                  <input
                    id="producer"
                    name="producer"
                    type="text"
                    required
                    placeholder="Enter producer"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-600 focus:bg-white/[0.05]"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label
                    htmlFor="genre"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Genre
                  </label>

                  <select
                    id="genre"
                    name="genre"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition focus:border-red-600"
                  >
                    <option value="" disabled>
                      Select genre
                    </option>

                    <option value="Action">Action</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Drama">Drama</option>
                    <option value="Documentary">
                      Documentary
                    </option>
                    <option value="Education">
                      Education
                    </option>
                    <option value="Entertainment">
                      Entertainment
                    </option>
                    <option value="Music">Music</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">
                      Technology
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Age Rating */}
                <div>
                  <label
                    htmlFor="ageRating"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Age Rating
                  </label>

                  <select
                    id="ageRating"
                    name="ageRating"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition focus:border-red-600"
                  >
                    <option value="" disabled>
                      Select age rating
                    </option>

                    <option value="U">U</option>
                    <option value="PG">PG</option>
                    <option value="12">12</option>
                    <option value="12A">12A</option>
                    <option value="15">15</option>
                    <option value="18">18</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    placeholder="Tell viewers what this video is about..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-600 focus:bg-white/[0.05]"
                  />
                </div>
              </div>

              {/* Information */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                      />
                      <path
                        strokeLinecap="round"
                        d="M12 10v6"
                      />
                      <path
                        strokeLinecap="round"
                        d="M12 7h.01"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Media processing
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      After upload, MediaNest processes the
                      video in the background before it becomes
                      available for viewing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Uploading video...
                  </>
                ) : (
                  <>
                    Upload Video
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14m-6-6 6 6-6 6"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Status Message */}
              {message && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    message.toLowerCase().includes("success")
                      ? "border-green-500/20 bg-green-500/10 text-green-400"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </form>

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs text-gray-600">
            MediaNest Creator Studio
          </p>
        </section>
      </main>
    </>
  );
}