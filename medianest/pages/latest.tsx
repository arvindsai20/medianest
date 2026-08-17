import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Head from "next/head";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

type Video = {
  videoId: string;
  creatorName?: string;
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

type PanelType = "comments" | "ratings" | null;

export default function LatestVideos() {
  const { data: session, status: sessionStatus } = useSession();

  const [videos, setVideos] = useState<Video[]>([]);
  const [videoUrls, setVideoUrls] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [isMuted, setIsMuted] =
    useState(false);

  const [likeCount, setLikeCount] =
    useState(0);

  const [isLiked, setIsLiked] =
    useState(false);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const videoRefs = useRef<
    Array<HTMLVideoElement | null>
  >([]);

  const slideLock = useRef(false);

  // Interaction panel
  const [panel, setPanel] =
    useState<PanelType>(null);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [averageRating, setAverageRating] =
    useState(0);

  const [totalRatings, setTotalRatings] =
    useState(0);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [ratingsLoading, setRatingsLoading] =
    useState(false);

  const [interactionLoading, setInteractionLoading] =
    useState(false);

  const [interactionError, setInteractionError] =
    useState("");

  const [name, setName] =
    useState("");

  const [commentText, setCommentText] =
    useState("");

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [commentSubmitting, setCommentSubmitting] =
    useState(false);

  const [ratingSubmitting, setRatingSubmitting] =
    useState(false);

  const [commentSuccess, setCommentSuccess] =
    useState("");

  const [ratingSuccess, setRatingSuccess] =
    useState("");

  /*
   * Prevent the browser/page from scrolling while
   * the reel viewer is open.
   */
  useEffect(() => {
    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, []);

  /*
   * Load videos.
   */
  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/videos"
        );

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

  /*
   * Generate secure SAS URLs for videos.
   *
   * The Azure Blob container is private, so the
   * browser should not use blobUrl directly.
   */
  useEffect(() => {
    if (videos.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadVideoUrls() {
      const results: Record<
        string,
        string
      > = {};

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
              `Failed to get video URL for ${video.videoId}:`,
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

  /*
   * Play only the active reel.
   */
  useEffect(() => {
    if (videos.length === 0) {
      return;
    }

    const currentVideo =
      videoRefs.current[activeIndex];

    if (!currentVideo) {
      return;
    }

    // Pause every other video.
    videoRefs.current.forEach(
      (video, index) => {
        if (
          video &&
          index !== activeIndex
        ) {
          video.pause();
          video.currentTime = 0;
        }
      }
    );

    currentVideo.currentTime = 0;

    /*
     * First try to play with sound.
     *
     * Modern browsers may reject audible
     * autoplay. If that happens, we fall back
     * to muted playback so the reel still starts.
     */
    currentVideo.muted = isMuted;

    const playVideo = async () => {
      try {
        await currentVideo.play();
      } catch (error) {
        console.warn(
          "Audible autoplay was blocked by the browser. Starting muted.",
          error
        );

        currentVideo.muted = true;

        try {
          await currentVideo.play();
        } catch (fallbackError) {
          console.error(
            "Video autoplay failed:",
            fallbackError
          );
        }
      }
    };

    const timer = window.setTimeout(
      playVideo,
      150
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeIndex,
    videos,
    videoUrls,
    isMuted,
  ]);

  /*
   * When the user changes the sound setting,
   * update the active video immediately.
   */
  useEffect(() => {
    const currentVideo =
      videoRefs.current[activeIndex];

    if (!currentVideo) {
      return;
    }

    currentVideo.muted = isMuted;

    if (!currentVideo.paused) {
      currentVideo.play().catch(() => {
        // Browser may reject sound activation.
      });
    }
  }, [isMuted, activeIndex]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (panel) {
        if (event.key === "Escape") {
          setPanel(null);
        }

        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        goNext();
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === " ") {
        event.preventDefault();

        const video =
          videoRefs.current[
            activeIndex
          ];

        if (!video) {
          return;
        }

        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [activeIndex, panel, videos.length]);

  /*
   * Move to the next reel.
   */
  function goNext() {
    if (
      slideLock.current ||
      videos.length === 0
    ) {
      return;
    }

    if (
      activeIndex >=
      videos.length - 1
    ) {
      return;
    }

    slideLock.current = true;

    setActiveIndex(
      (current) => current + 1
    );

    window.setTimeout(() => {
      slideLock.current = false;
    }, 500);
  }

  /*
   * Move to the previous reel.
   */
  function goPrevious() {
    if (
      slideLock.current ||
      videos.length === 0
    ) {
      return;
    }

    if (activeIndex <= 0) {
      return;
    }

    slideLock.current = true;

    setActiveIndex(
      (current) => current - 1
    );

    window.setTimeout(() => {
      slideLock.current = false;
    }, 500);
  }

  /*
   * Mouse wheel changes the reel.
   * It does NOT scroll the page.
   */
  function handleWheel(
    event: React.WheelEvent
  ) {
    if (panel) {
      return;
    }

    if (
      Math.abs(event.deltaY) < 15
    ) {
      return;
    }

    if (event.deltaY > 0) {
      goNext();
    } else {
      goPrevious();
    }
  }

  /*
   * Touch swipe navigation.
   */
  const touchStartY =
    useRef<number | null>(null);

  function handleTouchStart(
    event: React.TouchEvent
  ) {
    touchStartY.current =
      event.touches[0].clientY;
  }

  function handleTouchEnd(
    event: React.TouchEvent
  ) {
    if (
      touchStartY.current === null
    ) {
      return;
    }

    const endY =
      event.changedTouches[0].clientY;

    const difference =
      touchStartY.current - endY;

    touchStartY.current = null;

    if (Math.abs(difference) < 50) {
      return;
    }

    if (difference > 0) {
      goNext();
    } else {
      goPrevious();
    }
  }

  /*
   * Load comments and ratings for the
   * currently selected reel.
   */
  async function loadInteractions(
    videoId: string
  ) {
    try {
      setInteractionLoading(true);
      setInteractionError("");

      setCommentsLoading(true);
      setRatingsLoading(true);

      const [
        commentsResponse,
        ratingsResponse,
      ] = await Promise.all([
        fetch(
          `/api/comments?videoId=${encodeURIComponent(
            videoId
          )}`
        ),
        fetch(
          `/api/ratings?videoId=${encodeURIComponent(
            videoId
          )}`
        ),
      ]);

      const commentsData =
        await commentsResponse.json();

      const ratingsData =
        await ratingsResponse.json();

      if (
        !commentsResponse.ok ||
        !commentsData.success
      ) {
        throw new Error(
          commentsData.message ||
            "Failed to load comments."
        );
      }

      if (
        !ratingsResponse.ok ||
        !ratingsData.success
      ) {
        throw new Error(
          ratingsData.message ||
            "Failed to load ratings."
        );
      }

      setComments(
        commentsData.comments || []
      );

      setAverageRating(
        Number(
          ratingsData.averageRating || 0
        )
      );

      setTotalRatings(
        Number(
          ratingsData.totalRatings || 0
        )
      );
    } catch (error) {
      console.error(
        "Interaction loading error:",
        error
      );

      setInteractionError(
        error instanceof Error
          ? error.message
          : "Failed to load comments and ratings."
      );
    } finally {
      setCommentsLoading(false);
      setRatingsLoading(false);
      setInteractionLoading(false);
    }
  }

  /*
   * Open comments.
   */
  function openComments() {
    const video =
      videos[activeIndex];

    if (!video) {
      return;
    }

    setPanel("comments");
    setCommentSuccess("");
    setRatingSuccess("");
    loadInteractions(
      video.videoId
    );
  }

  /*
   * Open ratings.
   */
  function openRatings() {
    const video =
      videos[activeIndex];

    if (!video) {
      return;
    }

    setPanel("ratings");
    setCommentSuccess("");
    setRatingSuccess("");
    loadInteractions(
      video.videoId
    );
  }

  /*
   * Submit comment.
   */
  async function handleCommentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const video =
      videos[activeIndex];

    if (!video) {
      return;
    }

    setInteractionError("");
    setCommentSuccess("");

    if (!name.trim()) {
      setInteractionError(
        "Please enter your name."
      );
      return;
    }

    if (!commentText.trim()) {
      setInteractionError(
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
            videoId: video.videoId,
            userName: name.trim(),
            comment:
              commentText.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to add comment."
        );
      }

      setComments(
        (currentComments) => [
          data.comment,
          ...currentComments,
        ]
      );

      setCommentText("");

      setCommentSuccess(
        "Comment added successfully."
      );
    } catch (error) {
      console.error(
        "Comment submit error:",
        error
      );

      setInteractionError(
        error instanceof Error
          ? error.message
          : "Failed to add comment."
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  /*
   * Submit rating.
   */
  async function handleRatingSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const video =
      videos[activeIndex];

    if (!video) {
      return;
    }

    setInteractionError("");
    setRatingSuccess("");

    if (!name.trim()) {
      setInteractionError(
        "Please enter your name."
      );
      return;
    }

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setInteractionError(
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
            videoId: video.videoId,
            userName: name.trim(),
            rating: selectedRating,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to submit rating."
        );
      }

      const newRating: Rating =
        data.rating;

      setTotalRatings(
        (current) => current + 1
      );

      setAverageRating(
        (currentAverage) => {
          const oldTotal =
            totalRatings;

          const newTotal =
            oldTotal + 1;

          return Math.round(
            (
              currentAverage *
                oldTotal +
              selectedRating
            ) /
              newTotal *
              10
          ) / 10;
        }
      );

      setSelectedRating(0);

      setRatingSuccess(
        "Rating submitted successfully."
      );

      setRatingsLoading(false);

      // Reload the rating data to guarantee
      // the displayed average is correct.
      await loadInteractions(
        video.videoId
      );
    } catch (error) {
      console.error(
        "Rating submit error:",
        error
      );

      setInteractionError(
        error instanceof Error
          ? error.message
          : "Failed to submit rating."
      );
    } finally {
      setRatingSubmitting(false);
    }
  }

  /*
   * Toggle video play/pause.
   */
  function togglePlay() {
    const video =
      videoRefs.current[
        activeIndex
      ];

    if (!video) {
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  /*
   * Toggle sound.
   */
  function toggleSound() {
    setIsMuted(
      (current) => !current
    );
  }

  /*
   * Load like status and count for the active video.
   */
  useEffect(() => {
    const video = videos[activeIndex];

    if (!video) {
      setLikeCount(0);
      setIsLiked(false);
      return;
    }

    let cancelled = false;

    async function loadLikes() {
      try {
        const response = await fetch(
          `/api/likes?videoId=${encodeURIComponent(
            video.videoId
          )}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load likes."
          );
        }

        if (!cancelled) {
          setLikeCount(Number(data.totalLikes || 0));
          setIsLiked(Boolean(data.liked));
        }
      } catch (error) {
        console.error("Like loading error:", error);
        if (!cancelled) {
          setLikeCount(0);
          setIsLiked(false);
        }
      }
    }

    loadLikes();

    return () => {
      cancelled = true;
    };
  }, [activeIndex, videos]);

  /*
   * Like or unlike the active video.
   */
  async function toggleLike() {
    const video = videos[activeIndex];

    if (!video || likeLoading) {
      return;
    }

    const wasLiked = isLiked;

    try {
      setLikeLoading(true);

      const response = await fetch(
        `/api/likes?videoId=${encodeURIComponent(
          video.videoId
        )}`,
        {
          method: wasLiked ? "DELETE" : "POST",
          headers: wasLiked
            ? undefined
            : { "Content-Type": "application/json" },
          body: wasLiked
            ? undefined
            : JSON.stringify({ videoId: video.videoId }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(
          "/latest"
        )}`;
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update like.");
      }

      setIsLiked(Boolean(data.liked));
      setLikeCount((current) =>
        wasLiked ? Math.max(0, current - 1) : current + 1
      );
    } catch (error) {
      console.error("Like update error:", error);
    } finally {
      setLikeLoading(false);
    }
  }

  const activeVideo =
    videos[activeIndex];

  return (
    <>
      <Head>
        <title>
          Latest Videos | MediaNest
        </title>
      </Head>

      <main
        className="h-screen overflow-hidden bg-black text-white"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <header className="fixed left-0 right-0 top-0 z-50 h-[76px] border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              href="/"
              className="shrink-0 text-2xl font-black tracking-tight sm:text-3xl"
            >
              <span className="text-white">
                Media
              </span>
              <span className="text-red-500">
                Nest
              </span>
            </Link>

            {/* Search */}
            <Link
              href="/search"
              aria-label="Search MediaNest"
              className="group mx-auto flex h-11 min-w-0 flex-1 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-left shadow-inner transition hover:border-white/30 hover:bg-white/10 sm:max-w-[520px]"
            >
              <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300 transition group-hover:bg-white/15 group-hover:text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 5 5" />
                </svg>
              </span>

              <span className="truncate text-sm text-slate-400 group-hover:text-slate-300">
                Search videos, creators, genres...
              </span>

              <span className="ml-auto hidden rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-slate-500 sm:block">
                Search
              </span>
            </Link>

            {/* Authentication */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {sessionStatus !== "loading" &&
                !session && (
                  <>
                    <Link
                      href="/login?role=creator"
                      className="hidden rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-red-500/60 hover:bg-red-500/10 sm:block sm:px-5"
                    >
                      Creator Login
                    </Link>

                    <Link
                      href="/register"
                      className="rounded-full bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 sm:px-5"
                    >
                      Register
                    </Link>
                  </>
                )}

              {sessionStatus !== "loading" &&
                session && (
                  <>
                    {session.user?.role ===
                      "CREATOR" && (
                      <Link
                        href="/creator"
                        className="hidden rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-red-500/60 hover:bg-red-500/10 sm:block sm:px-5"
                      >
                        Creator Dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        signOut({
                          callbackUrl: "/",
                        })
                      }
                      className="rounded-full bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 sm:px-5"
                    >
                      Sign Out
                    </button>
                  </>
                )}
            </div>
          </div>
        </header>

        {/* Main reel viewer */}
        <section className="relative h-screen overflow-hidden pt-[76px]">
          {loading && (
            <div className="flex h-full items-center justify-center text-gray-400">
              Loading videos...
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full items-center justify-center px-6">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-300">
                {error}
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            videos.length === 0 && (
              <div className="flex h-full items-center justify-center text-gray-400">
                No videos have been uploaded yet.
              </div>
            )}

          {!loading &&
            !error &&
            videos.length > 0 && (
              <>
                {/* Sliding reel track */}
                <div
                  className="h-full w-full transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateY(-${
                      activeIndex * 100
                    }%)`,
                  }}
                >
                  {videos.map(
                    (video, index) => {
                      const videoUrl =
                        videoUrls[
                          video.videoId
                        ];

                      const initials =
                        (
                          video.creatorName ||
                          video.publisher ||
                          "MN"
                        )
                          .trim()
                          .slice(0, 2)
                          .toUpperCase();

                      return (
                        <div
                          key={
                            video.videoId
                          }
                          className="relative flex h-full w-full items-center justify-center px-3 py-3 md:px-8"
                        >
                          {/* Reel card */}
                          <article className="relative h-full max-h-[900px] w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/15 bg-[#090909] shadow-2xl">
                            {/* Video */}
                            <div
                              className="absolute inset-0 cursor-pointer bg-black"
                              onClick={
                                index ===
                                activeIndex
                                  ? togglePlay
                                  : undefined
                              }
                            >
                              {videoUrl ? (
                                <video
                                  ref={(
                                    element
                                  ) => {
                                    videoRefs.current[
                                      index
                                    ] =
                                      element;
                                  }}
                                  src={
                                    videoUrl
                                  }
                                  className="h-full w-full object-contain"
                                  playsInline
                                  loop
                                  preload={
                                    index ===
                                    activeIndex
                                      ? "auto"
                                      : "metadata"
                                  }
                                  muted={
                                    index ===
                                    activeIndex
                                      ? isMuted
                                      : true
                                  }
                                  onEnded={() => {
                                    if (
                                      index ===
                                      activeIndex
                                    ) {
                                      goNext();
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-500">
                                  Loading video...
                                </div>
                              )}
                            </div>

                            {/* Dark bottom gradient */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/60 to-transparent" />

                            {/* Top reel number */}
                            <div className="absolute right-5 top-5 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                              {index + 1} /{" "}
                              {videos.length}
                            </div>

                            {/* Right controls */}
                            {index ===
                              activeIndex && (
                              <div className="absolute bottom-44 right-5 z-20 flex flex-col items-center gap-4">
                                {/* Like */}
                                <button
                                  type="button"
                                  onClick={toggleLike}
                                  disabled={likeLoading}
                                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-2xl backdrop-blur-md transition hover:scale-105 hover:bg-black/80 disabled:cursor-wait disabled:opacity-70 ${
                                    isLiked ? "text-red-500" : "text-white"
                                  }`}
                                  aria-label={isLiked ? "Unlike video" : "Like video"}
                                  title={isLiked ? "Unlike video" : "Like video"}
                                >
                                  {isLiked ? "♥" : "♡"}
                                  {likeCount > 0 && (
                                    <span className="absolute -right-2 -bottom-2 min-w-5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">
                                      {likeCount}
                                    </span>
                                  )}
                                </button>

                                {/* Comments */}
                                <button
                                  type="button"
                                  onClick={openComments}
                                  className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/80"
                                  aria-label="Comments"
                                >
                                  💬
                                  {comments.length > 0 && (
                                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-white px-1 text-[10px] font-bold text-black">
                                      {comments.length}
                                    </span>
                                  )}
                                </button>

                                {/* Sound */}
                                <button
                                  type="button"
                                  onClick={toggleSound}
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/80"
                                  aria-label={isMuted ? "Turn sound on" : "Mute video"}
                                >
                                  {isMuted ? "🔇" : "🔊"}
                                </button>

                                {/* Rating */}
                                <button
                                  type="button"
                                  onClick={openRatings}
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-xl backdrop-blur-md transition hover:scale-105 hover:bg-black/80"
                                  aria-label="Rate video"
                                >
                                  ⭐
                                </button>
                              </div>
                            )}

                            {/* Video information */}
                            <div className="absolute bottom-5 left-5 right-20 z-10">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-bold">
                                  {initials}
                                </div>

                                <div>
                                  <p className="font-semibold">
                                    {video.creatorName ||
                                      video.publisher}
                                  </p>

                                  <p className="text-sm text-gray-300">
                                    {video.publisher}
                                  </p>
                                </div>
                              </div>

                              <h2 className="text-3xl font-bold leading-tight">
                                {video.title}
                              </h2>

                              {video.description && (
                                <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                                  {
                                    video.description
                                  }
                                </p>
                              )}

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
                                  {video.genre}
                                </span>

                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
                                  {video.ageRating}
                                </span>

                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
                                  {new Date(
                                    video.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="mt-4">
                                <Link
                                  href={`/watch/${video.videoId}`}
                                  className="inline-block rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-105"
                                >
                                  View details
                                </Link>
                              </div>
                            </div>
                          </article>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Previous button */}
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={
                    activeIndex === 0
                  }
                  className="absolute left-1/2 top-[92px] z-30 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xl backdrop-blur-md transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label="Previous reel"
                >
                  ↑
                </button>

                {/* Next button */}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={
                    activeIndex ===
                    videos.length - 1
                  }
                  className="absolute bottom-5 left-1/2 z-30 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xl backdrop-blur-md transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label="Next reel"
                >
                  ↓
                </button>

                {/* Slide indicators */}
                <div className="absolute bottom-6 left-6 z-30 hidden max-h-[70vh] flex-col gap-2 overflow-hidden lg:flex">
                  {videos.map(
                    (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            index
                          )
                        }
                        className={`h-1.5 rounded-full transition-all ${
                          index ===
                          activeIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/30"
                        }`}
                        aria-label={`Go to reel ${
                          index + 1
                        }`}
                      />
                    )
                  )}
                </div>
              </>
            )}
        </section>

        {/* Interaction panel */}
        {panel && activeVideo && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center md:justify-end md:p-6">
            {/* Close backdrop */}
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() =>
                setPanel(null)
              }
              aria-label="Close panel"
            />

            {/* Panel */}
            <aside className="relative z-10 flex h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#101010] shadow-2xl md:h-[calc(100vh-48px)] md:rounded-3xl">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {panel === "comments"
                      ? "Comments"
                      : "Ratings"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    {activeVideo.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPanel(null)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg hover:bg-white/20"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                {interactionError && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {interactionError}
                  </div>
                )}

                {panel ===
                  "comments" && (
                  <>
                    <form
                      onSubmit={
                        handleCommentSubmit
                      }
                      className="mb-6 space-y-3"
                    >
                      <input
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target
                              .value
                          )
                        }
                        placeholder="Your name"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/30"
                      />

                      <textarea
                        value={
                          commentText
                        }
                        onChange={(event) =>
                          setCommentText(
                            event.target
                              .value
                          )
                        }
                        placeholder="Write a comment..."
                        rows={3}
                        maxLength={500}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/30"
                      />

                      <button
                        type="submit"
                        disabled={
                          commentSubmitting
                        }
                        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
                      >
                        {commentSubmitting
                          ? "Posting..."
                          : "Post comment"}
                      </button>
                    </form>

                    {commentSuccess && (
                      <div className="mb-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-300">
                        {commentSuccess}
                      </div>
                    )}

                    {commentsLoading ? (
                      <div className="py-10 text-center text-gray-500">
                        Loading comments...
                      </div>
                    ) : comments.length ===
                      0 ? (
                      <div className="py-10 text-center text-gray-500">
                        No comments yet.
                        <br />
                        Be the first to comment.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map(
                          (item) => (
                            <div
                              key={
                                item.commentId
                              }
                              className="rounded-2xl bg-white/5 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">
                                  {
                                    item.userName
                                  }
                                </p>

                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                                {
                                  item.comment
                                }
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}

                {panel ===
                  "ratings" && (
                  <>
                    {/* Rating summary */}
                    <div className="mb-6 rounded-2xl bg-white/5 p-5 text-center">
                      <div className="text-4xl font-bold">
                        {averageRating.toFixed(
                          1
                        )}
                      </div>

                      <div className="mt-2 text-xl">
                        {"★".repeat(
                          Math.round(
                            averageRating
                          )
                        )}
                        <span className="text-white/20">
                          {"★".repeat(
                            Math.max(
                              0,
                              5 -
                                Math.round(
                                  averageRating
                                )
                            )
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-400">
                        {totalRatings}{" "}
                        {totalRatings ===
                        1
                          ? "rating"
                          : "ratings"}
                      </p>
                    </div>

                    <form
                      onSubmit={
                        handleRatingSubmit
                      }
                      className="space-y-4"
                    >
                      <input
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target
                              .value
                          )
                        }
                        placeholder="Your name"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/30"
                      />

                      <div>
                        <p className="mb-3 text-sm text-gray-400">
                          Select your rating
                        </p>

                        <div className="flex justify-center gap-2">
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
                                className={`text-4xl transition hover:scale-110 ${
                                  star <=
                                  selectedRating
                                    ? "text-yellow-400"
                                    : "text-white/20"
                                }`}
                                aria-label={`${star} star rating`}
                              >
                                ★
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          ratingSubmitting
                        }
                        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
                      >
                        {ratingSubmitting
                          ? "Submitting..."
                          : "Submit rating"}
                      </button>
                    </form>

                    {ratingSuccess && (
                      <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-300">
                        {ratingSuccess}
                      </div>
                    )}

                    <div className="mt-8 border-t border-white/10 pt-5">
                      <h4 className="mb-4 font-semibold">
                        Recent ratings
                      </h4>

                      {ratingsLoading ||
                      interactionLoading ? (
                        <p className="text-sm text-gray-500">
                          Loading ratings...
                        </p>
                      ) : totalRatings ===
                        0 ? (
                        <p className="text-sm text-gray-500">
                          No ratings yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-xl bg-white/5 p-4">
                            <p className="text-sm text-gray-400">
                              Average rating
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                              {averageRating.toFixed(
                                1
                              )}{" "}
                              / 5
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}