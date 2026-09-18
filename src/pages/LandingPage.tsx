import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Ticket,
  Flame,
  MapPin,
  Clock,
  ShieldCheck,
  Coins,
  Search,
  Sparkles,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import {
  getStoredEvents,
  getProtocolStats,
  type AppEvent,
} from '../services/eventService';

const CATEGORY_ORDER = ['Concerts', 'Tech', 'Sports', 'Art', 'Food'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(getProtocolStats());

  useEffect(() => {
    setEvents(getStoredEvents());
    setStats(getProtocolStats());
  }, []);

  const topPicks = useMemo(() => {
    const featured = events.filter((e) => e.featured);
    return featured.length > 0 ? featured : events.slice(0, 4);
  }, [events]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || topPicks.length === 0) return;

      setIsTransitioning(true);
      setCurrentSlide(index);

      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning, topPicks.length],
  );

  const nextSlide = useCallback(
    () => goToSlide((currentSlide + 1) % (topPicks.length || 1)),
    [currentSlide, goToSlide, topPicks.length],
  );

  const prevSlide = useCallback(
    () =>
      goToSlide(
        (currentSlide - 1 + topPicks.length) %
          (topPicks.length || 1),
      ),
    [currentSlide, goToSlide, topPicks.length],
  );

  useEffect(() => {
    if (topPicks.length <= 1) return;

    const timer = setInterval(nextSlide, 6000);

    return () => clearInterval(timer);
  }, [nextSlide, topPicks.length]);

  const toggleLike = (id: number) => {
    setLiked((prev) => {
      const next = new Set(prev);

      next.has(id) ? next.delete(id) : next.add(id);

      return next;
    });
  };

  const [catIndex, setCatIndex] = useState(0);

  const categories = useMemo(() => {
    return CATEGORY_ORDER.map((name) => ({
      name,
      events: events.filter(
        (e) => e.category === name && !e.featured,
      ),
    }));
  }, [events]);

  const nextCat = () =>
    setCatIndex((i) => (i + 1) % categories.length);

  const prevCat = () =>
    setCatIndex(
      (i) => (i - 1 + categories.length) % categories.length,
    );

  const currentCategory = categories[catIndex] || {
    name: 'Events',
    events: [],
  };

  const nextCategory = categories[
    (catIndex + 1) % categories.length
  ] || {
    name: 'More',
    events: [],
  };

  const filteredCategoryEvents = useMemo(() => {
    if (!searchQuery.trim()) return currentCategory.events;

    const q = searchQuery.toLowerCase();

    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q),
    );
  }, [searchQuery, currentCategory.events, events]);

  const slide = topPicks[currentSlide] || events[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] pb-20 text-white selection:bg-[#e60012] selection:text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#e60012]/[0.035] blur-[140px]" />
        <div className="absolute -right-32 top-[45%] h-96 w-96 rounded-full bg-[#e60012]/[0.025] blur-[130px]" />
      </div>

      {/* ═══════════════ HERO / FEATURED EVENTS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-5 sm:pt-7 lg:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e60012]/10 ring-1 ring-[#e60012]/20">
              <Flame
                size={14}
                className="text-[#e60012]"
              />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e60012] sm:text-xs">
                  Featured
                </span>

                <span className="hidden h-px w-12 bg-gradient-to-r from-[#e60012]/50 to-transparent sm:block" />
              </div>

              <p className="mt-0.5 text-[10px] text-white/35 sm:text-xs">
                Discover events worth showing up for.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, cities, categories..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-4 text-xs font-medium text-white outline-none transition placeholder:text-white/25 hover:border-white/[0.14] focus:border-[#e60012]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#e60012]/10"
            />
          </div>
        </div>

        {/* Featured carousel */}
        {slide && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0c0c] shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:rounded-3xl">
            <div
              className={`relative aspect-[4/5] w-full bg-gradient-to-br ${slide.gradient} sm:aspect-[16/9] lg:aspect-[2.25/1]`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-[1.015]"
              />

              {/* cinematic overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-[#e60012]/[0.025]" />

              {/* Hero content */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8 lg:p-10">
                <div className="max-w-3xl">
                  {/* badges */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
                    <span className="rounded-full border border-[#e60012]/30 bg-black/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#ff5555] backdrop-blur-xl sm:px-3 sm:text-[10px]">
                      {slide.category}
                    </span>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.10] px-2.5 py-1 text-[9px] font-bold text-emerald-400 backdrop-blur-xl sm:px-3 sm:text-[10px]">
                      100% Refundable
                    </span>
                  </div>

                  {/* title */}
                  <h1 className="max-w-3xl text-2xl font-black uppercase leading-[0.95] tracking-[-0.035em] text-white drop-shadow-2xl sm:text-4xl md:text-5xl lg:text-6xl">
                    {slide.title}
                  </h1>

                  {/* meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-medium text-white/65 sm:mt-4 sm:gap-x-5 sm:text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        className="text-[#e60012]"
                      />
                      {slide.date}
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin
                        size={13}
                        className="shrink-0 text-[#e60012]"
                      />
                      <span className="truncate">
                        {slide.location}
                      </span>
                    </span>

                    <span className="flex items-center gap-1 text-white/40">
                      Hosted by
                      <strong className="text-white/75">
                        {slide.organizer}
                      </strong>
                    </span>
                  </div>

                  <p className="mt-2.5 line-clamp-2 max-w-2xl text-[10px] leading-relaxed text-white/55 sm:mt-3 sm:text-xs lg:text-sm">
                    {slide.description}
                  </p>

                  {/* actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/event/${slide.id}`)
                      }
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#e60012] px-4 text-[10px] font-black uppercase tracking-[0.06em] text-white shadow-[0_8px_30px_rgba(230,0,18,0.25)] transition hover:bg-[#c90010] hover:shadow-[0_10px_35px_rgba(230,0,18,0.35)] sm:px-5 sm:text-xs"
                    >
                      <Ticket size={13} />
                      View & Stake {slide.price}
                      <ArrowUpRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleLike(slide.id)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-[10px] font-bold uppercase tracking-[0.06em] backdrop-blur-xl transition sm:px-4 sm:text-xs ${
                        liked.has(slide.id)
                          ? 'border-[#e60012]/60 bg-[#e60012]/15 text-[#ff5555]'
                          : 'border-white/15 bg-black/30 text-white/65 hover:border-white/30 hover:bg-black/50 hover:text-white'
                      }`}
                    >
                      <Heart
                        size={13}
                        fill={
                          liked.has(slide.id)
                            ? '#e60012'
                            : 'none'
                        }
                      />
                      {liked.has(slide.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* carousel arrows */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous featured event"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white/65 backdrop-blur-xl transition hover:border-white/30 hover:bg-black/70 hover:text-white sm:left-5 sm:h-10 sm:w-10"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next featured event"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white/65 backdrop-blur-xl transition hover:border-white/30 hover:bg-black/70 hover:text-white sm:right-5 sm:h-10 sm:w-10"
              >
                <ChevronRight size={18} />
              </button>

              {/* slide indicators */}
              <div className="absolute right-4 top-4 flex items-center gap-1.5 sm:right-7 sm:top-7">
                {topPicks.map((pick, i) => (
                  <button
                    type="button"
                    key={pick.id}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? 'w-7 bg-[#e60012]'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ PROTOCOL METRICS ═══════════════ */}
      <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-5 sm:pt-7 lg:px-6">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-4">
          {/* Total staked */}
          <div className="border-b border-white/[0.06] p-4 sm:border-b-0 sm:border-r sm:p-5">
            <div className="flex items-center gap-2 text-white/35">
              <Coins size={14} className="text-[#e60012]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]">
                Value Staked
              </span>
            </div>

            <p className="mt-2 text-lg font-black tracking-tight sm:text-2xl">
              {stats.totalValueStakedAvax.toLocaleString()}
              <span className="ml-1 text-[9px] font-bold text-[#ff5555] sm:text-[10px]">
                AVAX
              </span>
            </p>

            <p className="mt-1 text-[9px] text-white/25 sm:text-[10px]">
              100% principal protected
            </p>
          </div>

          {/* Attendance */}
          <div className="border-b border-white/[0.06] p-4 sm:border-b-0 sm:border-r sm:p-5">
            <div className="flex items-center gap-2 text-white/35">
              <ShieldCheck
                size={14}
                className="text-emerald-400"
              />

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]">
                Show-Up Rate
              </span>
            </div>

            <p className="mt-2 text-lg font-black tracking-tight text-emerald-400 sm:text-2xl">
              {stats.attendanceRate}%
            </p>

            <p className="mt-1 text-[9px] text-white/25 sm:text-[10px]">
              Verified attendance
            </p>
          </div>

          {/* SPASS */}
          <div className="p-4 sm:border-r sm:border-white/[0.06] sm:p-5">
            <div className="flex items-center gap-2 text-white/35">
              <Sparkles
                size={14}
                className="text-amber-400"
              />

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]">
                SPASS Distributed
              </span>
            </div>

            <p className="mt-2 text-lg font-black tracking-tight sm:text-2xl">
              {stats.spassRewardsDistributed.toLocaleString()}
              <span className="ml-1 text-[9px] font-bold text-[#ff5555] sm:text-[10px]">
                SPASS
              </span>
            </p>

            <p className="mt-1 text-[9px] text-white/25 sm:text-[10px]">
              Loyalty rewards
            </p>
          </div>

          {/* Check-ins */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-white/35">
              <Award
                size={14}
                className="text-[#e60012]"
              />

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]">
                Check-Ins
              </span>
            </div>

            <p className="mt-2 text-lg font-black tracking-tight sm:text-2xl">
              {stats.verifiedAttendeesCount}
            </p>

            <p className="mt-1 text-[9px] text-white/25 sm:text-[10px]">
              Verified on-chain
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ EVENT DISCOVERY ═══════════════ */}
      <section className="mx-auto max-w-7xl px-3 pt-9 sm:px-5 sm:pt-12 lg:px-6">
        <div className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e60012] shadow-[0_0_10px_rgba(230,0,18,0.7)]" />

              <h2 className="text-xl font-black uppercase tracking-[-0.02em] sm:text-3xl">
                {searchQuery
                  ? `Search Results`
                  : currentCategory.name}
              </h2>

              {searchQuery && (
                <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[9px] font-bold text-white/40">
                  {filteredCategoryEvents.length}
                </span>
              )}
            </div>

            <p className="mt-1.5 max-w-2xl text-[10px] leading-relaxed text-white/35 sm:text-xs">
              {searchQuery
                ? `Showing events matching "${searchQuery}".`
                : 'Browse upcoming experiences. Stake your deposit, attend, and get your principal back.'}
            </p>
          </div>

          {!searchQuery && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="mr-1 hidden text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 sm:block">
                Next: {nextCategory.name}
              </span>

              <button
                type="button"
                onClick={prevCat}
                aria-label="Previous event category"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:border-[#e60012]/40 hover:bg-[#e60012]/10 hover:text-[#e60012]"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={nextCat}
                aria-label="Next event category"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:border-[#e60012]/40 hover:bg-[#e60012]/10 hover:text-[#e60012]"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filteredCategoryEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.015] px-6 py-12 text-center sm:py-16">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Ticket size={22} className="text-white/20" />
            </div>

            <p className="mt-4 text-sm font-bold text-white/60">
              No events found
            </p>

            <p className="mt-1 text-xs text-white/30">
              Try a different search term.
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-lg text-xs font-bold text-[#e60012] transition hover:text-[#ff5555]"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {filteredCategoryEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/event/${ev.id}`)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-[#e60012]/30 hover:bg-white/[0.045] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              >
                {/* Image */}
                <div
                  className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${ev.gradient}`}
                >
                  <img
                    src={ev.image}
                    alt={ev.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* price */}
                  <span className="absolute right-3 top-3 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[10px] font-black text-[#ff5555] backdrop-blur-xl">
                    {ev.price}
                  </span>

                  {/* organizer */}
                  <div className="absolute bottom-3 left-3 right-3 flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#e60012]/20 text-[9px] font-black text-white backdrop-blur-md">
                      {ev.organizerInitials}
                    </div>

                    <span className="min-w-0 truncate text-[10px] font-semibold text-white/65">
                      {ev.organizer}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold uppercase leading-snug tracking-[-0.01em] text-white transition group-hover:text-[#ff5555]">
                      {ev.title}
                    </h3>

                    <ArrowUpRight
                      size={15}
                      className="mt-0.5 shrink-0 text-white/15 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#e60012]"
                    />
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5 text-[10px] text-white/35 sm:text-[11px]">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Clock
                        size={11}
                        className="shrink-0 text-[#e60012]"
                      />

                      <span className="truncate">{ev.date}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin
                        size={11}
                        className="shrink-0 text-[#e60012]"
                      />

                      <span className="truncate">
                        {ev.location}
                      </span>
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <span className="text-[9px] font-semibold text-white/30">
                      {ev.sold} attending
                    </span>

                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.06em] text-emerald-400">
                      <ShieldCheck size={10} />
                      Refundable
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}