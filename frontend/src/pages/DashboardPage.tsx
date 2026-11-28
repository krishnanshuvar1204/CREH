import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Package,
  Star,
  ShieldAlert,
  CheckCircle,
  ArrowLeftRight,
  Pencil,
  Pause,
  Play,
  Trash2,
  Plus,
  MessageCircle,
  Loader2,
  Check,
  Inbox,
  Gift,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { api, apiError } from "../lib/api";
import { withMockFallback } from "../mocks/withMockFallback";
import { mockRequests, mockResources } from "../mocks/fixtures";
import DemoBadge from "../components/DemoBadge";
import { isAdmin as hasAdminRole, useAuthStore } from "../stores/authStore";
import { Link, useNavigate } from "react-router-dom";
import ChatModal from "../components/ChatModal";
import ResourceFormModal from "../components/ResourceFormModal";
import { categoryLabel, imageSrc, radiusLabel } from "../lib/resourceMeta";

type Tab = "borrowing" | "lending" | "items";

const statusStyle: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Awaiting owner", cls: "bg-amber-100 text-amber-900" },
  ACCEPTED: { label: "Accepted · pay deposit", cls: "bg-sky-100 text-sky-900" },
  ACTIVE: { label: "In use", cls: "bg-emerald-100 text-emerald-900" },
  RETURNED_PENDING_REVIEW: { label: "Returned · in review", cls: "bg-violet-100 text-violet-900" },
  COMPLETED: { label: "Completed", cls: "bg-slate-100 text-slate-700" },
  REJECTED: { label: "Declined", cls: "bg-red-100 text-red-800" },
  DISPUTED: { label: "Disputed", cls: "bg-red-100 text-red-800" },
};

const prettyStatus = (s: string) =>
  statusStyle[s] ?? { label: s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), cls: "bg-slate-100 text-slate-700" };

function StatusPill({ status }: { status: string }) {
  const { label, cls } = prettyStatus(status);
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-ink/15 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((st) => st.user);
  const userId = user?.id;
  const userName = user?.name ?? "You";
  const [isMock, setIsMock] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("borrowing");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [reporting, setReporting] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await withMockFallback(
        async () => {
          const [reqRes, resRes] = await Promise.all([api.get("/users/me/requests"), api.get("/users/me/resources")]);
          return { requests: reqRes.data as any[], resources: resRes.data as any[] };
        },
        () => ({ requests: mockRequests(userId, userName) as any[], resources: mockResources() as any[] })
      );
      setRequests(res.data.requests);
      setMyResources(res.data.resources);
      setIsMock(res.isMock);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, userName]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!user) {
    return (
      <div className="mx-auto my-auto max-w-md px-6 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Inbox className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Your dashboard awaits</h1>
        <p className="mt-2 text-slate-600">Log in to manage your requests, deposits and shared items.</p>
        <Link to="/auth" className="mt-8 inline-block rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700">
          Log in or sign up
        </Link>
      </div>
    );
  }

  // Actions
  const act = async (reqId: number, path: string, okText: string, body?: object) => {
    setBusyId(reqId);
    try {
      await api.post(`/requests/${reqId}/${path}`, body);
      await load();
      setToast({ text: okText, tone: "ok" });
    } catch (e: any) {
      setToast({ text: apiError(e, "That didn’t go through. Please try again."), tone: "err" });
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = (id: number) => act(id, "accept", "Request accepted. The borrower can now pay the deposit.");
  const handlePay = (id: number) => act(id, "pay", "Deposit paid. Your escrow is secured.");
  const handleReturn = (id: number) => act(id, "return", "Marked as returned. The owner will review it.");
  const handleConfirmOk = (id: number) => act(id, "review-return", "Return confirmed. Deposit released.", { isOk: true, reason: "" });

  const submitReport = async () => {
    if (reporting === null || !reportReason.trim()) return;
    const id = reporting;
    setReporting(null);
    await act(id, "review-return", "Issue reported. Our team will take a look.", { isOk: false, reason: reportReason.trim() });
    setReportReason("");
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const onSaved = async (message: string, ok = true) => {
    closeForm();
    await load();
    setTab("items");
    setToast({ text: message, tone: ok ? "ok" : "err" });
  };

  const toggleAvailability = async (res: any) => {
    const next = res.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    setBusyId(res.id);
    try {
      await api.patch(`/resources/${res.id}`, { availability: next });
      await load();
      setToast({ text: next === "UNAVAILABLE" ? "Item paused. Neighbors can’t see it." : "Item is live again.", tone: "ok" });
    } catch (e) {
      setToast({ text: apiError(e, "Couldn’t update the item."), tone: "err" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = deleting;
    setDeleting(null);
    setBusyId(res.id);
    try {
      await api.delete(`/resources/${res.id}`);
      await load();
      setToast({ text: "Item deleted.", tone: "ok" });
    } catch (e) {
      setToast({ text: apiError(e, "Couldn’t delete the item."), tone: "err" });
    } finally {
      setBusyId(null);
    }
  };

  const myBorrowing = requests.filter((r: any) => r.requester.id === user.id);
  const myLending = requests.filter((r: any) => r.resource.owner.id === user.id);
  const needsAction =
    myBorrowing.filter((r) => r.status === "ACCEPTED").length +
    myLending.filter((r) => r.status === "PENDING" || r.status === "RETURNED_PENDING_REVIEW").length;
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();

  const tabs: { id: Tab; label: string; count: number; icon: any }[] = [
    { id: "borrowing", label: "Borrowing", count: myBorrowing.length, icon: ArrowLeftRight },
    { id: "lending", label: "Lending", count: myLending.length, icon: Inbox },
    { id: "items", label: "My items", count: myResources.length, icon: Package },
  ];

  const btnPrimary =
    "flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60";
  const btnGhost =
    "flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-ink/15 transition hover:ring-emerald-600";

  const RequestCard = ({ req, role }: { req: any; role: "borrower" | "owner" }) => {
    const busy = busyId === req.id;
    const chatOk = req.status !== "PENDING" && req.status !== "REJECTED";
    return (
      <li className="rounded-2xl bg-white p-5 ring-1 ring-ink/10 transition duration-300 hover:shadow-[0_16px_32px_-20px_rgba(11,42,34,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 font-display text-lg font-bold text-emerald-800">
              {(role === "borrower" ? req.resource.owner.name : req.requester.name)?.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-bold leading-tight">{req.resource.title}</h3>
              <p className="text-sm text-slate-500">
                {role === "borrower" ? `From ${req.resource.owner.name}` : `Requested by ${req.requester.name}`}
              </p>
            </div>
          </div>
          <StatusPill status={req.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-ink/5 pt-4">
          {chatOk && (
            <button onClick={() => setActiveChat(req)} className={btnGhost}>
              <MessageCircle className="size-4" /> Chat
            </button>
          )}
          {role === "borrower" && req.status === "ACCEPTED" && (
            <button disabled={busy} onClick={() => handlePay(req.id)} className={btnPrimary}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              Pay deposit (${req.security_deposit_amount || 50})
            </button>
          )}
          {role === "borrower" && req.status === "ACTIVE" && (
            <button disabled={busy} onClick={() => handleReturn(req.id)} className={btnPrimary}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Return item
            </button>
          )}
          {role === "owner" && req.status === "PENDING" && (
            <button disabled={busy} onClick={() => handleAccept(req.id)} className={btnPrimary}>
              {busy && <Loader2 className="size-4 animate-spin" />} Accept request
            </button>
          )}
          {role === "owner" && req.status === "RETURNED_PENDING_REVIEW" && (
            <>
              <button
                disabled={busy}
                onClick={() => {
                  setReporting(req.id);
                  setReportReason("");
                }}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
              >
                <AlertTriangle className="size-4" /> Report issue
              </button>
              <button disabled={busy} onClick={() => handleConfirmOk(req.id)} className={btnPrimary}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Confirm all good
              </button>
            </>
          )}
        </div>
      </li>
    );
  };

  const Empty = ({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) => (
    <div className="rounded-3xl border border-dashed border-ink/20 px-6 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <Package className="size-6" />
      </span>
      <p className="mt-4 font-display text-xl font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-slate-600">{text}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );

  return (
    <div className="relative w-full flex-1 bg-cream text-ink">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        {/* Header */}
        <div className="rise flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="grid size-16 place-items-center rounded-2xl bg-emerald-600 font-display text-3xl font-extrabold text-white shadow-[0_14px_28px_-12px_rgba(5,150,105,0.7)]">
              {initial}
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Hi, {user.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 font-medium text-slate-600">
                <Star className="size-4 fill-amber-500 text-amber-500" /> 5.0 neighbor rating
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasAdminRole(user) && (
              <button onClick={() => navigate("/admin")} className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700">
                <ShieldAlert className="size-4" /> Admin panel
              </button>
            )}
            {isMock && <DemoBadge className="self-center" />}
            <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5">
              <Plus className="size-4" /> Share an item
            </button>
          </div>
        </div>

        {/* Attention banner */}
        {!loading && needsAction > 0 && (
          <div className="rise mt-8 flex items-center gap-3 rounded-2xl bg-amber-100 px-5 py-4 text-amber-950 [animation-delay:80ms]">
            <AlertTriangle className="size-5 shrink-0" />
            <p className="font-semibold">
              {needsAction} {needsAction === 1 ? "request needs" : "requests need"} your attention.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div role="tablist" className="mt-10 flex gap-2 overflow-x-auto border-b border-ink/10 [scrollbar-width:none]">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-bold transition ${
                tab === id ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-500 hover:text-ink"
              }`}
            >
              <Icon className="size-4" /> {label}
              <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${tab === id ? "bg-emerald-100" : "bg-ink/5"}`}>{count}</span>
            </button>
          ))}
        </div>

        <div className="mt-8" role="tabpanel">
          {loading ? (
            <ul className="space-y-4">
              {[0, 1].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                  <div className="size-12 rounded-xl bg-emerald-100" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-1/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/4 rounded bg-slate-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : tab === "borrowing" ? (
            myBorrowing.length === 0 ? (
              <Empty
                title="Nothing borrowed yet"
                text="Find a tool, tent or toaster nearby and send your first request."
                action={<Link to="/discover" className={btnPrimary}>Explore local items</Link>}
              />
            ) : (
              <ul className="space-y-4">{myBorrowing.map((r) => <RequestCard key={r.id} req={r} role="borrower" />)}</ul>
            )
          ) : tab === "lending" ? (
            myLending.length === 0 ? (
              <Empty title="No requests yet" text="When a neighbor asks to borrow one of your items, it shows up here." />
            ) : (
              <ul className="space-y-4">{myLending.map((r) => <RequestCard key={r.id} req={r} role="owner" />)}</ul>
            )
          ) : myResources.length === 0 ? (
            <Empty
              title="Your shelf is empty"
              text="Help your community by sharing something that’s collecting dust."
              action={<button onClick={() => setFormOpen(true)} className={btnPrimary}><Plus className="size-4" /> Share an item</button>}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myResources.map((res: any) => {
                const cover = imageSrc(res.image_urls?.[0]);
                const livePaused = res.availability === "AVAILABLE" || res.availability === "UNAVAILABLE";
                const busy = busyId === res.id;
                const label =
                  res.availability === "AVAILABLE"
                    ? "Available"
                    : res.availability === "UNAVAILABLE"
                      ? "Paused"
                      : res.availability.charAt(0) + res.availability.slice(1).toLowerCase();
                return (
                  <li key={res.id} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_-20px_rgba(11,42,34,0.35)]">
                    <div
                      className="relative grid h-32 place-items-center bg-emerald-100 bg-cover bg-center text-emerald-700"
                      style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                    >
                      {!cover && <Package className="size-10 opacity-60" />}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                          res.availability === "AVAILABLE" ? "bg-emerald-600 text-white" : "bg-ink/80 text-white"
                        }`}
                      >
                        {label}
                      </span>
                      {res.image_urls?.length > 1 && (
                        <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2 py-1 text-xs font-bold text-white">{res.image_urls.length} photos</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg font-bold leading-tight">{res.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{res.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{categoryLabel(res.category)}</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          {res.is_donation ? <Gift className="size-3.5" /> : <Clock className="size-3.5" />}
                          {res.is_donation ? "Donation" : `${res.lending_duration_days} days`} · {radiusLabel(res.sharing_radius_m)}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2 border-t border-ink/5 pt-4">
                        <button onClick={() => setEditing(res)} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold ring-1 ring-ink/15 transition hover:ring-emerald-600 disabled:opacity-60">
                          <Pencil className="size-3.5" /> Edit
                        </button>
                        {livePaused && (
                          <button onClick={() => toggleAvailability(res)} disabled={busy} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold ring-1 ring-ink/15 transition hover:ring-emerald-600 disabled:opacity-60">
                            {busy ? <Loader2 className="size-3.5 animate-spin" /> : res.availability === "AVAILABLE" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                            {res.availability === "AVAILABLE" ? "Pause" : "Resume"}
                          </button>
                        )}
                        <button onClick={() => setDeleting(res)} disabled={busy} aria-label="Delete item" className="grid size-10 shrink-0 place-items-center rounded-full text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`rise fixed bottom-6 left-1/2 z-[120] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(11,42,34,0.5)] ${
            toast.tone === "ok" ? "bg-ink" : "bg-red-700"
          }`}
        >
          {toast.tone === "ok" ? <Check className="size-4 text-emerald-300" /> : <AlertTriangle className="size-4" />}
          {toast.text}
        </div>
      )}

      {/* Report issue dialog */}
      {reporting !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setReporting(null)}>
          <div role="dialog" aria-modal="true" aria-label="Report an issue" onClick={(e) => e.stopPropagation()} className="rise w-full max-w-md rounded-3xl bg-cream p-7 shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)]">
            <h2 className="text-2xl font-extrabold tracking-tight">Report an issue</h2>
            <p className="mt-1 text-sm text-slate-600">Describe any damage or missing parts. The deposit stays held while we review.</p>
            <textarea
              autoFocus
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              placeholder="e.g. The drill bit case is missing"
              className={`${inputCls} mt-4`}
            />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setReporting(null)} className={btnGhost}>Cancel</button>
              <button
                onClick={submitReport}
                disabled={!reportReason.trim()}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit item */}
      {(formOpen || editing) && <ResourceFormModal resource={editing ?? undefined} onClose={closeForm} onSaved={onSaved} />}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setDeleting(null)}>
          <div role="dialog" aria-modal="true" aria-label="Delete item" onClick={(e) => e.stopPropagation()} className="rise w-full max-w-md rounded-3xl bg-cream p-7 shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)]">
            <h2 className="text-2xl font-extrabold tracking-tight">Delete &ldquo;{deleting.title}&rdquo;?</h2>
            <p className="mt-1 text-sm text-slate-600">It disappears from discovery and pending requests are declined. Past exchanges stay in your history.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className={btnGhost}>Keep it</button>
              <button onClick={confirmDelete} className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">Delete item</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && <ChatModal request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}
