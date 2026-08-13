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

    // Save the form reference before the async operation
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
      const response = await fetch(
        "/api/videos/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Upload failed."
        );
      }

      setMessage(
        "Video uploaded successfully."
      );

      // Reset the form using the saved reference
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
      </Head>

      <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="mb-8">
            <a
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to MediaNest
            </a>

            <h1 className="mt-5 text-4xl font-bold">
              Upload Video
            </h1>

            <p className="mt-2 text-gray-400">
              Upload your video and provide the required
              metadata.
            </p>
          </div>

          {/* Upload Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
          >

            {/* Video File */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Video File
              </label>

              <input
                type="file"
                name="video"
                accept="video/*"
                required
                onChange={(event) => {
                  setVideo(
                    event.target.files?.[0] || null
                  );
                }}
                className="block w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm"
              />

              {video && (
                <p className="mt-2 text-sm text-gray-400">
                  Selected: {video.name}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Title
              </label>

              <input
                name="title"
                type="text"
                required
                placeholder="Enter video title"
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Publisher
              </label>

              <input
                name="publisher"
                type="text"
                required
                placeholder="Enter publisher"
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Producer */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Producer
              </label>

              <input
                name="producer"
                type="text"
                required
                placeholder="Enter producer"
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Genre
              </label>

              <select
                name="genre"
                required
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-[#111827] p-3 outline-none focus:border-blue-500"
              >
                <option value="" disabled>
                  Select genre
                </option>

                <option value="Action">
                  Action
                </option>

                <option value="Comedy">
                  Comedy
                </option>

                <option value="Drama">
                  Drama
                </option>

                <option value="Documentary">
                  Documentary
                </option>

                <option value="Education">
                  Education
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Music">
                  Music
                </option>

                <option value="Sports">
                  Sports
                </option>

                <option value="Technology">
                  Technology
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* Age Rating */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Age Rating
              </label>

              <select
                name="ageRating"
                required
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-[#111827] p-3 outline-none focus:border-blue-500"
              >
                <option value="" disabled>
                  Select age rating
                </option>

                <option value="U">
                  U
                </option>

                <option value="PG">
                  PG
                </option>

                <option value="12">
                  12
                </option>

                <option value="12A">
                  12A
                </option>

                <option value="15">
                  15
                </option>

                <option value="18">
                  18
                </option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                rows={5}
                placeholder="Enter a description"
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Upload Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : "Upload Video"}
            </button>

            {/* Status Message */}
            {message && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
                {message}
              </div>
            )}

          </form>
        </div>
      </main>
    </>
  );
}