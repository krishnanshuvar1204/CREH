import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartHandshake,
  UserCircle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Lock,
  MapPin,
  MessageCircle,
  Wrench,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3.5 text-[15px] ring-1 ring-ink/15 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("user"); // "user" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((st) => st.setSession);

  const isAdmin = role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await api.post(endpoint, payload);
      const user = res.data.user;

      if (role === "admin" && user.role !== "admin") {
        setError("This account doesn’t have admin privileges.");
        return;
      }

      setSession(res.data.token, user);

      if (user.role === "admin" && role === "admin") {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const detail = data?.details?.[0]?.message as string | undefined;
      setError(
        isLogin
          ? "We couldn’t sign you in. Check your email and password."
          : detail || data?.error || "We couldn’t create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError("");
  };

  return (
    <div className="grid min-h-dvh bg-cream text-ink lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-emerald-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-40 -right-32 size-[34rem] rounded-full bg-emerald-400/40 blur-3xl" aria-hidden="true" />

        <Link to="/" className="relative flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <HeartHandshake className="size-7" /> CREH
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-5xl font-extrabold leading-[1.02] tracking-[-0.035em]">
            The drill you need is two doors down.
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-emerald-50/85">
            Join your neighbors in lending, borrowing and sharing, with deposits held safely until everything comes home.
          </p>

          <div className="relative mt-12 h-56 max-w-md" aria-hidden="true">
            <div className="float absolute left-0 top-0 w-60 rounded-2xl bg-white p-3.5 text-ink shadow-[0_18px_40px_-12px_rgba(6,60,45,0.5)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Wrench className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Cordless drill set</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3" /> 0.4 km away
                  </p>
                </div>
              </div>
            </div>
            <div className="float absolute right-0 top-20 w-56 rounded-2xl bg-ink p-4 [animation-delay:-3s]">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Lock className="size-4" /> Deposit held in escrow
              </div>
              <p className="mt-1 font-display text-2xl font-bold">$40.00</p>
            </div>
            <div className="absolute bottom-0 left-6 flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 text-xs font-medium text-ink shadow-[0_12px_30px_-10px_rgba(6,60,45,0.5)]">
              <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
                <MessageCircle className="size-3.5" />
              </span>
              “Pickup at 6pm works!”
            </div>
          </div>
        </div>

        <p className="relative text-sm text-emerald-50/70">Share more. Buy less.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-ink">
            <ArrowLeft className="size-4" /> Back home
          </Link>
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-emerald-700 lg:hidden">
            <HeartHandshake className="size-6" /> CREH
          </Link>
        </div>

        <div className="rise m-auto w-full max-w-md py-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-[-0.03em]">
            {isAdmin ? "Admin sign in" : isLogin ? "Welcome back" : "Join the community"}
          </h1>
          <p className="mt-2 text-slate-600">
            {isAdmin
              ? "Manage users, requests and disputes."
              : isLogin
              ? "Sign in to manage your requests and shared items."
              : "Create a free account and start sharing with your neighbors."}
          </p>

          {/* Role selector */}
          <div role="tablist" aria-label="Account type" className="mt-8 grid grid-cols-2 rounded-full bg-ink/5 p-1">
            {[
              { id: "user", label: "Neighbor", icon: UserCircle },
              { id: "admin", label: "Admin", icon: ShieldAlert },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={role === id}
                onClick={() => {
                  setRole(id);
                  setError("");
                  if (id === "admin") setIsLogin(true);
                }}
                className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition duration-300 ${
                  role === id
                    ? `bg-white shadow-sm ${id === "admin" ? "text-red-700" : "text-emerald-800"}`
                    : "text-slate-500 hover:text-ink"
                }`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && !isAdmin && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">Full name</label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-ink/5 hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`group flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-white transition duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 ${
                isAdmin
                  ? "bg-red-600 shadow-[0_14px_28px_-12px_rgba(220,38,38,0.7)] hover:bg-red-700"
                  : "bg-emerald-600 shadow-[0_14px_28px_-12px_rgba(5,150,105,0.8)] hover:bg-emerald-700"
              }`}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : null}
              {loading ? "One moment…" : isAdmin ? "Sign in as admin" : isLogin ? "Sign in" : "Create account"}
              {!loading && <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />}
            </button>
          </form>

          {!isAdmin && (
            <p className="mt-8 text-center text-sm text-slate-600">
              {isLogin ? "New to CREH?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(!isLogin)}
                className="font-bold text-emerald-700 underline-offset-4 hover:underline"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
