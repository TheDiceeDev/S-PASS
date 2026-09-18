import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Ticket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getStoredEvents, type AppEvent } from '../services/eventService';

export default function EventPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<AppEvent | null>(null);

  useEffect(() => {
    const list = getStoredEvents();
    const feat = list.find((e) => e.featured) || list[0] || null;
    setFeatured(feat);
  }, []);

  if (!featured) return null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-5 sm:py-8">
      {/* Page heading */}
      <div className="min-w-0">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          Spotlight Experience
        </h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">
          Explore upcoming verified events powered by Avalanche Fuji smart
          contracts.
        </p>
      </div>

      {/* Featured event */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-sm sm:rounded-3xl">
        {/* Hero image */}
        <div className="relative min-h-[250px] bg-gradient-to-br from-red-950 via-zinc-950 to-black sm:aspect-[21/9] sm:min-h-[260px]">
          <img
            src={featured.image}
            alt={featured.title}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#e60012]/50 bg-[#e60012]/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#ff6666] sm:px-3 sm:text-xs">
              <Sparkles size={12} className="shrink-0 sm:h-[13px] sm:w-[13px]" />
              <span className="truncate">Featured Spotlight</span>
            </span>

            <h2 className="mt-2 break-words text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
              {featured.title}
            </h2>
          </div>
        </div>

        {/* Event content */}
        <div className="grid gap-5 p-4 sm:gap-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Description + event info */}
          <div className="min-w-0 space-y-4">
            <p className="break-words text-xs leading-relaxed text-white/70 sm:text-sm">
              {featured.description}
            </p>

            <div className="flex flex-col gap-3 text-xs font-semibold text-white/60 sm:flex-row sm:flex-wrap sm:gap-4">
              <div className="flex min-w-0 items-start gap-2">
                <CalendarDays
                  size={15}
                  className="mt-0.5 shrink-0 text-[#e60012]"
                />
                <span className="break-words">{featured.date}</span>
              </div>

              <div className="flex min-w-0 items-start gap-2">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-[#e60012]"
                />
                <span className="break-words">{featured.location}</span>
              </div>
            </div>

            {/* Deposit notice */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-xs font-semibold leading-relaxed text-emerald-300 sm:p-4 sm:text-sm">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-400"
              />
              <span>
                Deposit Required: {featured.price} — 100% refundable upon
                entrance check-in.
              </span>
            </div>
          </div>

          {/* How S-PASS works */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              How S-PASS Works
            </h3>

            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-white/60">
              {[
                'Connect your Avalanche Core / Web3 wallet',
                'Stake refundable deposit into Fuji smart contract',
                'Receive scannable QR ticket in your passbook',
                'Deposit instantly returned when door scanner checks you in',
                'No-show forfeiture pool distributed to attendees & organizer',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e60012]/20 text-[11px] font-bold text-[#ff6666]">
                    {i + 1}
                  </span>

                  <span className="min-w-0 break-words">{step}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate(`/event/${featured.id}`)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e60012] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(230,0,18,0.4)] transition hover:bg-red-700 active:scale-[0.99] sm:mt-4 sm:px-5"
            >
              <Ticket size={15} className="shrink-0" />
              <span>View Event &amp; Stake Deposit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}