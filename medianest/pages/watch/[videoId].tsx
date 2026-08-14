import { useRouter } from "next/router";
import { useEffect, useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";

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

type Comment = {
  commentId: string;
  videoId: string;
  userName: string;
  comment: string;
  createdAt: string;
};

type Rating = {
  ratingId: string;
  videoId: string;
  userName: string;
  rating: number;
  createdAt: string;
};

export default function WatchVideo() {
  const router = useRouter();

  const videoId =
    typeof router.query.videoId === "string"
      ? router.query.videoId
      : undefined;

  const [video, setVideo] = useState<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);

  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState("");

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  // Ratings
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const [ratingName, setRatingName] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");

  // Load video
  useEffect(() => {
    if (!router.isReady || !videoId) {
      return;
    }

    const currentVideoId = videoId;

    async function loadVideo() {
      try {
        setLoading(true);
        setError("");
        setVideoError("");
        setVideoLoading(true);

        const response = await fetch(
          `/api/videos/${currentVideoId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to load video."
          );
        }

        setVideo(data.video);

        // Generate temporary read-only SAS URL
        const sasResponse = await fetch(
          `/api/videos/${currentVideoId}/sas`
        );

        const sasData = await sasResponse.json();

        if (!sasResponse.ok) {
          throw new Error(
            sasData.error ||
              "Failed to generate secure video URL."
          );
        }

        setVideoUrl(sasData.videoUrl);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load video."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, [router.isReady, videoId]);

  // Load comments
  useEffect(() => {
    if (!router.isReady || !videoId) {
      return;
    }

    const currentVideoId = videoId;

    async function loadComments() {
      try {
        setCommentsLoading(true);
        setCommentError("");

        const response = await fetch(
          `/api/comments?videoId=${encodeURIComponent(
            currentVideoId
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load comments."
          );
        }

        setComments(data.comments || []);
      } catch (error) {
        console.error("Load comments error:", error);

        setCommentError(
          error instanceof Error
            ? error.message
            : "Failed to load comments."
        );
      } finally {
        setCommentsLoading(false);
      }
    }

    loadComments();
  }, [router.isReady, videoId]);

  // Load ratings
  useEffect(() => {
    if (!router.isReady || !videoId) {
      return;
    }

    const currentVideoId = videoId;

    async function loadRatings() {
      try {
        setRatingsLoading(true);
        setRatingError("");

        const response = await fetch(
          `/api/ratings?videoId=${encodeURIComponent(
            currentVideoId
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load ratings."
          );
        }

        setRatings(data.ratings || []);

        setAverageRating(
          Number(data.averageRating || 0)
        );

        setTotalRatings(
          Number(data.totalRatings || 0)
        );
      } catch (error) {
        console.error("Load ratings error:", error);

        setRatingError(
          error instanceof Error
            ? error.message
            : "Failed to load ratings."
        );
      } finally {
        setRatingsLoading(false);
      }
    }

    loadRatings();
  }, [router.isReady, videoId]);

  // Submit comment
  async function handleCommentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!videoId) {
      return;
    }

    setCommentError("");
    setCommentSuccess("");

    if (!commentName.trim()) {
      setCommentError("Please enter your name.");
      return;
    }

    if (!commentText.trim()) {
      setCommentError("Please enter a comment.");
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          userName: commentName.trim(),
          comment: commentText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to add comment."
        );
      }

      setComments((currentComments) => [
        data.comment,
        ...currentComments,
      ]);

      setCommentText("");

      setCommentSuccess(
        "Comment added successfully."
      );
    } catch (error) {
      console.error(
        "Submit comment error:",
        error
      );

      setCommentError(
        error instanceof Error
          ? error.message
          : "Failed to add comment."
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  // Submit rating
  async function handleRatingSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!videoId) {
      return;
    }

    setRatingError("");
    setRatingSuccess("");

    if (!ratingName.trim()) {
      setRatingError("Please enter your name.");
      return;
    }

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setRatingError(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    try {
      setRatingSubmitting(true);

      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          userName: ratingName.trim(),
          rating: selectedRating,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to submit rating."
        );
      }

      const newRating: Rating = data.rating;

      setRatings((currentRatings) => [
        newRating,
        ...currentRatings,
      ]);

      const newTotal = totalRatings + 1;

      const newAverage =
        (averageRating * totalRatings +
          selectedRating) /
        newTotal;

      setTotalRatings(newTotal);

      setAverageRating(
        Math.round(newAverage * 10) / 10
      );

      setRatingName("");
      setSelectedRating(0);

      setRatingSuccess(
        "Rating submitted successfully."
      );
    } catch (error) {
      console.error(
        "Submit rating error:",
        error
      );

      setRatingError(
        error instanceof Error
          ? error.message
          : "Failed to submit rating."
      );
    } finally {
      setRatingSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>
          {video
            ? `${video.title} | MediaNest`
            : "Watch Video | MediaNest"}
        </title>
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link
              href="/"
              className="shrink-0"
            >
              <div className="text-2xl font-black tracking-tight">
                Media<span className="text-red-500">Nest</span>
              </div>
            </Link>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-red-500/40 hover:bg-white/5"
              >
                Creator Login
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
          {/* Back */}
          <Link
            href="/latest"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white"
          >
            <span className="text-lg">←</span>
            Back to Latest Videos
          </Link>

          {/* Loading */}
          {loading && (
            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d]">
              <div className="flex aspect-video items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                  <p className="text-sm text-gray-400">
                    Loading video...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
                !
              </div>

              <h2 className="text-xl font-bold">
                Unable to load video
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm text-red-200/70">
                {error}
              </p>

              <Link
                href="/latest"
                className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 text-sm font-bold transition hover:bg-red-500"
              >
                Browse Latest Videos
              </Link>
            </div>
          )}

          {/* Main video */}
          {!loading &&
            !error &&
            video && (
              <>
                <section className="mt-8">
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/40">
                    <div className="relative flex min-h-[300px] items-center justify-center bg-black">
                      {videoLoading &&
                        !videoError && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                            <div className="text-center">
                              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
                              <p className="text-sm text-gray-500">
                                Loading video player...
                              </p>
                            </div>
                          </div>
                        )}

                      {videoError && (
                        <div className="flex aspect-video w-full items-center justify-center p-8 text-center">
                          <div>
                            <div className="mb-4 text-4xl">
                              ⚠
                            </div>

                            <h3 className="font-semibold">
                              Video playback unavailable
                            </h3>

                            <p className="mt-2 max-w-md text-sm text-gray-500">
                              {videoError}
                            </p>
                          </div>
                        </div>
                      )}

                      {videoUrl &&
                        !videoError && (
                          <video
                            key={videoUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className={`max-h-[75vh] w-full ${
                              videoLoading
                                ? "invisible"
                                : "visible"
                            }`}
                            onLoadedMetadata={() => {
                              setVideoLoading(false);
                            }}
                            onCanPlay={() => {
                              setVideoLoading(false);
                            }}
                            onError={() => {
                              setVideoLoading(false);
                              setVideoError(
                                "The video could not be played. The video file may use an unsupported format."
                              );
                            }}
                          >
                            <source
                              src={videoUrl}
                              type={
                                video.contentType ||
                                "video/mp4"
                              }
                            />

                            Your browser does not support
                            video playback.
                          </video>
                        )}
                    </div>
                  </div>
                </section>

                {/* Video heading */}
                <section className="mt-7">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-4xl">
                      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                        {video.title}
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>
                          Uploaded{" "}
                          {new Date(
                            video.createdAt
                          ).toLocaleString()}
                        </span>

                        <span className="text-gray-700">
                          •
                        </span>

                        <span>
                          {video.genre}
                        </span>
                      </div>
                    </div>

                    <span className="w-fit shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
                      {video.ageRating}
                    </span>
                  </div>
                </section>

                {/* Main content grid */}
                <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
                  {/* Video information */}
                  <section className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
                    <div className="mb-7">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                        Video Details
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        About this video
                      </h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Publisher
                        </p>

                        <p className="mt-2 text-base font-medium text-gray-200">
                          {video.publisher}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Producer
                        </p>

                        <p className="mt-2 text-base font-medium text-gray-200">
                          {video.producer}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Genre
                        </p>

                        <p className="mt-2 text-base font-medium text-gray-200">
                          {video.genre}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Age Rating
                        </p>

                        <p className="mt-2 text-base font-medium text-gray-200">
                          {video.ageRating}
                        </p>
                      </div>
                    </div>

                    {video.description && (
                      <div className="mt-8 border-t border-white/10 pt-7">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Description
                        </p>

                        <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-400">
                          {video.description}
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Rating summary */}
                  <section className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                      Community Rating
                    </p>

                    <div className="mt-6 flex items-end gap-3">
                      <span className="text-5xl font-black">
                        {averageRating.toFixed(1)}
                      </span>

                      <div className="pb-2">
                        <div className="text-xl tracking-widest text-yellow-400">
                          ★★★★★
                        </div>

                        <p className="mt-1 text-xs text-gray-600">
                          {totalRatings}{" "}
                          {totalRatings === 1
                            ? "rating"
                            : "ratings"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${Math.min(
                            averageRating * 20,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-5 text-sm leading-6 text-gray-500">
                      Rate this video below and share
                      your experience with the MediaNest
                      community.
                    </p>
                  </section>
                </div>

                {/* Comments */}
                <section className="mt-8 rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                        Community
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        Comments
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Share your thoughts about this
                        video.
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400">
                      {comments.length}{" "}
                      {comments.length === 1
                        ? "comment"
                        : "comments"}
                    </span>
                  </div>

                  {/* Add comment */}
                  <form
                    onSubmit={handleCommentSubmit}
                    className="mt-7"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        value={commentName}
                        onChange={(event) =>
                          setCommentName(
                            event.target.value
                          )
                        }
                        placeholder="Your name"
                        maxLength={100}
                        className="rounded-2xl border border-white/10 bg-[#151515] px-5 py-4 text-white outline-none transition placeholder:text-gray-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                      />

                      <div className="hidden sm:block" />
                    </div>

                    <textarea
                      value={commentText}
                      onChange={(event) =>
                        setCommentText(
                          event.target.value
                        )
                      }
                      placeholder="Write a comment..."
                      maxLength={500}
                      rows={4}
                      className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-[#151515] px-5 py-4 text-white outline-none transition placeholder:text-gray-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                    />

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-700">
                        Maximum 500 characters
                      </p>

                      <button
                        type="submit"
                        disabled={commentSubmitting}
                        className="rounded-xl bg-red-600 px-6 py-3 font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {commentSubmitting
                          ? "Posting..."
                          : "Post Comment"}
                      </button>
                    </div>
                  </form>

                  {commentSuccess && (
                    <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                      {commentSuccess}
                    </div>
                  )}

                  {commentError && (
                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                      {commentError}
                    </div>
                  )}

                  {/* Existing comments */}
                  <div className="mt-8 border-t border-white/10 pt-7">
                    <h3 className="text-lg font-bold">
                      Recent Comments
                    </h3>

                    {commentsLoading && (
                      <div className="mt-5 flex items-center gap-3 text-sm text-gray-500">
                        <div className="h-4 w-4 animate-spin rounded-full border border-white/10 border-t-red-500" />
                        Loading comments...
                      </div>
                    )}

                    {!commentsLoading &&
                      comments.length === 0 && (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-[#151515] p-7 text-center">
                          <div className="text-3xl">
                            💬
                          </div>

                          <p className="mt-3 text-sm text-gray-500">
                            No comments yet.
                          </p>

                          <p className="mt-1 text-xs text-gray-700">
                            Be the first person to share
                            your thoughts.
                          </p>
                        </div>
                      )}

                    {!commentsLoading &&
                      comments.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {comments.map((item) => (
                            <div
                              key={item.commentId}
                              className="rounded-2xl border border-white/10 bg-[#151515] p-5"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-semibold text-gray-200">
                                  {item.userName}
                                </p>

                                <p className="text-xs text-gray-700">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>

                              <p className="mt-3 leading-7 text-gray-400">
                                {item.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </section>

                {/* Ratings */}
                <section className="mt-8 rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
                        Feedback
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        Rate This Video
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Choose from one to five stars.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#151515] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black">
                          {averageRating.toFixed(1)}
                        </span>

                        <div>
                          <div className="text-lg tracking-widest text-yellow-400">
                            ★★★★★
                          </div>

                          <p className="text-xs text-gray-600">
                            {totalRatings} total
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating form */}
                  <form
                    onSubmit={handleRatingSubmit}
                    className="mt-7"
                  >
                    <input
                      type="text"
                      value={ratingName}
                      onChange={(event) =>
                        setRatingName(
                          event.target.value
                        )
                      }
                      placeholder="Your name"
                      maxLength={100}
                      className="w-full rounded-2xl border border-white/10 bg-[#151515] px-5 py-4 text-white outline-none transition placeholder:text-gray-700 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                    />

                    <div className="mt-6">
                      <p className="mb-3 text-sm font-medium text-gray-400">
                        Select your rating
                      </p>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setSelectedRating(
                                  star
                                )
                              }
                              className={`text-4xl transition-transform hover:scale-110 ${
                                star <=
                                selectedRating
                                  ? "text-yellow-400"
                                  : "text-gray-700 hover:text-yellow-300"
                              }`}
                              aria-label={`Rate ${star} out of 5`}
                            >
                              ★
                            </button>
                          )
                        )}
                      </div>

                      {selectedRating > 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          You selected{" "}
                          {selectedRating} out of 5
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={ratingSubmitting}
                      className="mt-6 rounded-xl bg-red-600 px-6 py-3 font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ratingSubmitting
                        ? "Submitting..."
                        : "Submit Rating"}
                    </button>
                  </form>

                  {ratingSuccess && (
                    <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                      {ratingSuccess}
                    </div>
                  )}

                  {ratingError && (
                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                      {ratingError}
                    </div>
                  )}

                  {/* Existing ratings */}
                  <div className="mt-8 border-t border-white/10 pt-7">
                    <h3 className="text-lg font-bold">
                      Recent Ratings
                    </h3>

                    {ratingsLoading && (
                      <div className="mt-5 flex items-center gap-3 text-sm text-gray-500">
                        <div className="h-4 w-4 animate-spin rounded-full border border-white/10 border-t-red-500" />
                        Loading ratings...
                      </div>
                    )}

                    {!ratingsLoading &&
                      ratings.length === 0 && (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-[#151515] p-7 text-center">
                          <div className="text-3xl">
                            ★
                          </div>

                          <p className="mt-3 text-sm text-gray-500">
                            No ratings yet.
                          </p>

                          <p className="mt-1 text-xs text-gray-700">
                            Be the first to rate this
                            video.
                          </p>
                        </div>
                      )}

                    {!ratingsLoading &&
                      ratings.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {ratings.map((item) => (
                            <div
                              key={item.ratingId}
                              className="rounded-2xl border border-white/10 bg-[#151515] p-5"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-semibold text-gray-200">
                                  {item.userName}
                                </p>

                                <p className="text-xs text-gray-700">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>

                              <div className="mt-3 text-xl tracking-widest">
                                <span className="text-yellow-400">
                                  {"★".repeat(
                                    Number(
                                      item.rating
                                    )
                                  )}
                                </span>

                                <span className="text-gray-700">
                                  {"★".repeat(
                                    5 -
                                      Number(
                                        item.rating
                                      )
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </section>

                {/* Bottom navigation */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row">
                  <Link
                    href="/latest"
                    className="text-sm font-medium text-gray-500 transition hover:text-white"
                  >
                    ← Continue browsing videos
                  </Link>

                  <Link
                    href="/"
                    className="text-sm font-medium text-gray-600 transition hover:text-red-400"
                  >
                    MediaNest
                  </Link>
                </div>
              </>
            )}
        </div>
      </main>
    </>
  );
}