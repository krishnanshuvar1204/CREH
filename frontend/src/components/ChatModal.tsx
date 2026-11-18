import { useState, useEffect, useRef } from "react";
import { api, apiError } from "../lib/api";
import { X, Send, ImagePlus, MessageCircle, ShieldCheck, AlertTriangle } from "lucide-react";

export default function ChatModal({ request, currentUser, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/requests/${request.id}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [request.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !imageBase64) || sending) return;

    setSending(true);
    setError("");
    try {
      await api.post(`/requests/${request.id}/messages`, {
        text,
        imageBase64,
      });
      setText("");
      setImageBase64(null);
      fetchMessages();
    } catch (e) {
      console.error(e);
      setError(apiError(e, "Your message didn’t send. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isAdminViewer = currentUser.role === "admin";
  const otherName = isAdminViewer
    ? `${request.requester?.name ?? "Borrower"} & ${request.resource?.owner?.name ?? "Owner"}`
    : request.requester?.id === currentUser.id
    ? request.resource?.owner?.name
    : request.requester?.name;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chat about ${request.resource.title}`}
        onClick={(e) => e.stopPropagation()}
        className="rise flex h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)] sm:h-[38rem] sm:rounded-[2rem]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
              {isAdminViewer ? <ShieldCheck className="size-5" /> : <MessageCircle className="size-5" />}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold leading-tight">{request.resource.title}</h2>
              <p className="truncate text-xs font-medium text-slate-500">
                {isAdminViewer ? "Admin view" : "Chat with"} {otherName}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close chat" className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-ink/5 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" ref={scrollRef} aria-live="polite">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <MessageCircle className="size-6" />
              </span>
              <p className="mt-4 font-display text-lg font-bold">Start the conversation</p>
              <p className="mt-1 max-w-xs text-sm text-slate-600">Say hello and agree on a pickup time. Photos help too.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender.id === currentUser.id;
            const isAdmin = msg.sender.role === "admin";

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="mb-1 px-1 text-[11px] font-medium text-slate-500">
                  {isAdmin ? "Admin" : isMe ? "You" : msg.sender.name} ·{" "}
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "rounded-br-md bg-emerald-600 text-white"
                      : isAdmin
                      ? "rounded-bl-md bg-red-700 text-white"
                      : "rounded-bl-md bg-white text-ink ring-1 ring-ink/10"
                  }`}
                >
                  {msg.image_url && (
                    <img
                      src={`http://localhost:5000${msg.image_url}`}
                      alt="Attached"
                      className={`max-h-48 rounded-xl object-cover ${msg.text ? "mb-2" : ""}`}
                    />
                  )}
                  {msg.text && <p className="text-[15px] leading-snug">{msg.text}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-ink/10 bg-white px-4 py-3">
          {error && (
            <p role="alert" className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              <AlertTriangle className="size-3.5 shrink-0" /> {error}
            </p>
          )}
          {imageBase64 && (
            <div className="relative mb-2 inline-block">
              <img src={imageBase64} alt="Preview" className="h-20 rounded-xl object-cover ring-1 ring-ink/10" />
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                aria-label="Remove photo"
                className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white transition hover:bg-red-700"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-cream text-slate-600 transition hover:text-emerald-700 focus-within:outline focus-within:outline-2 focus-within:outline-emerald-600" aria-label="Attach photo">
              <ImagePlus className="size-5" />
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
            </label>
            <input
              type="text"
              placeholder="Type a message…"
              aria-label="Message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-w-0 flex-1 rounded-full bg-cream px-5 py-3 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={(!text.trim() && !imageBase64) || sending}
              aria-label="Send message"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
