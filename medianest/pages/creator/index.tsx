import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  GetServerSideProps,
} from "next";

import {
  getServerSession,
} from "next-auth";

import {
  authOptions,
} from "../api/auth/[...nextauth]";

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

export const getServerSideProps:
  GetServerSideProps<
    CreatorPageProps
  > = async (context) => {
    const session =
      await getServerSession(
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

    if (
      session.user.role !==
      "CREATOR"
    ) {
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
          name:
            session.user.name ||
            "Creator",
          email:
            session.user.email || "",
          role: "CREATOR",
        },
      },
    };
  };

export default function CreatorDashboard({
  user,
}: CreatorPageProps) {
  /*
   * Upload form state
   */
  const [title, setTitle] =
    useState("");

  const [publisher, setPublisher] =
    useState(user.name);

  const [producer, setProducer] =
    useState("");

  const [genre, setGenre] =
    useState("Education");

  const [ageRating, setAgeRating] =
    useState("PG");

  const [description, setDescription] =
    useState("");

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * Video management state
   */
  const [videos, setVideos] =
    useState<Video[]>([]);

  const [
    videosLoading,
    setVideosLoading,
  ] = useState(true);

  const [
    editingVideo,
    setEditingVideo,
  ] = useState<EditingVideo | null>(
    null
  );

  const [
    editLoading,
    setEditLoading,
  ] = useState(false);

  const [
    managementMessage,
    setManagementMessage,
  ] = useState("");

  const [
    managementError,
    setManagementError,
  ] = useState("");

  /*
   * Load only the logged-in
   * creator's videos.
   */
  async function loadVideos() {
    try {
      setVideosLoading(true);

      const response =
        await fetch(
          "/api/videos?creatorOnly=true"
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setVideos(
          data.videos || []
        );
      } else {
        setManagementError(
          data.message ||
            "Failed to load your videos."
        );
      }
    } catch (error) {
      console.error(
        "Failed to load videos:",
        error
      );

      setManagementError(
        "Unable to load your videos."
      );
    } finally {
      setVideosLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  /*
   * File selection
   */
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setMessage("");

    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    if (!file) {
      setSelectedFileName("");
      return;
    }

    console.log(
      "FILE SELECTED:",
      file.name,
      file.size,
      file.type
    );

    setSelectedFileName(
      file.name
    );
  }

  /*
   * Upload video
   */
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

    if (
      !file.type.startsWith(
        "video/"
      )
    ) {
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

    const formData =
      new FormData();

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
      const response =
        await fetch(
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

  /*
   * Start editing a video.
   */
  function startEditing(
    video: Video
  ) {
    setManagementError("");
    setManagementMessage("");

    setEditingVideo({
      videoId: video.videoId,

      title: video.title,

      publisher:
        video.publisher,

      producer:
        video.producer,

      genre:
        video.genre,

      ageRating:
        video.ageRating,

      description:
        video.description || "",
    });
  }

  /*
   * Cancel editing.
   */
  function cancelEditing() {
    setEditingVideo(null);
    setManagementError("");
  }

  /*
   * Save edited metadata.
   */
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
      const response =
        await fetch(
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

  /*
   * Delete video.
   */
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
      const response =
        await fetch(
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-bold"
          >
            Media
            <span className="text-red-500">
              Nest
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-slate-400">
                Creator
              </p>

              <p className="font-semibold">
                {user.name}
              </p>
            </div>

            <Link
              href="/"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-500">
            Creator Area
          </p>

          <h1 className="text-4xl font-bold">
            Creator Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Upload and manage your videos on
            MediaNest using cloud storage.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold">
                Upload a Video
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Add your video and its required
                metadata.
              </p>
            </div>

            <form
              onSubmit={handleUpload}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="video-file"
                  className="mb-2 block text-sm font-medium text-slate-300"
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
                  className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:font-semibold file:text-white"
                />

                {selectedFileName && (
                  <p className="mt-2 text-xs text-green-400">
                    Selected:{" "}
                    {selectedFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Genre
                  </label>

                  <select
                    value={genre}
                    onChange={(event) =>
                      setGenre(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
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
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Age Rating
                  </label>

                  <select
                    value={ageRating}
                    onChange={(event) =>
                      setAgeRating(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
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
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Uploading..."
                  : "Upload Video"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold">
                Creator Account
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Name
                  </p>

                  <p className="mt-1 font-medium">
                    {user.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-300">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Role
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                    CREATOR
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold">
                Cloud Storage
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Videos uploaded through this
                dashboard are stored using
                Azure Blob Storage.
              </p>

              <div className="mt-5 rounded-lg bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Storage
                </p>

                <p className="mt-1 font-medium text-cyan-400">
                  Azure Blob Storage
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* VIDEO MANAGEMENT */}

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Manage Your Videos
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                View, edit and delete videos uploaded
                from your creator account.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
              {videos.length} videos
            </span>
          </div>

          {managementError && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {managementError}
            </div>
          )}

          {managementMessage && (
            <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {managementMessage}
            </div>
          )}

          {videosLoading ? (
            <p className="mt-8 text-slate-500">
              Loading your videos...
            </p>
          ) : videos.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">
                No videos uploaded yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Upload your first video using
                the form above.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {videos.map(
                (video) => (
                  <div
                    key={
                      video.videoId
                    }
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold">
                        {video.title}
                      </h3>

                      <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                        {video.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <p>
                        Genre:{" "}
                        <span className="text-slate-300">
                          {video.genre}
                        </span>
                      </p>

                      <p>
                        Publisher:{" "}
                        <span className="text-slate-300">
                          {video.publisher}
                        </span>
                      </p>

                      <p>
                        Producer:{" "}
                        <span className="text-slate-300">
                          {video.producer}
                        </span>
                      </p>

                      <p>
                        Age Rating:{" "}
                        <span className="text-slate-300">
                          {video.ageRating}
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/watch/${video.videoId}`}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-red-500 hover:text-white"
                      >
                        Watch
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(
                            video
                          )
                        }
                        className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
                      >
                        Edit
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          video.videoId,
                          video.title
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                    >
                      Delete Video
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* EDIT PANEL */}

        {editingVideo && (
          <section className="mt-8 rounded-2xl border border-blue-500/30 bg-slate-900 p-8">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                  Video Management
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Edit Video
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  cancelEditing
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                handleUpdate
              }
              className="space-y-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Title
                </label>

                <input
                  type="text"
                  value={
                    editingVideo.title
                  }
                  onChange={(event) =>
                    setEditingVideo(
                      {
                        ...editingVideo,
                        title:
                          event.target
                            .value,
                      }
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Publisher
                  </label>

                  <input
                    type="text"
                    value={
                      editingVideo.publisher
                    }
                    onChange={(
                      event
                    ) =>
                      setEditingVideo(
                        {
                          ...editingVideo,
                          publisher:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Producer
                  </label>

                  <input
                    type="text"
                    value={
                      editingVideo.producer
                    }
                    onChange={(
                      event
                    ) =>
                      setEditingVideo(
                        {
                          ...editingVideo,
                          producer:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Genre
                  </label>

                  <select
                    value={
                      editingVideo.genre
                    }
                    onChange={(
                      event
                    ) =>
                      setEditingVideo(
                        {
                          ...editingVideo,
                          genre:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Age Rating
                  </label>

                  <select
                    value={
                      editingVideo.ageRating
                    }
                    onChange={(
                      event
                    ) =>
                      setEditingVideo(
                        {
                          ...editingVideo,
                          ageRating:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={
                    editingVideo.description
                  }
                  onChange={(
                    event
                  ) =>
                    setEditingVideo(
                      {
                        ...editingVideo,
                        description:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  editLoading
                }
                className="w-full rounded-lg bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editLoading
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}