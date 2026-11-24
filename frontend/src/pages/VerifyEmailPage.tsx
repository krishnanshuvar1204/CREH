import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { api, apiError } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

export default function VerifyEmailPage() {
  const user = useAuthStore((st) => st.user);
  const updateUser = useAuthStore((st) => st.updateUser);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.verification_status !== "unverified") {
    return (
      <div className="mx-auto my-auto max-w-md px-6 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Email verified</h1>
        <p className="mt-2 text-slate-600">Next, tell us where you live so we can show you items nearby.</p>
        <Link to="/settings?welcome=1" className="mt-8 inline-block rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700">
          Set up your profile
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await api.post("/auth/verify", { code });
      updateUser({ verification_status: res.data.user.verification_status });
      navigate("/settings?welcome=1");
    } catch (err) {
      setError(apiError(err, "We couldn’t verify that code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await api.post("/auth/verify/resend");
      setInfo("A new code is on its way.");
      setCooldown(60);
    } catch (err: any) {
      if (err?.response?.status === 429) setCooldown(60);
      setError(apiError(err, "Couldn’t send a new code. Please try again."));
    }
  };

  return (
    <div className="mx-auto my-auto w-full max-w-md px-5 py-16">
      <span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <MailCheck className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Check your email</h1>
      <p className="mt-2 text-slate-600">
        We sent a 6-digit code to <strong className="text-ink">{user.email}</strong>. Enter it below to activate your account.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-semibold">Verification code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl bg-white px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] ring-1 ring-ink/15 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}
        {info && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{info}</p>}

        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-5 animate-spin" />} Verify email
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Didn’t get it?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-bold text-emerald-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code"}
        </button>
      </p>
      <p className="mt-3 text-center text-xs text-slate-500">
        Running locally with the console email provider? The code is printed in the API server log.
      </p>
    </div>
  );
}
