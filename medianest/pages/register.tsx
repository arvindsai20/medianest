import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<
    "CONSUMER" | "CREATOR"
  >("CONSUMER");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Registration failed."
        );

        setLoading(false);
        return;
      }

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Unable to create the account. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}

      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight"
          >
            <span className="text-white">
              Media
            </span>

            <span className="text-red-500">
              Nest
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            Back to MediaNest
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* REGISTER CONTENT */}
      {/* ========================================================= */}

      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg">

          {/* Heading */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                />

                <circle
                  cx="9"
                  cy="7"
                  r="4"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 8v6m3-3h-6"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
              Join MediaNest
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Create your account.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Join MediaNest as a viewer or creator.
            </p>
          </div>

          {/* ===================================================== */}
          {/* REGISTER CARD */}
          {/* ===================================================== */}

          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/50 sm:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* ================================================= */}
              {/* NAME */}
              {/* ================================================= */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Full name
                </label>

                <div className="flex items-center rounded-xl border border-white/10 bg-black px-4 transition focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10">
                  <svg
                    className="mr-3 h-5 w-5 shrink-0 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 21a8 8 0 0 1 16 0"
                    />
                  </svg>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your name"
                    required
                    autoComplete="name"
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* ================================================= */}
              {/* EMAIL */}
              {/* ================================================= */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Email address
                </label>

                <div className="flex items-center rounded-xl border border-white/10 bg-black px-4 transition focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10">
                  <svg
                    className="mr-3 h-5 w-5 shrink-0 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16v12H4z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 7 8 6 8-6"
                    />
                  </svg>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Password
                </label>

                <div className="flex items-center rounded-xl border border-white/10 bg-black px-4 transition focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/10">
                  <svg
                    className="mr-3 h-5 w-5 shrink-0 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                    />
                  </svg>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-600">
                  Password must contain at least 6
                  characters.
                </p>
              </div>

              {/* ================================================= */}
              {/* ACCOUNT TYPE */}
              {/* ================================================= */}

              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-300">
                  Choose your account
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Consumer */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole("CONSUMER")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      role === "CONSUMER"
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-black hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                        <svg
                          className={`h-5 w-5 ${
                            role === "CONSUMER"
                              ? "text-red-400"
                              : "text-gray-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                          />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
                        </svg>
                      </div>

                      {role === "CONSUMER" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m5 12 4 4L19 6"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-4 font-bold">
                      Consumer
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Watch videos, search content,
                      comment and rate.
                    </p>
                  </button>

                  {/* Creator */}

                  <button
                    type="button"
                    onClick={() =>
                      setRole("CREATOR")
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      role === "CREATOR"
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/10 bg-black hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                        <svg
                          className={`h-5 w-5 ${
                            role === "CREATOR"
                              ? "text-red-400"
                              : "text-gray-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.5 5.5 18.5 9.5"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m13 7 4 4-7.5 7.5H5.5V15L13 7Z"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 4h4v4"
                          />
                        </svg>
                      </div>

                      {role === "CREATOR" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m5 12 4 4L19 6"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-4 font-bold">
                      Creator
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Upload videos and manage your
                      creator dashboard.
                    </p>
                  </button>
                </div>
              </div>

              {/* ================================================= */}
              {/* ERROR */}
              {/* ================================================= */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-400">
                  {error}
                </div>
              )}

              {/* ================================================= */}
              {/* SUCCESS */}
              {/* ================================================= */}

              {success && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm leading-5 text-green-400">
                  {success}
                </div>
              )}

              {/* ================================================= */}
              {/* SUBMIT */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/10 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            {/* ================================================= */}
            {/* LOGIN LINK */}
            {/* ================================================= */}

            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have a MediaNest account?
              </p>

              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-semibold text-red-400 transition hover:text-red-300"
              >
                Creator Login
              </Link>
            </div>
          </div>

          {/* Footer */}

          <p className="mt-6 text-center text-xs text-gray-700">
            MediaNest · Scalable Advanced Software Solutions
          </p>
        </div>
      </div>
    </main>
  );
}