import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log("NextAuth result:", result);

      if (!result || result.error) {
        setError(
          "Invalid email or password. Please check your details."
        );
        setLoading(false);
        return;
      }

      /*
       * Get the newly authenticated session.
       * The session contains the user's role.
       */
      const session = await getSession();

      console.log("Authenticated session:", session);

      if (!session?.user) {
        setError(
          "Login succeeded, but the user session could not be loaded."
        );
        setLoading(false);
        return;
      }

      /*
       * Creator → Creator Dashboard
       * Consumer → Latest Videos
       */
      if (session.user.role === "CREATOR") {
        await router.push("/creator");
      } else {
        await router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to sign in. Please try again."
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
            <span className="text-white">Media</span>
            <span className="text-red-500">Nest</span>
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
      {/* LOGIN CONTENT */}
      {/* ========================================================= */}

      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">

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
                  d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4.5 20a7.5 7.5 0 0 1 15 0M19 8v5m2.5-2.5h-5"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">
              Creator Access
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Welcome back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Sign in to access your MediaNest account.
            </p>
          </div>

          {/* Login Card */}

          <div className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/50 sm:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}

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

              {/* Password */}

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
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Error */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-400">
                  {error}
                </div>
              )}

              {/* Login */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/10 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Creator Login"}
              </button>
            </form>

            {/* Register */}

            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-gray-500">
                Don't have a MediaNest account?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-block text-sm font-semibold text-red-400 transition hover:text-red-300"
              >
                Create an account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-700">
            MediaNest · Scalable Advanced Software Solutions
          </p>
        </div>
      </div>
    </main>
  );
}