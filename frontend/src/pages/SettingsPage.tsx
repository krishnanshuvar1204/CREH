import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Map, { Marker, NavigationControl, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertTriangle, Camera, CheckCircle2, Crosshair, Loader2, MapPin, Search, ShieldCheck } from "lucide-react";
import { api, apiError } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { withMockFallback } from "../mocks/withMockFallback";
import { mockProfile } from "../mocks/profile";
import DemoBadge from "../components/DemoBadge";
import VerifiedBadge from "../components/VerifiedBadge";
import type { UserProfile } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-ink/15 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

type Toast = { text: string; tone: "ok" | "err" } | null;

export default function SettingsPage() {
  const user = useAuthStore((st) => st.user);
  const updateUser = useAuthStore((st) => st.updateUser);
  const [params] = useSearchParams();
  const welcome = params.get("welcome") === "1";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  // Profile form
  const [form, setForm] = useState({ name: "", phone: "", address: "", bio: "" });
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Location
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState("");
  const [locBusy, setLocBusy] = useState(false);

  // Community verification
  const [note, setNote] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const applyProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    setForm({ name: p.name, phone: p.phone ?? "", address: p.address ?? "", bio: p.bio ?? "" });
    setPin(p.home_location);
  }, []);

  useEffect(() => {
    if (!user) return;
    withMockFallback(
      async () => (await api.get("/users/me")).data as UserProfile,
      () => mockProfile(user)
    )
      .then((res) => {
        applyProfile(res.data);
        setIsMock(res.isMock);
      })
      .catch((e) => setToast({ text: apiError(e, "Couldn’t load your profile."), tone: "err" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const sync = (p: UserProfile) => {
    applyProfile(p);
    updateUser({ name: p.name, avatar_url: p.avatar_url, verification_status: p.verification_status });
  };

  if (!user) {
    return (
      <div className="mx-auto my-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Sign in to edit your profile</h1>
        <Link to="/auth" className="mt-8 inline-block rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700">
          Log in or sign up
        </Link>
      </div>
    );
  }
  if (loading || !profile) {
    return <div className="grid flex-1 place-items-center py-24"><Loader2 className="size-8 animate-spin text-emerald-600" /></div>;
  }

  const unverified = profile.verification_status === "unverified";
  const avatarSrc = avatarData ?? (profile.avatar_url ? `${(import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, "")}${profile.avatar_url}` : null);

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) return setToast({ text: "Image too large (max 5 MB).", tone: "err" });
    setAvatarData(await toDataUrl(file));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/users/me", {
        name: form.name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        ...(avatarData ? { avatarBase64: avatarData } : {}),
      });
      sync(res.data);
      setAvatarData(null);
      setToast({ text: "Profile saved.", tone: "ok" });
    } catch (err: any) {
      const detail = err?.response?.data?.details?.[0]?.message;
      setToast({ text: detail || apiError(err, "Couldn’t save your profile."), tone: "err" });
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = async () => {
    try {
      sync((await api.patch("/users/me", { removeAvatar: true })).data);
      setAvatarData(null);
    } catch (err) {
      setToast({ text: apiError(err, "Couldn’t remove the photo."), tone: "err" });
    }
  };

  const saveLocation = async (body: { lat: number; lng: number } | { query: string }) => {
    setLocBusy(true);
    try {
      const res = await api.put("/users/me/location", body);
      sync(res.data);
      setSearch("");
      setToast({ text: "Home location saved.", tone: "ok" });
    } catch (err) {
      setToast({ text: apiError(err, "Couldn’t save your location."), tone: "err" });
    } finally {
      setLocBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setToast({ text: "Your browser can’t share its location.", tone: "err" });
    navigator.geolocation.getCurrentPosition(
      (p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setToast({ text: "Location permission was denied. Drop a pin or search instead.", tone: "err" })
    );
  };

  const submitCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyBusy(true);
    try {
      sync((await api.post("/users/me/verify-community", { note })).data);
      setNote("");
      setToast({ text: "Submitted. We’ll review your request.", tone: "ok" });
    } catch (err: any) {
      const detail = err?.response?.data?.details?.[0]?.message;
      setToast({ text: detail || apiError(err, "Couldn’t submit your request."), tone: "err" });
    } finally {
      setVerifyBusy(false);
    }
  };

  const savedPin = profile.home_location;
  const pinChanged = !!pin && (!savedPin || pin.lat !== savedPin.lat || pin.lng !== savedPin.lng);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Your profile</h1>
        <VerifiedBadge status={profile.verification_status} />
        {isMock && <DemoBadge />}
      </div>

      {welcome && !unverified && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          You’re verified! Set your home location below so we can show you what’s nearby.
        </p>
      )}
      {unverified && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Your email isn’t verified yet. <Link to="/verify-email" className="underline">Enter your code</Link> to list items and send requests.
          </span>
        </p>
      )}
      {toast && (
        <p
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg ${
            toast.tone === "ok" ? "bg-emerald-700" : "bg-red-700"
          }`}
        >
          {toast.text}
        </p>
      )}

      {/* Profile details */}
      <form onSubmit={saveProfile} className="mt-8 space-y-5 rounded-2xl bg-white p-6 ring-1 ring-ink/10">
        <h2 className="text-lg font-extrabold">Details</h2>
        <div className="flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-2xl font-extrabold text-emerald-700">
            {avatarSrc ? <img src={avatarSrc} alt="" className="size-full object-cover" /> : profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2 text-sm font-bold hover:bg-ink/10">
              <Camera className="size-4" /> {avatarSrc ? "Change photo" : "Add photo"}
            </button>
            {(profile.avatar_url || avatarData) && (
              <button type="button" onClick={avatarData ? () => setAvatarData(null) : removeAvatar} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-700">
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">Full name</label>
            <input id="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">Phone <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="phone" type="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label>
          <input id="email" disabled value={profile.email} className={`${inputCls} bg-slate-50 text-slate-500`} />
        </div>
        <div>
          <label htmlFor="address" className="mb-1.5 block text-sm font-semibold">Address <span className="font-normal text-slate-500">(only you see this)</span></label>
          <input id="address" maxLength={300} autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold">Bio</label>
          <textarea id="bio" rows={3} maxLength={500} placeholder="A line or two about you and what you like to share." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputCls} />
          <p className="mt-1 text-right text-xs text-slate-500">{form.bio.length}/500</p>
        </div>
        <button type="submit" disabled={saving || isMock} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
          {saving && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>
      </form>

      {/* Home location */}
      <section className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-ink/10">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><MapPin className="size-5 text-emerald-600" /> Home location</h2>
          <p className="mt-1 text-sm text-slate-600">
            {savedPin ? "Your searches start here. Move the pin and save to change it." : "Not set yet. Drop a pin, search for an address, or use your current location."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (search.trim().length >= 3) saveLocation({ query: search.trim() });
            }}
          >
            <input aria-label="Search an address" placeholder="Search an address…" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls} />
            <button type="submit" disabled={locBusy || search.trim().length < 3 || isMock} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
              <Search className="size-4" /> Find
            </button>
          </form>
          <button type="button" onClick={useMyLocation} className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2 text-sm font-bold hover:bg-ink/10">
            <Crosshair className="size-4" /> Use my location
          </button>
        </div>

        {MAPBOX_TOKEN ? (
          <div className="h-72 overflow-hidden rounded-xl ring-1 ring-ink/10">
            <Map
              key={savedPin ? "saved" : "empty"}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ latitude: pin?.lat ?? 37.78, longitude: pin?.lng ?? -122.41, zoom: pin ? 13 : 3 }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              onClick={(e: MapMouseEvent) => setPin({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
              <NavigationControl position="top-right" />
              {pin && (
                <Marker
                  latitude={pin.lat}
                  longitude={pin.lng}
                  draggable
                  onDragEnd={(e) => setPin({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                >
                  <MapPin className="size-9 -translate-y-3 fill-emerald-600 text-white drop-shadow" />
                </Marker>
              )}
            </Map>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Map unavailable (no Mapbox token configured). Use the search box or “Use my location”.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!pinChanged || locBusy || isMock}
            onClick={() => pin && saveLocation(pin)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {locBusy && <Loader2 className="size-4 animate-spin" />} Save location
          </button>
          {pin && <span className="text-xs text-slate-500">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>}
        </div>
      </section>

      {/* Community verification */}
      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink/10">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="size-5 text-emerald-600" /> Community verification</h2>
        {profile.verification_status === "community_verified" ? (
          <p className="mt-2 text-sm text-slate-600">You’re a verified neighbor. The badge shows on your listings and profile.</p>
        ) : profile.verification_status === "community_pending" ? (
          <p className="mt-2 text-sm text-slate-600">Your request is under review. We’ll update your badge once it’s approved.</p>
        ) : (
          <form onSubmit={submitCommunity} className="mt-2 space-y-3">
            <p className="text-sm text-slate-600">
              Earn a verified-neighbor badge so others know they can trust you. Tell us how the community can confirm you live nearby (e.g. a neighborhood group or building you belong to).
            </p>
            <textarea
              required
              rows={3}
              minLength={10}
              maxLength={1000}
              disabled={unverified || !savedPin}
              placeholder="e.g. I’m part of the Maple Street residents’ group…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
            />
            {(unverified || !savedPin) && (
              <p className="text-xs text-slate-500">{unverified ? "Verify your email first." : "Save your home location first."}</p>
            )}
            <button type="submit" disabled={verifyBusy || unverified || !savedPin || note.trim().length < 10 || isMock} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-50">
              {verifyBusy && <Loader2 className="size-4 animate-spin" />} Request verification
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
