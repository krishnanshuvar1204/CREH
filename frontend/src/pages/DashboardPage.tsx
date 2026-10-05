import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Package,
  Star,
  ShieldAlert,
  CheckCircle,
  ArrowLeftRight,
  X,
  Plus,
  MessageCircle,
  ImagePlus,
  Loader2,
  Check,
  Inbox,
  Gift,
  Clock,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ChatModal from "../components/ChatModal";

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
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;
  const [requests, setRequests] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("borrowing");
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeChat, setActiveChat] = useState<any>(null);
  const [resourceImageBase64, setResourceImageBase64] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [reporting, setReporting] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [reqRes, resRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}/requests`),
        axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}/resources`),
      ]);
      setRequests(reqRes.data);
      setMyResources(resRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
      await axios.post(`${import.meta.env.VITE_API_URL}/requests/${reqId}/${path}`, body);
      await load();
      setToast({ text: okText, tone: "ok" });
    } catch (e: any) {
      setToast({ text: e.response?.data?.error || "That didn’t go through. Please try again.", tone: "err" });
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

  const handleResourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setResourceImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const closeAddModal = () => {
    setIsAddingResource(false);
    setFormError("");
    setResourceImageBase64(null);
  };

  const handleAddResource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFormError("");

    if (!navigator.geolocation) {
      setFormError("Geolocation isn’t supported by your browser.");
      return;
    }
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/resources`, {
            ownerId: user.id,
            title: formData.get("title"),
            description: formData.get("description"),
            category: formData.get("category"),
            sharing_radius_km: Number(formData.get("radius")),
            lending_duration_days: Number(formData.get("duration")),
            is_donation: formData.get("type") === "donation",
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            imageBase64: resourceImageBase64,
          });
          closeAddModal();
          await load();
          setTab("items");
          setToast({ text: "Your item is live for the community.", tone: "ok" });
        } catch (err) {
          setFormError("We couldn’t list your item. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        setIsSubmitting(false);
        setFormError("Location access is needed so neighbors can find your item.");
      }
    );
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
            {user.email === "admin@creh.com" && (
              <button onClick={() => navigate("/admin")} className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700">
                <ShieldAlert className="size-4" /> Admin panel
              </button>
            )}
            <button onClick={() => setIsAddingResource(true)} className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5">
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
              action={<button onClick={() => setIsAddingResource(true)} className={btnPrimary}><Plus className="size-4" /> Share an item</button>}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myResources.map((res: any) => (
                <li key={res.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_-20px_rgba(11,42,34,0.35)]">
                  <div
                    className="relative grid h-32 place-items-center bg-emerald-100 bg-cover bg-center text-emerald-700"
                    style={res.image_url ? { backgroundImage: `url(http://localhost:5000${res.image_url})` } : undefined}
                  >
                    {!res.image_url && <Package className="size-10 opacity-60" />}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                        res.status === "AVAILABLE" ? "bg-emerald-600 text-white" : "bg-ink/80 text-white"
                      }`}
                    >
                      {res.status === "AVAILABLE" ? "Available" : res.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold leading-tight">{res.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{res.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{res.category}</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        {res.is_donation ? <Gift className="size-3.5" /> : <Clock className="size-3.5" />}
                        {res.is_donation ? "Donation" : `${res.lending_duration_days} days`}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
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

      {/* Add Resource Modal */}
      {isAddingResource && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={closeAddModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share a new item"
            onClick={(e) => e.stopPropagation()}
            className="rise flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)] sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-7 py-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Share an item</h2>
                <p className="text-sm text-slate-600">Neighbors within your radius will see it.</p>
              </div>
              <button onClick={closeAddModal} aria-label="Close" className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-ink/5">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4 overflow-y-auto p-7">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-semibold">Title</label>
                <input id="title" name="title" required placeholder="e.g. Cordless power drill" className={inputCls} />
              </div>
              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">Description</label>
                <textarea id="description" name="description" required placeholder="Condition, what’s included…" className={inputCls} rows={3}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="mb-1.5 block text-sm font-semibold">Category</label>
                  <select id="category" name="category" className={inputCls}>
                    <option>Tools</option>
                    <option>Electronics</option>
                    <option>Outdoors</option>
                    <option>Furniture</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="type" className="mb-1.5 block text-sm font-semibold">Type</label>
                  <select id="type" name="type" className={inputCls}>
                    <option value="borrow">Lend for borrowing</option>
                    <option value="donation">Permanent donation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="radius" className="mb-1.5 block text-sm font-semibold">Radius (km)</label>
                  <input id="radius" name="radius" type="number" defaultValue="5" min="1" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="duration" className="mb-1.5 block text-sm font-semibold">Duration (days)</label>
                  <input id="duration" name="duration" type="number" defaultValue="3" min="1" className={inputCls} />
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-semibold">Photo</span>
                <label className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/25 bg-white text-slate-500 transition hover:border-emerald-600 hover:text-emerald-700">
                  {resourceImageBase64 ? (
                    <img src={resourceImageBase64} alt="Preview" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <ImagePlus className="size-5" /> Add a photo
                    </span>
                  )}
                  <input type="file" accept="image/*" onChange={handleResourceImageUpload} className="sr-only" />
                </label>
              </div>

              {formError && (
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 font-bold text-white shadow-[0_14px_28px_-12px_rgba(5,150,105,0.8)] transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="size-5 animate-spin" />}
                {isSubmitting ? "Listing…" : "List item for the community"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && <ChatModal request={activeChat} currentUser={user} onClose={() => setActiveChat(null)} />}
    </div>
  );
}
