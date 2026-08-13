import { useEffect, useState } from "react";
import Head from "next/head";

type Video = {
  videoId: string;
  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;
  description?: string;
  blobUrl: string;
  originalFileName?: string;
  contentType?: string;
  status: string;
  createdAt: string;
};

export default function LatestVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVideos() {
      try {
        const response = await fetch("/api/videos");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to load videos."
          );
        }

        setVideos(data.videos || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load videos."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  return (
    <>
      <Head>
        <title>Latest Videos | MediaNest</title>
      </Head>

      <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-10">
            <a
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to MediaNest
            </a>

            <h1 className="mt-5 text-4xl font-bold">
              Latest Videos
            </h1>

            <p className="mt-2 text-gray-400">
              Browse the latest videos uploaded to MediaNest.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
              Loading videos...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && videos.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
              No videos have been uploaded yet.
            </div>
          )}

          {/* Videos */}
          {!loading && !error && videos.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {videos.map((video) => (
                <article
                  key={video.videoId}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-blue-500/40"
                >

                  {/* Video Preview */}
                  <div className="aspect-video bg-black">
                    <video
                      controls
                      preload="metadata"
                      className="h-full w-full object-contain"
                    >
                      <source
                        src={video.blobUrl}
                        type={
                          video.contentType ||
                          "video/mp4"
                        }
                      />

                      Your browser does not support
                      video playback.
                    </video>
                  </div>

                  {/* Details */}
                  <div className="p-5">

                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold">
                        {video.title}
                      </h2>

                      <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
                        {video.ageRating}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">

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

                      {video.description && (
                        <p className="pt-2 text-gray-400">
                          {video.description}
                        </p>
                      )}

                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                      Uploaded{" "}
                      {new Date(
                        video.createdAt
                      ).toLocaleString()}
                    </p>

                    <a
                      href={`/watch/${video.videoId}`}
                      className="mt-5 block rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold transition hover:bg-blue-500"
                    >
                      Watch Video
                    </a>

                  </div>
                </article>
              ))}

            </div>
          )}

        </div>
      </main>
    </>
  );
}