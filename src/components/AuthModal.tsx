"use client";

import React, { useState } from "react";
import { Modal } from "@/components/Modal";
import { signIn } from "@/lib/auth-client";

type Tab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    resetForm();
  };

  const validateUsername = (value: string): string | null => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      return "Username must be 3-20 characters (letters, numbers, underscores only)";
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (password.length === 0) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 409) {
        setError("Username already taken");
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Registration failed");
        return;
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Registered successfully but login failed. Please sign in.");
        setTab("login");
      } else {
        resetForm();
        onSuccess?.();
        onClose();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to OnePiecedle">
      {/* Tab switcher */}
      <div className="mb-6 flex rounded-lg bg-navy-100/50 p-1 dark:bg-slate-800/50">
        <button
          onClick={() => handleTabChange("login")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            tab === "login"
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => handleTabChange("register")}
          className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
            tab === "register"
              ? "bg-gold-400 text-navy-900 shadow-sm dark:bg-gold-500 dark:text-navy-900"
              : "text-navy-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Register
        </button>
      </div>

      {/* Login form */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-username"
              className="text-sm font-medium text-navy-700 dark:text-slate-300"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              autoComplete="username"
              className="rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-navy-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-tile-wrong dark:text-red-400"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {isLoading ? "Signing in…" : "Sign In"}
          </button>
          <p className="text-center text-xs text-navy-500 dark:text-slate-400">
            No account?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("register")}
              className="font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Register here
            </button>
          </p>
        </form>
      )}

      {/* Register form */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-username"
              className="text-sm font-medium text-navy-700 dark:text-slate-300"
            >
              Username
            </label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="choose_a_username"
              autoComplete="username"
              className="rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
            <p className="text-xs text-navy-400 dark:text-slate-500">
              3–20 characters, letters, numbers, and underscores only
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-password"
              className="text-sm font-medium text-navy-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-confirm"
              className="text-sm font-medium text-navy-700 dark:text-slate-300"
            >
              Confirm Password
            </label>
            <input
              id="register-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="rounded-lg border border-parchment-300 bg-parchment-50 px-3 py-2 text-sm text-navy-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="text-sm text-tile-wrong dark:text-red-400"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {isLoading ? "Creating account…" : "Create Account"}
          </button>
          <p className="text-center text-xs text-navy-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className="font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
            >
              Sign in here
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
}
