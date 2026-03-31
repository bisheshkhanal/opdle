import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 font-pirate text-5xl text-gold-600 dark:text-gold-400">
        ☠
      </p>
      <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-navy-800 dark:text-slate-100">
        This pirate doesn&apos;t exist
      </h1>
      <p className="mb-6 max-w-md text-sm text-navy-500 dark:text-slate-400">
        We couldn&apos;t find a captain with that username in the Grand Line
        logs.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-800 dark:bg-slate-600 dark:hover:bg-slate-500"
      >
        Return to the Grand Line
      </Link>
    </main>
  );
}
