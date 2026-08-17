import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { signOut } from "next-auth/react";

import { authOptions } from "../api/auth/[...nextauth]";

type Video = {
  videoId: string;
  creatorId?: string;
  creatorName?: string;
  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;
  description?: string;
  status: string;
  createdAt: string;
};

type CreatorPageProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "CREATOR";
  };
};

type EditingVideo = {
  videoId: string;
  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;
  description: string;
};

export const getServerSideProps: GetServerSideProps<
  CreatorPageProps
> = async (context) => {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session?.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  if (session.user.role !== "CREATOR") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || "Creator",
        email: session.user.email || "",
        role: "CREATOR",
      },
    },
  };
};

export default function CreatorDashboard({
  user,
}: CreatorPageProps) {
  /* ============================================================
     UPLOAD STATE
  ============================================================ */

  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState(user.name);
  const [producer, setProducer] = useState("");
  const [genre, setGenre] = useState("Education");
  const [ageRating, setAgeRating] = useState("PG");
  const [description, setDescription] = useState("");

  const [selectedFileName, setSelectedFileName] =
    useState("");

  const [uploadOpen, setUploadOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* ============================================================
     VIDEO STATE
  ============================================================ */

  const [videos, setVideos] =
    useState<Video[]>([]);

  const [videosLoading, setVideosLoading] =
    useState(true);

  const [videoUrls, setVideoUrls] =
    useState<Record<string, string>>({});

  /* ============================================================
     EDIT STATE
  ============================================================ */

  const [editingVideo, setEditingVideo] =
    useState<EditingVideo | null>(null);

  const [editLoading, setEditLoading] =
    useState(false);

  const [managementMessage, setManagementMessage] =
    useState("");

  const [managementError, setManagementError] =
    useState("");

  /* ============================================================
     LOAD CREATOR VIDEOS
  ============================================================ */

  const loadVideos = useCallback(async () => {
    try {
      setVideosLoading(true);
      setManagementError("");

      const response = await fetch(
        "/api/videos?creatorOnly=true"
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setVideos(data.videos || []);
      } else {
        setManagementError(
          data.message ||
            "Failed to load your videos."
        );
      }
    } catch (error) {
      console.error(
        "Failed to load creator videos:",
        error
      );

      setManagementError(
        "Unable to load your videos."
      );
    } finally {
      setVideosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  /* ============================================================
     LOAD SECURE VIDEO URLS
  ============================================================ */

  useEffect(() => {
    if (videos.length === 0) {
      setVideoUrls({});
      return;
    }

    let cancelled = false;

    async function loadVideoUrls() {
      const results: Record<string, string> =
        {};

      await Promise.all(
        videos.map(async (video) => {
          try {
            const response = await fetch(
              `/api/videos/${video.videoId}/sas`
            );

            const data =
              await response.json();

            if (
              response.ok &&
              data.success &&
              data.videoUrl
            ) {
              results[video.videoId] =
                data.videoUrl;
            }
          } catch (error) {
            console.error(
              `Failed to load video URL for ${video.videoId}:`,
              error
            );
          }
        })
      );

      if (!cancelled) {
        setVideoUrls(results);
      }
    }

    loadVideoUrls();

    return () => {
      cancelled = true;
    };
  }, [videos]);

  /* ============================================================
     FILE SELECTION
  ============================================================ */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setMessage("");

    const file =
      event.currentTarget.files?.[0];

    if (!file) {
      setSelectedFileName("");
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError(
        "Please select a valid video file."
      );
      setSelectedFileName("");
      return;
    }

    if (file.size === 0) {
      setError(
        "The selected video file appears to be empty."
      );
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
  }

  /* ============================================================
     UPLOAD VIDEO
  ============================================================ */

  async function handleUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const fileInput =
      document.getElementById(
        "video-file"
      ) as HTMLInputElement | null;

    if (!fileInput) {
      setError(
        "Video file input could not be found."
      );
      setLoading(false);
      return;
    }

    const file =
      fileInput.files?.[0];

    if (!file) {
      setError(
        "Please select a video file."
      );
      setLoading(false);
      return;
    }

    if (file.size === 0) {
      setError(
        "The selected video file appears to be empty."
      );
      setLoading(false);
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError(
        "Please select a valid video file."
      );
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a video title."
      );
      setLoading(false);
      return;
    }

    if (!publisher.trim()) {
      setError(
        "Please enter the publisher."
      );
      setLoading(false);
      return;
    }

    if (!producer.trim()) {
      setError(
        "Please enter the producer."
      );
      setLoading(false);
      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      file,
      file.name
    );

    formData.append(
      "title",
      title.trim()
    );

    formData.append(
      "publisher",
      publisher.trim()
    );

    formData.append(
      "producer",
      producer.trim()
    );

    formData.append(
      "genre",
      genre
    );

    formData.append(
      "ageRating",
      ageRating
    );

    formData.append(
      "description",
      description.trim()
    );

    try {
      const response = await fetch(
        "/api/videos/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "Video upload failed."
        );
        setLoading(false);
        return;
      }

      setMessage(
        "Video uploaded successfully."
      );

      setTitle("");
      setPublisher(user.name);
      setProducer("");
      setGenre("Education");
      setAgeRating("PG");
      setDescription("");
      setSelectedFileName("");

      fileInput.value = "";

      setUploadOpen(false);

      await loadVideos();
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setError(
        "Unable to upload the video. Please try again."
      );
    }

    setLoading(false);
  }

  /* ============================================================
     EDIT VIDEO
  ============================================================ */

  function startEditing(video: Video) {
    setManagementError("");
    setManagementMessage("");

    setEditingVideo({
      videoId: video.videoId,
      title: video.title,
      publisher: video.publisher,
      producer: video.producer,
      genre: video.genre,
      ageRating: video.ageRating,
      description:
        video.description || "",
    });
  }

  function cancelEditing() {
    setEditingVideo(null);
    setManagementError("");
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingVideo) {
      return;
    }

    setEditLoading(true);
    setManagementError("");
    setManagementMessage("");

    try {
      const response = await fetch(
        "/api/videos/update",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            editingVideo
          ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setManagementError(
          data.message ||
            "Failed to update video."
        );
        setEditLoading(false);
        return;
      }

      setManagementMessage(
        "Video updated successfully."
      );

      setEditingVideo(null);

      await loadVideos();
    } catch (error) {
      console.error(
        "Update error:",
        error
      );

      setManagementError(
        "Unable to update the video."
      );
    }

    setEditLoading(false);
  }

  /* ============================================================
     DELETE VIDEO
  ============================================================ */

  async function handleDelete(
    videoId: string,
    videoTitle: string
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${videoTitle}"? This will remove the video from storage.`
      );

    if (!confirmed) {
      return;
    }

    setManagementError("");
    setManagementMessage("");

    try {
      const response = await fetch(
        "/api/videos/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setManagementError(
          data.message ||
            "Failed to delete video."
        );
        return;
      }

      setManagementMessage(
        "Video deleted successfully."
      );

      await loadVideos();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setManagementError(
        "Unable to delete the video."
      );
    }
  }

  /* ============================================================
     CLOSE UPLOAD MODAL
  ============================================================ */

  function closeUpload() {
    if (loading) {
      return;
    }

    setUploadOpen(false);
    setError("");
    setMessage("");
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ========================================================
          DESKTOP SIDEBAR
      ======================================================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-white/10 bg-black px-5 py-7 lg:block">

        <Link
          href="/"
          className="block text-2xl font-black tracking-tight"
        >
          <span className="text-white">
            Media
          </span>
          <span className="text-red-500">
            Nest
          </span>
        </Link>

        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-600">
          Creator Studio
        </p>

        <nav className="mt-10 space-y-2">

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg">
              ⌂
            </span>
            Home
          </Link>

          <Link
            href="/latest"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg">
              ▶
            </span>
            Latest Videos
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg">
              ⌕
            </span>
            Search
          </Link>

          <div className="my-5 border-t border-white/10" />

          <button
            type="button"
            onClick={() =>
              setUploadOpen(true)
            }
            className="flex w-full items-center gap-3 rounded-xl bg-red-500 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-red-400"
          >
            <span className="text-xl">
              +
            </span>
            Create Video
          </button>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            <span className="text-lg">
              ▣
            </span>
            My Videos
          </div>
        </nav>

        {/* ACCOUNT */}

        <div className="absolute bottom-7 left-5 right-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Creator account
          </p>

          <div className="mt-4 flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-black">
              {user.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user.name}
              </p>

              <p className="mt-1 truncate text-xs text-gray-600">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-4 inline-flex rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Creator
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="lg:ml-64">

        {/* TOP HEADER */}

        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 px-5 py-4 backdrop-blur-xl sm:px-8">

          <div className="mx-auto flex max-w-6xl items-center justify-between">

            <Link
              href="/"
              className="text-xl font-black lg:hidden"
            >
              <span className="text-white">
                Media
              </span>
              <span className="text-red-500">
                Nest
              </span>
            </Link>

            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                Creator Studio
              </p>

              <p className="mt-1 text-sm font-bold text-gray-300">
                Manage your content
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">

              <Link
                href="/"
                className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:block"
              >
                View Feed
              </Link>

              <button
                type="button"
                onClick={() =>
                  setUploadOpen(true)
                }
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-400 sm:px-5 sm:py-2.5"
              >
                + Create
              </button>

              <button
                type="button"
                onClick={() =>
                  signOut({
                    callbackUrl: "/",
                  })
                }
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-red-500/50 hover:bg-red-500/10 sm:px-5 sm:py-2.5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* PAGE */}

        <div className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-8 lg:pb-16">

          {/* ====================================================
              PROFILE
          ==================================================== */}

          <section className="border-b border-white/10 pb-8">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-red-600 to-pink-600 text-3xl font-black shadow-2xl shadow-red-500/10">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="flex-1">

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-3xl font-black tracking-tight">
                    {user.name}
                  </h1>

                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Creator
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {user.email}
                </p>

                <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600">
                  Manage your MediaNest videos,
                  upload new content and control
                  your video metadata from one
                  place.
                </p>

              </div>

              <div className="flex gap-3">

                <div className="min-w-[100px] rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
                  <p className="text-2xl font-black">
                    {videos.length}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Videos
                  </p>
                </div>

                <div className="hidden min-w-[100px] rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center sm:block">
                  <p className="text-lg font-black">
                    Azure
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Storage
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* ====================================================
              CREATOR ACTION
          ==================================================== */}

          <section className="mt-8">

            <button
              type="button"
              onClick={() =>
                setUploadOpen(true)
              }
              className="group w-full overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent p-6 text-left transition hover:border-red-500/40 sm:p-8"
            >

              <div className="flex items-center justify-between">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500 text-2xl font-black shadow-lg shadow-red-500/20">
                  +
                </div>

                <span className="text-2xl text-gray-700 transition group-hover:translate-x-1 group-hover:text-red-400">
                  →
                </span>

              </div>

              <h2 className="mt-6 text-2xl font-black">
                Create a new video
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Upload your video and add the
                required title, publisher, producer,
                genre, age rating and description.
              </p>

              <div className="mt-5 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-xs font-bold text-white">
                Start Upload
              </div>

            </button>
          </section>

          {/* ====================================================
              MESSAGES
          ==================================================== */}

          {managementError && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
              {managementError}
            </div>
          )}

          {managementMessage && (
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4 text-sm text-green-400">
              {managementMessage}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4 text-sm text-green-400">
              {message}
            </div>
          )}

          {/* ====================================================
              MY VIDEOS
          ==================================================== */}

          <section className="mt-12">

            <div className="mb-6 flex items-end justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                  Your content
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  My Videos
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Manage and preview your uploaded
                  videos.
                </p>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-500">
                {videos.length}{" "}
                {videos.length === 1
                  ? "video"
                  : "videos"}
              </span>
            </div>

            {/* LOADING */}

            {videosLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="aspect-[9/14] animate-pulse rounded-3xl bg-white/[0.04]"
                    />
                  )
                )}
              </div>
            ) : videos.length === 0 ? (

              /* EMPTY */

              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl text-gray-500">
                  +
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  No videos yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
                  Your uploaded videos will
                  appear here. Create your first
                  video to get started.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setUploadOpen(true)
                  }
                  className="mt-6 rounded-full bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-400"
                >
                  Create your first video
                </button>

              </div>

            ) : (

              /* VIDEO GRID */

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {videos.map((video) => (

                  <article
                    key={video.videoId}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d] transition hover:-translate-y-1 hover:border-white/20"
                  >

                    {/* VIDEO */}

                    <div className="relative aspect-[9/14] overflow-hidden bg-black">

                      {videoUrls[
                        video.videoId
                      ] ? (

                        <video
                          src={
                            videoUrls[
                              video.videoId
                            ]
                          }
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#171717] to-black">

                          <div className="text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-xl text-gray-500">
                              ▶
                            </div>

                            <p className="mt-3 text-xs text-gray-600">
                              Preparing video...
                            </p>

                          </div>

                        </div>
                      )}

                      {/* GRADIENT */}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />

                      {/* STATUS */}

                      <div className="absolute left-3 top-3">

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                            video.status ===
                            "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-black/60 text-gray-300"
                          }`}
                        >
                          {video.status}
                        </span>

                      </div>

                      {/* AGE */}

                      <div className="absolute right-3 top-3">

                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                          {video.ageRating}
                        </span>

                      </div>

                      {/* INFO */}

                      <div className="absolute bottom-0 left-0 right-0 p-4">

                        <h3 className="line-clamp-2 text-base font-bold leading-5">
                          {video.title}
                        </h3>

                        <p className="mt-2 text-xs font-medium text-gray-300">
                          {video.genre}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                          {video.publisher}
                        </p>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="grid grid-cols-2 gap-2 p-3">

                      <Link
                        href={`/watch/${video.videoId}`}
                        className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-xs font-bold text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                      >
                        Watch
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(video)
                        }
                        className="rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-black transition hover:bg-gray-200"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            video.videoId,
                            video.title
                          )
                        }
                        className="col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete Video
                      </button>

                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ====================================================
              CLOUD INFORMATION
          ==================================================== */}

          <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">

            <div className="mb-7">

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                MediaNest infrastructure
              </p>

              <h2 className="mt-2 text-xl font-black">
                Your creator pipeline
              </h2>

            </div>

            <div className="grid gap-5 md:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-black p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  ☁
                </div>

                <h3 className="mt-4 font-bold">
                  Azure Blob Storage
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Video media is stored securely
                  using private cloud object storage.
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  ⚡
                </div>

                <h3 className="mt-4 font-bold">
                  Background Processing
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Uploaded videos are processed
                  asynchronously through the cloud
                  pipeline.
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  ♪
                </div>

                <h3 className="mt-4 font-bold">
                  Speech Processing
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Media processing can extract audio
                  and generate speech transcription.
                </p>

              </div>

            </div>
          </section>

        </div>
      </div>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION
      ======================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/95 px-2 py-3 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-3 text-[10px] font-medium text-gray-600"
          >
            <span className="text-lg">
              ⌂
            </span>
            Home
          </Link>

          <Link
            href="/latest"
            className="flex flex-col items-center gap-1 px-3 text-[10px] font-medium text-gray-600"
          >
            <span className="text-lg">
              ▶
            </span>
            Latest
          </Link>

          <button
            type="button"
            onClick={() =>
              setUploadOpen(true)
            }
            className="flex h-11 w-12 items-center justify-center rounded-2xl bg-red-500 text-xl font-black text-white shadow-lg shadow-red-500/20"
          >
            +
          </button>

          <Link
            href="/search"
            className="flex flex-col items-center gap-1 px-3 text-[10px] font-medium text-gray-600"
          >
            <span className="text-lg">
              ⌕
            </span>
            Search
          </Link>

          <div className="flex flex-col items-center gap-1 px-3 text-[10px] font-bold text-red-400">
            <span className="text-lg">
              ▣
            </span>
            Creator
          </div>

        </div>
      </nav>

      {/* ========================================================
          UPLOAD MODAL
      ======================================================== */}

      {uploadOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0d0d] shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d0d0d]/95 px-6 py-5 backdrop-blur-xl">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                  Create
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Upload Video
                </h2>

              </div>

              <button
                type="button"
                onClick={closeUpload}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpload}
              className="space-y-5 p-6"
            >

              {/* FILE */}

              <div>

                <label
                  htmlFor="video-file"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Video File
                </label>

                <input
                  id="video-file"
                  name="file"
                  type="file"
                  accept="video/*"
                  onChange={
                    handleFileChange
                  }
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black p-3 text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
                />

                {selectedFileName && (
                  <p className="mt-2 text-xs text-green-400">
                    Selected:{" "}
                    {selectedFileName}
                  </p>
                )}

              </div>

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Enter video title"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-red-500/60"
                />

              </div>

              {/* PUBLISHER / PRODUCER */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Publisher
                  </label>

                  <input
                    type="text"
                    value={publisher}
                    onChange={(event) =>
                      setPublisher(
                        event.target.value
                      )
                    }
                    placeholder="Publisher name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-red-500/60"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Producer
                  </label>

                  <input
                    type="text"
                    value={producer}
                    onChange={(event) =>
                      setProducer(
                        event.target.value
                      )
                    }
                    placeholder="Producer name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-red-500/60"
                  />

                </div>

              </div>

              {/* GENRE / AGE */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Genre
                  </label>

                  <select
                    value={genre}
                    onChange={(event) =>
                      setGenre(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  >
                    <option>
                      Education
                    </option>
                    <option>
                      Technology
                    </option>
                    <option>
                      Documentary
                    </option>
                    <option>
                      Travel
                    </option>
                    <option>
                      Food
                    </option>
                    <option>
                      Comedy
                    </option>
                    <option>
                      Entertainment
                    </option>
                    <option>
                      Sports
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Age Rating
                  </label>

                  <select
                    value={ageRating}
                    onChange={(event) =>
                      setAgeRating(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  >
                    <option>
                      U
                    </option>
                    <option>
                      PG
                    </option>
                    <option>
                      12
                    </option>
                    <option>
                      15
                    </option>
                    <option>
                      18
                    </option>
                  </select>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe your video..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-red-500/60"
                />

              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Uploading..."
                  : "Upload Video"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL
      ======================================================== */}

      {editingVideo && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0d0d] shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d0d0d]/95 px-6 py-5 backdrop-blur-xl">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                  Manage
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Edit Video
                </h2>

              </div>

              <button
                type="button"
                onClick={cancelEditing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleUpdate}
              className="space-y-5 p-6"
            >

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Title
                </label>

                <input
                  type="text"
                  value={
                    editingVideo.title
                  }
                  onChange={(event) =>
                    setEditingVideo({
                      ...editingVideo,
                      title:
                        event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                />

              </div>

              {/* PUBLISHER / PRODUCER */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Publisher
                  </label>

                  <input
                    type="text"
                    value={
                      editingVideo.publisher
                    }
                    onChange={(event) =>
                      setEditingVideo({
                        ...editingVideo,
                        publisher:
                          event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Producer
                  </label>

                  <input
                    type="text"
                    value={
                      editingVideo.producer
                    }
                    onChange={(event) =>
                      setEditingVideo({
                        ...editingVideo,
                        producer:
                          event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  />

                </div>

              </div>

              {/* GENRE / AGE */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Genre
                  </label>

                  <select
                    value={
                      editingVideo.genre
                    }
                    onChange={(event) =>
                      setEditingVideo({
                        ...editingVideo,
                        genre:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  >
                    <option>
                      Education
                    </option>
                    <option>
                      Technology
                    </option>
                    <option>
                      Documentary
                    </option>
                    <option>
                      Travel
                    </option>
                    <option>
                      Food
                    </option>
                    <option>
                      Comedy
                    </option>
                    <option>
                      Entertainment
                    </option>
                    <option>
                      Sports
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Age Rating
                  </label>

                  <select
                    value={
                      editingVideo.ageRating
                    }
                    onChange={(event) =>
                      setEditingVideo({
                        ...editingVideo,
                        ageRating:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                  >
                    <option>
                      U
                    </option>
                    <option>
                      PG
                    </option>
                    <option>
                      12
                    </option>
                    <option>
                      15
                    </option>
                    <option>
                      18
                    </option>
                  </select>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Description
                </label>

                <textarea
                  value={
                    editingVideo.description
                  }
                  onChange={(event) =>
                    setEditingVideo({
                      ...editingVideo,
                      description:
                        event.target.value,
                    })
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-red-500/60"
                />

              </div>

              {/* ERROR */}

              {managementError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {managementError}
                </div>
              )}

              {/* SAVE */}

              <button
                type="submit"
                disabled={editLoading}
                className="w-full rounded-xl bg-red-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editLoading
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

            </form>
          </div>
        </div>
      )}
    </main>
  );
}