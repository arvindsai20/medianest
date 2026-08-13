import Head from "next/head";
import Link from "next/link";

const videos = [
  {
    id: 1,
    title: "Exploring Birmingham",
    publisher: "MediaNest Originals",
    producer: "MediaNest Studios",
    genre: "Documentary",
    ageRating: "PG",
    duration: "12:45",
  },
  {
    id: 2,
    title: "The Future of Technology",
    publisher: "TechVision",
    producer: "Digital Media Group",
    genre: "Technology",
    ageRating: "U",
    duration: "18:20",
  },
  {
    id: 3,
    title: "Street Food Adventures",
    publisher: "Food Explorer",
    producer: "Taste Productions",
    genre: "Food",
    ageRating: "PG",
    duration: "09:32",
  },
  {
    id: 4,
    title: "Introduction to Cloud Computing",
    publisher: "Cloud Academy",
    producer: "Learning Media",
    genre: "Education",
    ageRating: "U",
    duration: "21:15",
  },
  {
    id: 5,
    title: "Beautiful Places in the UK",
    publisher: "Travel World",
    producer: "World View Studios",
    genre: "Travel",
    ageRating: "U",
    duration: "14:08",
  },
  {
    id: 6,
    title: "Modern Web Development",
    publisher: "Code Academy",
    producer: "Developer Media",
    genre: "Education",
    ageRating: "U",
    duration: "25:41",
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>MediaNest | Video Sharing Platform</title>
        <meta
          name="description"
          content="MediaNest cloud-based video sharing platform"
        />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-lg font-bold">
                M
              </div>

              <span className="text-xl font-bold tracking-tight">
                Media<span className="text-red-500">Nest</span>
              </span>
            </Link>

            {/* Search */}
            <div className="hidden flex-1 md:block">
              <div className="mx-auto max-w-2xl">
                <div className="flex overflow-hidden rounded-full border border-gray-700 bg-gray-900">
                  <input
                    type="text"
                    placeholder="Search videos..."
                    className="w-full bg-transparent px-5 py-3 text-sm outline-none placeholder:text-gray-500"
                  />

                  <button className="border-l border-gray-700 px-6 text-gray-300 transition hover:bg-gray-800">
                    🔍
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white sm:block"
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-700"
              >
                Register
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 border-r border-gray-800 px-4 py-8 lg:block">
            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium"
              >
                🏠
                <span>Home</span>
              </Link>

              <Link
                href="/latest"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                🕐
                <span>Latest Videos</span>
              </Link>

              <Link
                href="/search"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                🔍
                <span>Search</span>
              </Link>

              <div className="my-6 border-t border-gray-800" />

              <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categories
              </p>

              {[
                "Education",
                "Technology",
                "Documentary",
                "Travel",
                "Food",
              ].map((category) => (
                <button
                  key={category}
                  className="flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
                >
                  {category}
                </button>
              ))}
            </nav>

            <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm font-semibold">Are you a creator?</p>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Upload and manage your videos through the creator dashboard.
              </p>

              <Link
                href="/creator"
                className="mt-4 block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-gray-900 transition hover:bg-gray-200"
              >
                Creator Dashboard
              </Link>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1 px-6 py-8">
            {/* Hero */}
            <section className="mb-10 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-red-950/40">
              <div className="px-7 py-10 md:px-10">
                <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-semibold text-red-400">
                  CLOUD VIDEO PLATFORM
                </span>

                <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
                  Discover, watch and share videos on{" "}
                  <span className="text-red-500">MediaNest.</span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">
                  A cloud-based video sharing platform where consumers can
                  discover content and creators can upload and manage their
                  videos.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/latest"
                    className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
                  >
                    Explore Latest Videos
                  </Link>

                  <Link
                    href="/creator"
                    className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-gray-800"
                  >
                    Creator Dashboard
                  </Link>
                </div>
              </div>
            </section>

            {/* Latest videos */}
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-red-500">
                    DISCOVER
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Latest Videos
                  </h2>
                </div>

                <Link
                  href="/latest"
                  className="text-sm font-medium text-gray-400 transition hover:text-white"
                >
                  View all →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map((video) => (
                  <article
                    key={video.id}
                    className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition hover:-translate-y-1 hover:border-gray-700"
                  >
                    {/* Thumbnail placeholder */}
                    <Link href={`/watch/${video.id}`}>
                      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl shadow-lg transition group-hover:scale-110">
                          ▶
                        </div>

                        <span className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-xs">
                          {video.duration}
                        </span>
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-gray-800 px-2 py-1 text-[10px] font-medium text-gray-400">
                          {video.genre}
                        </span>

                        <span className="rounded bg-gray-800 px-2 py-1 text-[10px] font-medium text-gray-400">
                          {video.ageRating}
                        </span>
                      </div>

                      <Link href={`/watch/${video.id}`}>
                        <h3 className="line-clamp-2 text-base font-semibold transition group-hover:text-red-400">
                          {video.title}
                        </h3>
                      </Link>

                      <p className="mt-2 text-xs text-gray-500">
                        {video.publisher}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        Producer: {video.producer}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* CW2 feature summary */}
            <section className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-2xl">☁️</div>
                <h3 className="mt-4 font-semibold">Cloud Storage</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Videos are designed to be stored using scalable cloud object
                  storage.
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-2xl">🎬</div>
                <h3 className="mt-4 font-semibold">Creator Uploads</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Creators can upload videos and provide the required metadata.
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="text-2xl">🔐</div>
                <h3 className="mt-4 font-semibold">Secure Access</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Authentication and role-based access will separate creator
                  and consumer functionality.
                </p>
              </div>
            </section>
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col justify-between gap-4 text-sm text-gray-500 sm:flex-row">
              <p>
                © 2026 MediaNest. Cloud-Based Video Sharing Platform.
              </p>

              <p>Scalable Advanced Software Solutions — CW2</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}