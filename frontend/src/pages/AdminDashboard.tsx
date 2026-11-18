import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "../lib/api";
import { withMockFallback } from "../mocks/withMockFallback";
import { mockDisputes } from "../mocks/fixtures";
import DemoBadge from "../components/DemoBadge";
import { isAdmin as hasAdminRole, useAuthStore } from "../stores/authStore";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  MessageCircle,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Scale,
  Undo2,
  HandCoins,
  Inbox,
  Quote,
  CircleCheck,
} from "lucide-react";
import ChatModal from "../components/ChatModal";

type Filter = "OPEN" | "RESOLVED" | "ALL";

const person = (p?: { name?: string; email?: string }) => (
  <>
    <span className="font-semibold">{p?.name ?? "Unknown"}</span>
    {p?.email && <span className="block truncate text-xs text-slate-500">{p.email}</span>}
  </>
);

export default function AdminDashboard() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [activeChat, setActiveChat] = useState<any>(null);
  const [ruling, setRuling] = useState<{ dispute: any; refundRequester: boolean } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const user = useAuthStore((st) => st.user);
  const isAdmin = hasAdminRole(user);
  const [isMock, setIsMock] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await withMockFallback(async () => (await api.get("/disputes")).data as any[], mockDisputes);
      setDisputes(res.data);
      setIsMock(res.isMock);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!isAdmin) {
    return (
      <div className="mx-auto my-auto max-w-md px-6 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-700">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Admins only</h1>
        <p className="mt-2 text-slate-600">This area is reserved for CREH administrators.</p>
        <Link to="/" className="mt-8 inline-block rounded-full bg-ink px-7 py-3.5 font-bold text-white transition hover:-translate-y-0.5">
          Back to home
        </Link>
      </div>
    );
  }

  const openRuling = (dispute: any, refundRequester: boolean) => {
    setRuling({ dispute, refundRequester });
    setNotes("");
    setError("");
  };

  const handleResolve = async () => {
    if (!ruling) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/disputes/${ruling.dispute.id}/resolve`, {
        refundRequester: ruling.refundRequester,
        adminNotes: notes.trim(),
      });
      setRuling(null);
      await load();
      setToast(`Dispute #${ruling.dispute.id} resolved.`);
    } catch (e) {
      setError(apiError(e, "We couldn’t resolve this dispute. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const open = disputes.filter((d) => d.status === "OPEN");
  const resolved = disputes.filter((d) => d.status === "RESOLVED");
  const shown = filter === "OPEN" ? open : filter === "RESOLVED" ? resolved : disputes;

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "OPEN", label: "Open", count: open.length },
    { id: "RESOLVED", label: "Resolved", count: resolved.length },
    { id: "ALL", label: "All", count: disputes.length },
  ];

  return (
    <div className="relative w-full flex-1 bg-cream text-ink">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="rise flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <span className="grid size-16 place-items-center rounded-2xl bg-ink text-emerald-300">
              <Scale className="size-8" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Dispute resolution</h1>
              <p className="mt-1 text-slate-600">Review each case, then rule on where the deposit goes.</p>
            </div>
          </div>
          {isMock && <DemoBadge />}
          {!loading && open.length > 0 && (
            <p className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800">
              <AlertTriangle className="size-4" /> {open.length} open {open.length === 1 ? "case" : "cases"}
            </p>
          )}
        </div>

        <div role="tablist" className="mt-10 flex gap-2 overflow-x-auto border-b border-ink/10 [scrollbar-width:none]">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-bold transition ${
                filter === id ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-ink"
              }`}
            >
              {label}
              <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${filter === id ? "bg-emerald-100" : "bg-ink/5"}`}>{count}</span>
            </button>
          ))}
        </div>

        <div className="mt-8" role="tabpanel">
          {loading ? (
            <ul className="space-y-4">
              {[0, 1].map((i) => (
                <li key={i} className="animate-pulse space-y-3 rounded-2xl bg-white p-6 ring-1 ring-ink/5">
                  <div className="h-5 w-1/3 rounded bg-slate-200" />
                  <div className="h-16 rounded-xl bg-slate-100" />
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                </li>
              ))}
            </ul>
          ) : shown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/20 px-6 py-16 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Inbox className="size-6" />
              </span>
              <p className="mt-4 font-display text-xl font-bold">
                {filter === "OPEN" ? "All clear" : "Nothing here"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-slate-600">
                {filter === "OPEN" ? "There are no open disputes right now." : "No disputes match this view."}
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {shown.map((d: any) => {
                const isOpen = d.status === "OPEN";
                return (
                  <li key={d.id} className="rounded-2xl bg-white p-6 ring-1 ring-ink/10 transition duration-300 hover:shadow-[0_16px_32px_-20px_rgba(11,42,34,0.35)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Dispute #{d.id}</p>
                        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">{d.request.resource.title}</h2>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          isOpen ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {isOpen ? <AlertTriangle className="size-3.5" /> : <CircleCheck className="size-3.5" />}
                        {isOpen ? "Open" : "Resolved"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl bg-cream p-4 text-sm">
                        <p className="mb-1 text-xs font-semibold text-slate-500">Raised by</p>
                        {person(d.raised_by)}
                      </div>
                      <div className="min-w-0 rounded-xl bg-cream p-4 text-sm">
                        <p className="mb-1 text-xs font-semibold text-slate-500">Borrower</p>
                        {person(d.request.requester)}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-4 text-amber-950">
                      <Quote className="mt-0.5 size-4 shrink-0 text-amber-700" />
                      <p className="text-sm leading-relaxed">{d.reason}</p>
                    </div>

                    {isOpen ? (
                      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/5 pt-5">
                        <button
                          onClick={() => openRuling(d, true)}
                          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Undo2 className="size-4" /> Refund borrower
                        </button>
                        <button
                          onClick={() => openRuling(d, false)}
                          className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-amber-400"
                        >
                          <HandCoins className="size-4" /> Pay owner
                        </button>
                        <button
                          onClick={() => setActiveChat(d.request)}
                          className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/15 transition hover:ring-emerald-600"
                        >
                          <MessageCircle className="size-4" /> Open chat
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 border-t border-ink/5 pt-5 text-sm">
                        <p className="text-xs font-semibold text-slate-500">Resolution notes</p>
                        <p className="mt-1 leading-relaxed text-slate-700">{d.admin_notes || "No notes were added."}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {toast && (
        <div role="status" className="rise fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(11,42,34,0.5)]">
          <Check className="size-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Ruling dialog */}
      {ruling && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setRuling(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm ruling"
            onClick={(e) => e.stopPropagation()}
            className="rise w-full max-w-md rounded-t-[2rem] bg-cream p-7 shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)] sm:rounded-[2rem]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {ruling.refundRequester ? "Refund the borrower" : "Pay the owner"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {ruling.refundRequester
                    ? `The deposit for “${ruling.dispute.request.resource.title}” goes back to ${ruling.dispute.request.requester.name}.`
                    : `The escrowed deposit for “${ruling.dispute.request.resource.title}” is paid to the owner.`}{" "}
                  This can’t be undone.
                </p>
              </div>
              <button onClick={() => setRuling(null)} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-ink/5">
                <X className="size-5" />
              </button>
            </div>

            <label htmlFor="notes" className="mb-1.5 mt-5 block text-sm font-semibold">Resolution notes</label>
            <textarea
              id="notes"
              autoFocus
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain your decision. Both parties can see this."
              className="w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-ink/15 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {error && (
              <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRuling(null)} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold ring-1 ring-ink/15 transition hover:ring-emerald-600">
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirm ruling
              </button>
            </div>
          </div>
        </div>
      )}

      {activeChat && <ChatModal request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}
