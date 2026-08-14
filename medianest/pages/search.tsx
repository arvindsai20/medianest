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

    const trimmedQuery = query.trim();

    setSearched(trimmedQuery.length > 0);

    await searchVideos(trimmedQuery);
  }

  useEffect(() => {
    searchVideos("");
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* MediaNest Logo */}

          <Link
            href="/"
            className="shrink-0 text-2xl font-black tracking-tight sm:text-3xl"
          >
            <span className="text-white">Media</span>
            <span className="text-red-500">Nest</span>
          </Link>

          {/* Top Search Bar */}

          <form
            onSubmit={handleSearch}
            className="mx-auto flex min-w-0 flex-1 max-w-2xl"
          >
            <div className="flex w-full items-center rounded-full border border-white/15 bg-white/[0.06] px-4 transition focus-within:border-white/30 focus-within:bg-white/[0.08]">
              <svg
                className="mr-3 h-5 w-5 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                />
              </svg>

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search videos, creators, genres..."
                className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-gray-500 sm:text-base"
              />

              <button
                type="submit"
                disabled={loading}
                className="hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:block"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Authentication */}

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 sm:block"
            >
              Creator Login
            </Link>

            <Link
              href="/register"
              className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================= */}

      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {/* Page Heading */}

        <section className="mb-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
              Discover MediaNest
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Find your next video.
            </h1>

            <p className="mt-4 text-base leading-7 text-gray-400 sm:text-lg">
              Search videos by title, publisher, producer,
              genre or description.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RESULTS HEADER */}
        {/* ========================================================= */}

        <section>
          <div className="mb-7 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                {searched && query.trim()
                  ? `Results for "${query.trim()}"`
                  : "Latest Videos"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {searched && query.trim()
                  ? "Videos matching your search"
                  : "Explore the latest videos on MediaNest"}
              </p>
            </div>

            {!loading && !error && (
              <span className="text-sm text-gray-500">
                {videos.length}{" "}
                {videos.length === 1
                  ? "video"
                  : "videos"}
              </span>
            )}
          </div>

          {/* ======================================================= */}
          {/* LOADING */}
          {/* ======================================================= */}

          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-red-500" />

                <p className="text-gray-400">
                  Finding videos...
                </p>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* ERROR */}
          {/* ======================================================= */}

          {error && !loading && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <span className="text-xl text-red-400">
                  !
                </span>
              </div>

              <h3 className="text-lg font-bold">
                Something went wrong
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                {error}
              </p>

              <button
                onClick={() => searchVideos(query.trim())}
                className="mt-5 rounded-full bg-red-500 px-6 py-2.5 text-sm font-bold transition hover:bg-red-400"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* EMPTY RESULTS */}
          {/* ======================================================= */}

          {!loading &&
            !error &&
            videos.length === 0 && (
              <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-[#0b0b0b]">
                <div className="max-w-md px-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <svg
                      className="h-8 w-8 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold">
                    No videos found
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Try another title, creator, genre or
                    keyword.
                  </p>

                  <Link
                    href="/"
                    className="mt-6 inline-block rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Back to Latest Videos
                  </Link>
                </div>
              </div>
            )}

          {/* ======================================================= */}
          {/* VIDEO RESULTS */}
          {/* ======================================================= */}

          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {videos.map((video) => (
                <article
                  key={video.videoId}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#111111]"
                >
                  {/* Video Preview */}

                  <Link
                    href={`/watch/${video.videoId}`}
                    className="block"
                  >
                    <div className="relative aspect-[9/14] overflow-hidden bg-[#111111]">
                      {videoUrls[video.videoId] ? (
                        <video
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          src={videoUrls[video.videoId]}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-600">
                          Video preview unavailable
                        </div>
                      )}

                      {/* Bottom Gradient */}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Age Rating */}

                      <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                        {video.ageRating}
                      </span>

                      {/* Play Icon */}

                      <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur-md transition group-hover:opacity-100">
                        <svg
                          className="ml-0.5 h-5 w-5 fill-white"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* Video Information */}

                  <div className="p-4">
                    <Link
                      href={`/watch/${video.videoId}`}
                      className="block"
                    >
                      <h3 className="line-clamp-2 text-base font-bold leading-6 text-white transition group-hover:text-red-400">
                        {video.title}
                      </h3>
                    </Link>

                    <p className="mt-2 truncate text-sm text-gray-500">
                      {video.publisher}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="truncate rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-400">
                        {video.genre}
                      </span>

                      <span className="shrink-0 truncate text-xs text-gray-600">
                        {video.producer}
                      </span>
                    </div>

                    {video.description && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-600">
                        {video.description}
                      </p>
                    )}

                    <Link
                      href={`/watch/${video.videoId}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
                    >
                      Watch Video

                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9 18 6-6-6-6"
                        />
                      </svg>
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