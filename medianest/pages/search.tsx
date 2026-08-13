import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Video = {
  videoId: string;
  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;
  description?: string;
  createdAt: string;
  status: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchVideos(searchTerm: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/videos?q=${encodeURIComponent(searchTerm)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Search failed.");
      }

      const results: Video[] = data.videos || [];

      setVideos(results);

      // Get secure SAS URLs for the video previews.
      const urlEntries = await Promise.all(
        results.map(async (video) => {
          try {
            const sasResponse = await fetch(
              `/api/videos/${video.videoId}/sas`
            );

            const sasData = await sasResponse.json();

            if (sasResponse.ok && sasData.success) {
              return [video.videoId, sasData.videoUrl] as const;
            }
          } catch (sasError) {
            console.error(
              `Failed to get video URL for ${video.videoId}`,
              sasError
            );
          }

          return [video.videoId, ""] as const;
        })
      );

      const urls: Record<string, string> = {};

      for (const [videoId, url] of urlEntries) {
        if (url) {
          urls[videoId] = url;
        }
      }

      setVideoUrls(urls);
    } catch (err) {
      console.error("Search error:", err);

      setVideos([]);
      setVideoUrls({});

      setError(
        err instanceof Error
          ? err.message
          : "Failed to search videos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSearched(true);

    await searchVideos(query.trim());
  }

  useEffect(() => {
    searchVideos("");
    setSearched(false);
  }, []);

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to MediaNest
        </Link>

        <section className="mt-12">
          <h1 className="text-5xl font-bold">
            Search Videos
          </h1>

          <p className="mt-4 text-xl text-gray-400">
            Search MediaNest videos by title, publisher,
            producer, genre or description.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-12 flex gap-4"
          >
            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search videos..."
              className="flex-1 rounded-2xl border border-blue-500 bg-[#11151e] px-6 py-5 text-lg text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-10 py-5 text-lg font-bold hover:bg-blue-500"
            >
              Search
            </button>
          </form>
        </section>

        <section className="mt-14">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">
              {searched
                ? "Search Results"
                : "Latest Videos"}
            </h2>

            <span className="text-gray-500">
              {videos.length}{" "}
              {videos.length === 1
                ? "result"
                : "results"}
            </span>
          </div>

          {loading && (
            <div className="rounded-2xl border border-gray-800 bg-[#11151e] p-10 text-center text-gray-400">
              Loading videos...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-800 bg-red-950/30 p-6 text-red-300">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            videos.length === 0 && (
              <div className="rounded-2xl border border-gray-800 bg-[#11151e] p-10 text-center text-gray-400">
                No videos found.
              </div>
            )}

          {!loading && videos.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <article
                  key={video.videoId}
                  className="overflow-hidden rounded-2xl border border-gray-800 bg-[#11151e] shadow-xl"
                >
                  <div className="aspect-video bg-black">
                    {videoUrls[video.videoId] ? (
                      <video
                        className="h-full w-full object-cover"
                        controls
                        preload="metadata"
                        src={videoUrls[video.videoId]}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        Video preview unavailable
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold">
                        {video.title}
                      </h3>

                      <span className="rounded-lg bg-blue-950 px-3 py-1 text-sm text-blue-300">
                        {video.ageRating}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 text-gray-400">
                      <p>
                        <span className="text-gray-300">
                          Publisher:
                        </span>{" "}
                        {video.publisher}
                      </p>

                      <p>
                        <span className="text-gray-300">
                          Producer:
                        </span>{" "}
                        {video.producer}
                      </p>

                      <p>
                        <span className="text-gray-300">
                          Genre:
                        </span>{" "}
                        {video.genre}
                      </p>
                    </div>

                    {video.description && (
                      <p className="mt-5 line-clamp-2 text-gray-400">
                        {video.description}
                      </p>
                    )}

                    <Link
                      href={`/watch/${video.videoId}`}
                      className="mt-6 block rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold hover:bg-blue-500"
                    >
                      Watch Video
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}