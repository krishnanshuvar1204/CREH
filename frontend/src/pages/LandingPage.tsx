import { Link } from "react-router-dom";
import {
  Map,
  ShieldCheck,
  HeartHandshake,
  PackageOpen,
  ArrowRight,
  Search,
  CalendarCheck,
  Repeat,
  MessageCircle,
  Wrench,
  Tent,
  Bike,
  ChefHat,
  Camera,
  Sprout,
  Lock,
  MapPin,
  Check,
} from "lucide-react";

const categories = [
  { icon: Wrench, label: "Tools" },
  { icon: Tent, label: "Camping" },
  { icon: Bike, label: "Bikes & Sports" },
  { icon: ChefHat, label: "Kitchen" },
  { icon: Camera, label: "Photo & Video" },
  { icon: Sprout, label: "Garden" },
];

const steps = [
  {
    icon: Search,
    title: "Find it nearby",
    text: "Search by what you need and how far you’re willing to walk. Everything is a neighbor away.",
  },
  {
    icon: CalendarCheck,
    title: "Request your dates",
    text: "Pick a pickup window, send a request, and the owner confirms in a tap.",
  },
  {
    icon: Repeat,
    title: "Return and release",
    text: "Hand it back in the same shape. Your deposit is released the moment it’s confirmed.",
  },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] aspect-[5/5.2] rise [animation-delay:200ms]">
      {/* map panel */}
      <div className="absolute inset-0 rounded-[2rem] bg-emerald-100 overflow-hidden ring-1 ring-emerald-900/10 shadow-[0_30px_60px_-20px_rgba(6,78,59,0.35)]">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(5,150,105,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,.14) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 416" fill="none" aria-hidden="true">
          <path d="M-10 300 C 90 250, 140 330, 230 270 S 360 190, 420 230" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
          <path d="M120 -10 C 150 90, 90 150, 160 230 S 210 380, 190 430" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
          <circle cx="200" cy="208" r="120" stroke="#059669" strokeOpacity=".35" strokeDasharray="5 7" />
          <circle cx="200" cy="208" r="70" fill="#10b981" fillOpacity=".12" />
        </svg>

        {/* pins */}
        {[
          ["22%", "28%"],
          ["70%", "22%"],
          ["78%", "62%"],
          ["28%", "72%"],
        ].map(([l, t]) => (
          <span key={l + t} className="absolute size-3 rounded-full bg-emerald-600 ring-4 ring-white" style={{ left: l, top: t }} />
        ))}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="ping-soft absolute inset-0 rounded-full bg-emerald-500" />
          <span className="relative grid size-11 place-items-center rounded-full bg-emerald-600 text-white ring-4 ring-white">
            <MapPin className="size-5" />
          </span>
        </span>
      </div>

      {/* floating listing */}
      <div className="float absolute -left-3 sm:-left-8 top-[10%] w-56 rounded-2xl bg-white p-3.5 shadow-[0_18px_40px_-12px_rgba(11,42,34,0.3)] ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Wrench className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">Cordless drill set</p>
            <p className="text-xs text-slate-500">0.4 km · Free to borrow</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Available today</span>
          <span className="font-semibold text-ink">Request →</span>
        </div>
      </div>

      {/* escrow chip */}
      <div className="float absolute -right-2 sm:-right-6 bottom-[22%] w-60 rounded-2xl bg-ink p-4 text-white shadow-[0_18px_40px_-12px_rgba(11,42,34,0.5)] [animation-delay:-3s]">
        <div className="flex items-center gap-2 text-emerald-300">
          <Lock className="size-4" />
          <span className="text-xs font-semibold">Deposit held in escrow</span>
        </div>
        <p className="mt-1.5 font-display text-2xl font-bold">$40.00</p>
        <p className="text-xs text-emerald-100/70">Released when the item comes back</p>
      </div>

      {/* chat bubble */}
      <div className="absolute left-[8%] bottom-[6%] flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 text-xs shadow-[0_12px_30px_-10px_rgba(11,42,34,0.3)] ring-1 ring-black/5">
        <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
          <MessageCircle className="size-3.5" />
        </span>
        <span className="font-medium text-ink">“Pickup at 6pm works!”</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-cream text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[38rem] rounded-full bg-emerald-200/50 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-900/10">
              <HeartHandshake className="size-4" /> Community Resource Exchange Hub
            </p>
            <h1 className="rise mt-6 text-[clamp(2.75rem,6.5vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em] [animation-delay:80ms]">
              Share more.
              <br />
              Buy less.
              <span className="mt-2 block text-emerald-600">Know your street.</span>
            </h1>
            <p className="rise mt-7 max-w-[34rem] text-lg leading-relaxed text-slate-600 [animation-delay:160ms]">
              Lend, borrow, and share everyday things with the people who live around you. Deposits are protected, pickups are a short walk, and the drill you need is probably two doors down.
            </p>
            <div className="rise mt-9 flex flex-wrap items-center gap-4 [animation-delay:240ms]">
              <Link
                to="/discover"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-bold text-white shadow-[0_12px_24px_-10px_rgba(5,150,105,0.7)] transition duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
              >
                Explore local items
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/auth"
                className="rounded-full px-6 py-4 text-base font-bold text-ink ring-1 ring-ink/15 transition hover:bg-white"
              >
                List something
              </Link>
            </div>
            <ul className="rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600 [animation-delay:320ms]">
              {["Free to join", "Deposits protected", "Neighbors only"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>

        {/* categories strip */}
        <div className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                to="/discover"
                className="flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-semibold ring-1 ring-ink/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white hover:ring-emerald-600"
              >
                <Icon className="size-4.5" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
          Everything a neighborhood needs to trust each other.
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-6 lg:grid-rows-2">
          {/* location */}
          <article className="relative overflow-hidden rounded-[1.75rem] bg-emerald-600 p-8 text-white lg:col-span-3 lg:row-span-2 lg:p-10">
            <Map className="size-9 text-emerald-200" />
            <h3 className="mt-6 text-3xl font-bold tracking-tight">Hyper-local by design</h3>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-emerald-50/85">
              Set your radius and see only what’s nearby. Shorter trips, friendlier handoffs, and a lot less stuff sitting unused.
            </p>
            <div className="relative mt-10 grid aspect-[16/9] place-items-center" aria-hidden="true">
              {[100, 72, 44].map((s, i) => (
                <span
                  key={s}
                  className="absolute rounded-full border border-white/30"
                  style={{ width: `${s}%`, aspectRatio: "1", opacity: 1 - i * 0.2 }}
                />
              ))}
              <span className="relative grid size-12 place-items-center rounded-full bg-white text-emerald-700 shadow-lg">
                <MapPin className="size-6" />
              </span>
              <span className="absolute left-[18%] top-[30%] rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800">Ladder · 300 m</span>
              <span className="absolute right-[14%] bottom-[24%] rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800">Tent · 1.2 km</span>
            </div>
          </article>

          {/* escrow */}
          <article className="rounded-[1.75rem] bg-white p-8 ring-1 ring-ink/10 lg:col-span-3">
            <div className="flex items-start justify-between gap-6">
              <div>
                <ShieldCheck className="size-9 text-emerald-600" />
                <h3 className="mt-5 text-2xl font-bold tracking-tight">Escrow that actually protects</h3>
                <p className="mt-2 max-w-sm leading-relaxed text-slate-600">
                  Deposits are held safely and released the moment the item is returned.
                </p>
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-emerald-50 p-4 sm:block">
                <ol className="space-y-2.5 text-xs font-semibold text-emerald-900">
                  {["Deposit held", "Item in use", "Returned", "Deposit released"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className={`grid size-5 place-items-center rounded-full text-[10px] ${i === 3 ? "bg-emerald-600 text-white" : "bg-white ring-1 ring-emerald-300"}`}>
                        {i === 3 ? <Check className="size-3" /> : i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>

          {/* sharing */}
          <article className="rounded-[1.75rem] bg-amber-100 p-8 lg:col-span-2">
            <PackageOpen className="size-9 text-amber-700" />
            <h3 className="mt-5 text-2xl font-bold tracking-tight">List in seconds</h3>
            <p className="mt-2 leading-relaxed text-amber-950/75">
              Snap a photo, set your terms, and let the dust-gatherers earn their keep.
            </p>
          </article>

          {/* chat */}
          <article className="rounded-[1.75rem] bg-ink p-8 text-white lg:col-span-1 lg:p-6">
            <MessageCircle className="size-8 text-emerald-300" />
            <h3 className="mt-5 text-xl font-bold tracking-tight">Chat built in</h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/70">Coordinate pickup without sharing your number.</p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
              Borrowing, in three easy moves.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">
              No haggling, no awkward IOUs. Just a clear path from “I need one” to “thanks, neighbor.”
            </p>
          </div>
          <ol className="space-y-5">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="group flex gap-6 rounded-[1.75rem] bg-cream p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(11,42,34,0.25)]"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white transition group-hover:rotate-[-6deg]">
                  <Icon className="size-6" />
                </span>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                  <p className="mt-1.5 max-w-lg leading-relaxed text-slate-600">{text}</p>
                </div>
                <span className="ml-auto hidden self-start font-display text-5xl font-extrabold text-emerald-600/15 sm:block" aria-hidden="true">
                  {i + 1}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-ink px-8 py-16 text-center text-white sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-emerald-500/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
          <h2 className="relative mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-6xl">
            Your neighbors already own what you need.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-emerald-50/75">
            Join for free, browse what’s around you, or put your own idle things to good use.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-4">
            <Link
              to="/discover"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-4 font-bold text-ink transition duration-300 hover:bg-emerald-300 hover:-translate-y-0.5"
            >
              Start exploring
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to="/auth" className="rounded-full px-7 py-4 font-bold text-white ring-1 ring-white/25 transition hover:bg-white/10">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8">
          <span className="flex items-center gap-2 font-display font-bold text-emerald-700">
            <HeartHandshake className="size-5" /> CREH
          </span>
          <span>Share more. Buy less. Built for neighborhoods.</span>
        </div>
      </footer>
    </div>
  );
}
