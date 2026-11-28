import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Map, { Marker, NavigationControl, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertTriangle, Crosshair, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { api, apiError } from "../lib/api";
import { CATEGORIES, MAX_IMAGES, RADII_M, imageSrc, radiusLabel } from "../lib/resourceMeta";
import type { Resource, ResourceCategory, ResourceType } from "../types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-ink/15 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600";

interface PendingImage {
  file: File;
  preview: string;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Uploads one photo: signed direct-to-CDN when the server offers it, otherwise base64 via the API.
async function uploadImage(resourceId: number, file: File) {
  const { data: ticket } = await api.post(`/resources/${resourceId}/images/sign`);
  if (ticket.provider === "cloudinary") {
    const form = new FormData();
    Object.entries(ticket.fields as Record<string, string | number>).forEach(([k, v]) => form.append(k, String(v)));
    form.append("file", file);
    const { data } = await axios.post(ticket.uploadUrl, form); // straight to the CDN, no auth header
    await api.post(`/resources/${resourceId}/images`, { url: data.secure_url });
  } else {
    await api.post(`/resources/${resourceId}/images`, { imageBase64: await readAsDataUrl(file) });
  }
}

interface Props {
  resource?: Resource; // present => edit mode
  onClose: () => void;
  onSaved: (message: string, ok?: boolean) => void;
}

export default function ResourceFormModal({ resource, onClose, onSaved }: Props) {
  const editing = !!resource;
  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? "tools");
  const [type, setType] = useState<ResourceType>(resource?.resource_type ?? "LOAN");
  const [radius, setRadius] = useState<number>(resource?.sharing_radius_m ?? 2000);
  const [duration, setDuration] = useState<number>(resource?.lending_duration_days ?? 3);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    resource ? { lat: resource.location.coordinates[1], lng: resource.location.coordinates[0] } : null
  );
  const [existing, setExisting] = useState<string[]>(resource?.image_urls ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // New listing: start the pin at the browser location when allowed.
  useEffect(() => {
    if (editing || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPin((cur) => cur ?? { lat: p.coords.latitude, lng: p.coords.longitude }),
      () => undefined
    );
  }, [editing]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation isn’t supported by your browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPin({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Couldn’t read your location. Drop a pin on the map instead.");
      }
    );
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = MAX_IMAGES - existing.length - pending.length;
    setPending((cur) => [...cur, ...files.slice(0, Math.max(room, 0)).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    if (files.length > room) setError(`You can add up to ${MAX_IMAGES} photos.`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pin) return setError("Choose where the item is: use your location or drop a pin on the map.");

    setSaving(true);
    try {
      const body = {
        title,
        description,
        category,
        resource_type: type,
        sharing_radius_m: radius,
        lending_duration_days: type === "LOAN" ? duration : null,
        location: pin,
      };
      let id: number;
      if (editing) {
        id = resource.id;
        await api.patch(`/resources/${id}`, body);
      } else {
        const { data } = await api.post("/resources", { ...body, lending_duration_days: body.lending_duration_days ?? undefined });
        id = data.id;
      }

      let failed = 0;
      for (const url of removed) await api.delete(`/resources/${id}/images`, { data: { url } }).catch(() => failed++);
      for (const img of pending) await uploadImage(id, img.file).catch(() => failed++);

      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      if (failed > 0) onSaved(`Saved, but ${failed} photo change${failed === 1 ? "" : "s"} failed. Edit the item to retry.`, false);
      else onSaved(editing ? "Your changes are saved." : "Your item is live for the community.");
    } catch (err) {
      setError(apiError(err, "We couldn’t save your item. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const photoCount = existing.length + pending.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit item" : "Share a new item"}
        onClick={(e) => e.stopPropagation()}
        className="rise flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)] sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-7 py-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{editing ? "Edit item" : "Share an item"}</h2>
            <p className="text-sm text-slate-600">Neighbors within your sharing radius will see it.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-ink/5">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 overflow-y-auto p-7">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold">Title</label>
            <input id="title" required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cordless power drill" className={inputCls} />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">Description</label>
            <textarea id="description" required maxLength={2000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, what’s included…" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-semibold">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-semibold">Type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as ResourceType)} className={inputCls}>
                <option value="LOAN">Lend for borrowing</option>
                <option value="DONATION">Permanent donation</option>
              </select>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold">Sharing radius</span>
            <div role="radiogroup" aria-label="Sharing radius" className="grid grid-cols-4 gap-2">
              {RADII_M.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={radius === m}
                  onClick={() => setRadius(m)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${radius === m ? "bg-ink text-white" : "bg-white ring-1 ring-ink/15 hover:ring-emerald-600"}`}
                >
                  {radiusLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {type === "LOAN" && (
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-sm font-semibold">Lending duration (days)</label>
              <input id="duration" type="number" min={1} max={365} required value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold">Where is it?</span>
              <button type="button" onClick={useMyLocation} disabled={locating} className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-ink/10">
                {locating ? <Loader2 className="size-3.5 animate-spin" /> : <Crosshair className="size-3.5" />} Use my location
              </button>
            </div>
            {MAPBOX_TOKEN ? (
              <div className="h-56 overflow-hidden rounded-xl ring-1 ring-ink/10">
                <Map
                  key={pin ? "pinned" : "empty"}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{ latitude: pin?.lat ?? 37.78, longitude: pin?.lng ?? -122.41, zoom: pin ? 14 : 3 }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  onClick={(e: MapMouseEvent) => setPin({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                >
                  <NavigationControl position="top-right" />
                  {pin && (
                    <Marker latitude={pin.lat} longitude={pin.lng} draggable onDragEnd={(e) => setPin({ lat: e.lngLat.lat, lng: e.lngLat.lng })}>
                      <MapPin className="size-9 -translate-y-3 fill-emerald-600 text-white drop-shadow" />
                    </Marker>
                  )}
                </Map>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Map unavailable (no Mapbox token). Use “Use my location”.</p>
            )}
            {pin && <p className="mt-1.5 text-xs text-slate-500">Pin at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold">Photos <span className="font-normal text-slate-500">({photoCount}/{MAX_IMAGES})</span></span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {existing.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-emerald-100">
                  <img src={imageSrc(url)} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => {
                      setExisting((l) => l.filter((u) => u !== url));
                      setRemoved((l) => [...l, url]);
                    }}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/70 text-white hover:bg-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {pending.map((p) => (
                <div key={p.preview} className="relative aspect-square overflow-hidden rounded-xl bg-emerald-100">
                  <img src={p.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => {
                      URL.revokeObjectURL(p.preview);
                      setPending((l) => l.filter((x) => x !== p));
                    }}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/70 text-white hover:bg-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {photoCount < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-xl border border-dashed border-ink/25 bg-white text-slate-500 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                    <ImagePlus className="size-5" /> Add
                  </span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={addFiles} className="sr-only" />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 font-bold text-white shadow-[0_14px_28px_-12px_rgba(5,150,105,0.8)] transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-5 animate-spin" />}
            {saving ? "Saving…" : editing ? "Save changes" : "List item for the community"}
          </button>
        </form>
      </div>
    </div>
  );
}
