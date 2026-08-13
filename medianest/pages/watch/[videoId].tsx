import { useRouter } from "next/router";
import { useEffect, useState, FormEvent } from "react";
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

  const { videoId } = router.query;

  const [video, setVideo] =
    useState<Video | null>(null);

  const [videoUrl, setVideoUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [videoLoading, setVideoLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [videoError, setVideoError] =
    useState("");

  // Comments
  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [commentName, setCommentName] =
    useState("");

  const [commentText, setCommentText] =
    useState("");

  const [commentSubmitting, setCommentSubmitting] =
    useState(false);

  const [commentError, setCommentError] =
    useState("");

  const [commentSuccess, setCommentSuccess] =
    useState("");

  // Ratings
  const [ratings, setRatings] =
    useState<Rating[]>([]);

  const [averageRating, setAverageRating] =
    useState(0);

  const [totalRatings, setTotalRatings] =
    useState(0);

  const [ratingName, setRatingName] =
    useState("");

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [ratingsLoading, setRatingsLoading] =
    useState(false);

  const [ratingSubmitting, setRatingSubmitting] =
    useState(false);

  const [ratingError, setRatingError] =
    useState("");

  const [ratingSuccess, setRatingSuccess] =
    useState("");

  // Load video
  useEffect(() => {
    if (
      !router.isReady ||
      typeof videoId !== "string"
    ) {
      return;
    }

    async function loadVideo() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/videos/${videoId}`
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

        // Generate a temporary read-only
        // SAS URL for browser playback.
        const sasResponse = await fetch(
          `/api/videos/${videoId}/sas`
        );

        const sasData =
          await sasResponse.json();

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
    if (
      !router.isReady ||
      typeof videoId !== "string"
    ) {
      return;
    }

    async function loadComments() {
      try {
        setCommentsLoading(true);
        setCommentError("");

        const response = await fetch(
          `/api/comments?videoId=${encodeURIComponent(
            videoId
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
        console.error(
          "Load comments error:",
          error
        );

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
    if (
      !router.isReady ||
      typeof videoId !== "string"
    ) {
      return;
    }

    async function loadRatings() {
      try {
        setRatingsLoading(true);
        setRatingError("");

        const response = await fetch(
          `/api/ratings?videoId=${encodeURIComponent(
            videoId
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
        console.error(
          "Load ratings error:",
          error
        );

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

    if (
      typeof videoId !== "string" ||
      !videoId
    ) {
      return;
    }

    setCommentError("");
    setCommentSuccess("");

    if (!commentName.trim()) {
      setCommentError(
        "Please enter your name."
      );
      return;
    }

    if (!commentText.trim()) {
      setCommentError(
        "Please enter a comment."
      );
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await fetch(
        "/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
            userName: commentName.trim(),
            comment: commentText.trim(),
          }),
        }
      );

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

    if (
      typeof videoId !== "string" ||
      !videoId
    ) {
      return;
    }

    setRatingError("");
    setRatingSuccess("");

    if (!ratingName.trim()) {
      setRatingError(
        "Please enter your name."
      );
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

      const response = await fetch(
        "/api/ratings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
            userName: ratingName.trim(),
            rating: selectedRating,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to submit rating."
        );
      }

      const newRating: Rating =
        data.rating;

      setRatings((currentRatings) => [
        newRating,
        ...currentRatings,
      ]);

      const newTotal =
        totalRatings + 1;

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

      <main className="min-h-screen bg-[#070b14] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">

          {/* Back */}
          <a
            href="/latest"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Latest Videos
          </a>

          {/* Loading */}
          {loading && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-gray-400">
              Loading video...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
              {error}
            </div>
          )}

          {/* Video */}
          {!loading &&
            !error &&
            video && (
              <div className="mt-8">

                {/* Player */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">

                  {videoLoading &&
                    !videoError && (
                      <div className="flex h-[400px] items-center justify-center text-gray-400">
                        Loading video player...
                      </div>
                    )}

                  {videoError && (
                    <div className="flex h-[400px] items-center justify-center p-6 text-center text-red-300">
                      {videoError}
                    </div>
                  )}

                  {videoUrl &&
                    !videoError && (
                      <video
                        key={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className={`max-h-[70vh] w-full ${
                          videoLoading
                            ? "hidden"
                            : "block"
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

                {/* Title */}
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div>
                    <h1 className="text-3xl font-bold">
                      {video.title}
                    </h1>

                    <p className="mt-2 text-sm text-gray-400">
                      Uploaded{" "}
                      {new Date(
                        video.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span className="w-fit rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
                    Age Rating:{" "}
                    {video.ageRating}
                  </span>

                </div>

                {/* Metadata */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

                  <h2 className="mb-5 text-xl font-semibold">
                    Video Information
                  </h2>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>
                      <p className="text-sm text-gray-500">
                        Publisher
                      </p>

                      <p className="mt-1 text-gray-200">
                        {video.publisher}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Producer
                      </p>

                      <p className="mt-1 text-gray-200">
                        {video.producer}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Genre
                      </p>

                      <p className="mt-1 text-gray-200">
                        {video.genre}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Age Rating
                      </p>

                      <p className="mt-1 text-gray-200">
                        {video.ageRating}
                      </p>
                    </div>

                  </div>

                  {video.description && (
                    <div className="mt-6 border-t border-white/10 pt-5">

                      <p className="text-sm text-gray-500">
                        Description
                      </p>

                      <p className="mt-2 leading-7 text-gray-300">
                        {video.description}
                      </p>

                    </div>
                  )}

                </div>

                {/* Comments */}
                <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        Comments
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Share your thoughts about this video.
                      </p>
                    </div>

                    <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
                      {comments.length}{" "}
                      {comments.length === 1
                        ? "comment"
                        : "comments"}
                    </span>
                  </div>

                  {/* Add Comment */}
                  <form
                    onSubmit={handleCommentSubmit}
                    className="mt-6"
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
                        className="rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                      />

                      <div />

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
                      className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                    />

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <p className="text-xs text-gray-600">
                        Maximum 500 characters
                      </p>

                      <button
                        type="submit"
                        disabled={commentSubmitting}
                        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {commentSubmitting
                          ? "Posting..."
                          : "Post Comment"}
                      </button>

                    </div>

                  </form>

                  {/* Comment Success */}
                  {commentSuccess && (
                    <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                      {commentSuccess}
                    </div>
                  )}

                  {/* Comment Error */}
                  {commentError && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                      {commentError}
                    </div>
                  )}

                  {/* Existing Comments */}
                  <div className="mt-8 border-t border-white/10 pt-6">

                    <h3 className="mb-5 text-lg font-semibold">
                      Recent Comments
                    </h3>

                    {commentsLoading && (
                      <p className="text-gray-500">
                        Loading comments...
                      </p>
                    )}

                    {!commentsLoading &&
                      comments.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0d121c] p-6 text-center text-gray-500">
                          No comments yet. Be the first to comment.
                        </div>
                      )}

                    {!commentsLoading &&
                      comments.length > 0 && (
                        <div className="space-y-4">

                          {comments.map((item) => (
                            <div
                              key={item.commentId}
                              className="rounded-xl border border-white/10 bg-[#0d121c] p-5"
                            >

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                <p className="font-semibold text-gray-200">
                                  {item.userName}
                                </p>

                                <p className="text-xs text-gray-600">
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
                <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h2 className="text-2xl font-semibold">
                        Rate This Video
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Share your rating for this video.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">

                      <div className="flex items-center gap-2">

                        <span className="text-3xl font-bold text-yellow-400">
                          {averageRating.toFixed(1)}
                        </span>

                        <span className="text-yellow-400">
                          ★
                        </span>

                      </div>

                      <p className="text-sm text-gray-500">
                        {totalRatings}{" "}
                        {totalRatings === 1
                          ? "rating"
                          : "ratings"}
                      </p>

                    </div>

                  </div>

                  {/* Rating Form */}
                  <form
                    onSubmit={handleRatingSubmit}
                    className="mt-6"
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
                      className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
                    />

                    <div className="mt-5">

                      <p className="mb-3 text-sm text-gray-400">
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
                              className={`text-4xl transition ${
                                star <=
                                selectedRating
                                  ? "text-yellow-400"
                                  : "text-gray-600 hover:text-yellow-300"
                              }`}
                              aria-label={`Rate ${star} out of 5`}
                            >
                              ★
                            </button>
                          )
                        )}

                      </div>

                      {selectedRating > 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                          You selected{" "}
                          {selectedRating} out of 5
                        </p>
                      )}

                    </div>

                    <button
                      type="submit"
                      disabled={ratingSubmitting}
                      className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ratingSubmitting
                        ? "Submitting..."
                        : "Submit Rating"}
                    </button>

                  </form>

                  {/* Rating Success */}
                  {ratingSuccess && (
                    <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                      {ratingSuccess}
                    </div>
                  )}

                  {/* Rating Error */}
                  {ratingError && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                      {ratingError}
                    </div>
                  )}

                  {/* Existing Ratings */}
                  <div className="mt-8 border-t border-white/10 pt-6">

                    <h3 className="mb-5 text-lg font-semibold">
                      Recent Ratings
                    </h3>

                    {ratingsLoading && (
                      <p className="text-gray-500">
                        Loading ratings...
                      </p>
                    )}

                    {!ratingsLoading &&
                      ratings.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#0d121c] p-6 text-center text-gray-500">
                          No ratings yet. Be the first to rate this video.
                        </div>
                      )}

                    {!ratingsLoading &&
                      ratings.length > 0 && (
                        <div className="space-y-4">

                          {ratings.map((item) => (
                            <div
                              key={item.ratingId}
                              className="rounded-xl border border-white/10 bg-[#0d121c] p-5"
                            >

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                <p className="font-semibold text-gray-200">
                                  {item.userName}
                                </p>

                                <p className="text-xs text-gray-600">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleString()}
                                </p>

                              </div>

                              <div className="mt-3 text-xl text-yellow-400">

                                {"★".repeat(
                                  Number(item.rating)
                                )}

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

              </div>
            )}

        </div>
      </main>
    </>
  );
}