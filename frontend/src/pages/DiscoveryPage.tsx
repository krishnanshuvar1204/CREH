import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Package,
  Search,
  Star,
  MapPin,
  X,
  Wrench,
  Tent,
  Bike,
  ChefHat,
  Camera,
  Sprout,
  Gift,
  Clock,
  Lock,
  ShieldCheck,
  Check,
  List,
  Map as MapIcon,
  SearchX,
  Loader2,
  LocateFixed,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../lib/api";
import { withMockFallback } from "../mocks/withMockFallback";
import { mockResources } from "../mocks/fixtures";
import DemoBadge from "../components/DemoBadge";
import { useAuthStore } from "../stores/authStore";

import { CATEGORIES, categoryLabel, imageSrc } from "../lib/resourceMeta";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const categoryIcons: Record<string, any> = {
  tools: Wrench,
  outdoors: Tent,
  camping: Tent,
  sports: Bike,
  bikes: Bike,
  kitchen: ChefHat,
  photo: Camera,
  garden: Sprout,
};

const iconFor = (category?: string) => {
  const key = Object.keys(categoryIcons).find((k) => category?.toLowerCase().includes(k));
  return key ? categoryIcons[key] : Package;
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

type RequestStatus = "idle" | "sending" | "sent" | "error";

export default function DiscoveryPage() {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12,
  });

  const user = useAuthStore((st) => st.user);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(15);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [requestMessage, setRequestMessage] = useState("");

  // Ask for location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setViewState((prev) => ({
          ...prev,
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          zoom: 13,
        }));
      });
    }
  }, []);

  // Close the detail panel with Escape
  useEffect(() => {
    if (!selectedResource) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDetail();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedResource]);

  const { data: result, isLoading } = useQuery({
    queryKey: ["resources", viewState.latitude, viewState.longitude, radiusKm],
    queryFn: () =>
      withMockFallback(
        async () =>
          (await api.get("/resources/nearby", { params: { lat: viewState.latitude, lng: viewState.longitude, radiusKm } }))
            .data as any[],
        mockResources,
        { fallbackOnEmpty: true }
      ),
  });
  const resources: any[] = useMemo(() => result?.data ?? [], [result]);
  const isMock = result?.isMock ?? false;

  const categories = useMemo(() => [{ value: "All", label: "All" }, ...CATEGORIES], []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .map((r: any) => {
        const c = r.location?.coordinates;
        const km = c ? distanceKm(viewState.latitude, viewState.longitude, c[1], c[0]) : null;
        return { ...r, _km: km };
      })
      .filter((r: any) => {
        if (category !== "All" && r.category !== category) return false;
        if (freeOnly && !r.is_donation) return false;
        if (q && !`${r.title} ${r.description} ${categoryLabel(r.category)}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a: any, b: any) => (a._km ?? 1e9) - (b._km ?? 1e9));
  }, [resources, query, category, freeOnly, viewState.latitude, viewState.longitude]);

  function openDetail(resource: any) {
    setSelectedResource(resource);
    setRequestStatus("idle");
    setRequestMessage("");
  }

  function closeDetail() {
    setSelectedResource(null);
  }

  async function sendRequest() {
    if (!user) {
      setRequestStatus("error");
      setRequestMessage("Please log in to send a request.");
      return;
    }
    setRequestStatus("sending");
    try {
      await api.post("/requests", {
        resourceId: selectedResource.id,
        security_deposit_amount: 50.0,
      });
      setRequestStatus("sent");
      setRequestMessage("Request sent. Check your dashboard to pay the deposit once it’s accepted.");
    } catch (e: any) {
      setRequestStatus("error");
      setRequestMessage(apiError(e, "We couldn’t send your request. Please try again."));
    }
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem-1px)] flex-1 flex-col bg-cream text-ink lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`z-10 min-h-0 w-full flex-1 flex-col border-ink/10 bg-cream lg:flex lg:w-[26rem] lg:flex-none lg:border-r xl:w-[28rem] ${
          mobileView === "list" ? "flex" : "hidden"
        }`}
      >
        <div className="space-y-4 border-b border-ink/10 p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Discover nearby</h1>
              {isMock && <DemoBadge />}
            </div>
            <p className="mt-1 text-sm text-slate-600" aria-live="polite">
              {isLoading ? "Looking around…" : `${visible.length} ${visible.length === 1 ? "item" : "items"} within ${radiusKm} km`}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-emerald-700" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you need?"
              aria-label="Search items"
              className="w-full rounded-full bg-white py-3.5 pl-12 pr-4 text-[15px] ring-1 ring-ink/10 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                aria-pressed={category === c.value}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === c.value ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10 hover:ring-emerald-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="radius" className="flex items-center gap-1.5 text-sm font-semibold">
                <LocateFixed className="size-4 text-emerald-600" /> Search radius
              </label>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-800">{radiusKm} km</span>
            </div>
            <input
              id="radius"
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <label className="mt-3 flex cursor-pointer items-center justify-between border-t border-ink/5 pt-3 text-sm font-semibold">
              <span className="flex items-center gap-1.5"><Gift className="size-4 text-emerald-600" /> Free items only</span>
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="size-4 accent-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                <div className="size-16 rounded-xl bg-emerald-100" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-6 py-12 text-center">
              <SearchX className="mx-auto size-9 text-emerald-700" />
              <p className="mt-4 font-display text-lg font-bold">Nothing matches yet</p>
              <p className="mt-1 text-sm text-slate-600">Try a wider radius or clear your filters.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setFreeOnly(false);
                  setRadiusKm(50);
                }}
                className="mt-5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Reset filters
              </button>
            </div>
          ) : (
            visible.map((resource: any) => {
              const Icon = iconFor(resource.category);
              const active = hoveredId === resource.id;
              return (
                <button
                  key={resource.id}
                  onClick={() => openDetail(resource)}
                  onMouseEnter={() => setHoveredId(resource.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(resource.id)}
                  onBlur={() => setHoveredId(null)}
                  className={`group flex w-full gap-4 rounded-2xl bg-white p-4 text-left ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgba(11,42,34,0.35)] ${
                    active ? "ring-2 ring-emerald-600" : "ring-ink/10"
                  }`}
                >
                  <span
                    className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-emerald-100 text-emerald-700 bg-cover bg-center"
                    style={resource.image_urls?.[0] ? { backgroundImage: `url(${imageSrc(resource.image_urls[0])})` } : undefined}
                  >
                    {!resource.image_urls?.[0] && <Icon className="size-7" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-display text-lg font-bold leading-tight">{resource.title}</span>
                      {resource._km !== null && (
                        <span className="shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-slate-500">{formatDistance(resource._km)}</span>
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-snug text-slate-600">{resource.description}</span>
                    <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
                          resource.is_donation ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {resource.is_donation ? <Gift className="size-3.5" /> : <Clock className="size-3.5" />}
                        {resource.is_donation ? "Free" : `${resource.lending_duration_days} days`}
                      </span>
                      <span className="text-slate-500">{categoryLabel(resource.category)}</span>
                      {resource.owner && (
                        <span className="ml-auto flex items-center gap-1 text-amber-700">
                          <Star className="size-3.5 fill-current" /> {resource.owner.reputation}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Map */}
      <div className={`relative min-h-0 flex-1 ${mobileView === "map" ? "block" : "hidden"} lg:block`}>
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />

          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <span className="relative grid size-5 place-items-center">
                <span className="ping-soft absolute inset-0 rounded-full bg-sky-500" />
                <span className="relative size-4 rounded-full border-2 border-white bg-sky-500 shadow-lg" />
              </span>
            </Marker>
          )}

          {visible.map((res: any) => {
            if (!res.location || !res.location.coordinates) return null;
            const [lng, lat] = res.location.coordinates;
            const Icon = iconFor(res.category);
            const active = hoveredId === res.id || selectedResource?.id === res.id;
            return (
              <Marker key={res.id} longitude={lng} latitude={lat} style={{ zIndex: active ? 10 : 1 }}>
                <button
                  onClick={() => openDetail(res)}
                  onMouseEnter={() => setHoveredId(res.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  aria-label={`View ${res.title}`}
                  className={`flex items-center gap-1.5 rounded-full border-2 border-white py-1.5 pl-2 pr-3 text-xs font-bold shadow-[0_8px_18px_-6px_rgba(11,42,34,0.5)] transition duration-300 ${
                    active ? "scale-110 bg-ink text-white" : "bg-emerald-600 text-white hover:scale-105"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="max-w-28 truncate">{res.is_donation ? "Free" : res.title}</span>
                </button>
              </Marker>
            );
          })}
        </Map>
      </div>

      {/* Mobile list/map toggle */}
      <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 lg:hidden">
        <button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(11,42,34,0.6)]"
        >
          {mobileView === "list" ? <MapIcon className="size-4" /> : <List className="size-4" />}
          {mobileView === "list" ? "Show map" : "Show list"}
        </button>
      </div>

      {/* Detail dialog */}
      {selectedResource && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedResource.title}
            onClick={(e) => e.stopPropagation()}
            className="rise flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-[0_40px_80px_-20px_rgba(11,42,34,0.6)] sm:rounded-[2rem]"
          >
            <div
              className="relative flex h-44 shrink-0 items-end bg-emerald-600 bg-cover bg-center p-6 sm:h-52"
              style={
                selectedResource.image_urls?.[0]
                  ? { backgroundImage: `url(${imageSrc(selectedResource.image_urls[0])})` }
                  : undefined
              }
            >
              {selectedResource.image_urls?.[0] ? (
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              ) : (
                <>
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
                      backgroundSize: "36px 36px",
                    }}
                  />
                  {(() => {
                    const Icon = iconFor(selectedResource.category);
                    return <Icon className="absolute right-8 top-8 size-20 text-white/25" />;
                  })()}
                </>
              )}
              <button
                onClick={closeDetail}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-ink/40 text-white backdrop-blur transition hover:bg-ink/70"
              >
                <X className="size-5" />
              </button>
              <div className="relative z-10">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-900">{categoryLabel(selectedResource.category)}</span>
                <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-white">{selectedResource.title}</h2>
              </div>
            </div>

            <div className="space-y-5 overflow-y-auto p-6 sm:p-7">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                  <p className="text-xs font-semibold text-slate-500">Shared by</p>
                  <p className="mt-1 font-bold">{selectedResource.owner?.name || "Community member"}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-amber-700">
                    <Star className="size-3.5 fill-current" /> {selectedResource.owner?.reputation || 5.0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                  <p className="text-xs font-semibold text-slate-500">Terms</p>
                  <p className="mt-1 font-bold">
                    {selectedResource.is_donation ? "Free to keep" : `${selectedResource.lending_duration_days} days`}
                  </p>
                  {selectedResource._km !== null && selectedResource._km !== undefined && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <MapPin className="size-3.5" /> {formatDistance(selectedResource._km)} away
                    </p>
                  )}
                </div>
              </div>

              <p className="leading-relaxed text-slate-700">{selectedResource.description}</p>

              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-900/10">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                  <Lock className="size-4" />
                </span>
                <div>
                  <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-emerald-950">
                    Deposit held in escrow <ShieldCheck className="size-4 text-emerald-700" />
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-emerald-900/80">
                    A mock $50 deposit is held to ensure a safe return and fully refunded when the owner confirms receipt.
                  </p>
                </div>
              </div>

              {requestMessage && (
                <p
                  role="status"
                  className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                    requestStatus === "sent" ? "bg-emerald-100 text-emerald-900" : "bg-red-50 text-red-800"
                  }`}
                >
                  {requestStatus === "sent" && <Check className="mt-0.5 size-4 shrink-0" />}
                  <span>
                    {requestMessage}{" "}
                    {requestStatus === "error" && !user && (
                      <Link to="/auth" className="underline underline-offset-2">Log in</Link>
                    )}
                    {requestStatus === "sent" && (
                      <Link to="/profile" className="underline underline-offset-2">Open dashboard</Link>
                    )}
                  </span>
                </p>
              )}

              <button
                onClick={sendRequest}
                disabled={requestStatus === "sending" || requestStatus === "sent"}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 font-bold text-white shadow-[0_14px_28px_-12px_rgba(5,150,105,0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
              >
                {requestStatus === "sending" && <Loader2 className="size-5 animate-spin" />}
                {requestStatus === "sent" ? "Request sent" : requestStatus === "sending" ? "Sending…" : "Request this item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
