import { MapPin, CalendarDays, Users } from 'lucide-react';

export interface GridEventItem {
  id: number;
  name?: string;
  title?: string;
  deposit?: string;
  price?: string;
  date: string;
  location: string;
  capacity?: number;
  registered?: number;
  sold?: number;
  image: string;
}

interface Props<T extends GridEventItem> {
  events: T[];
  selectedId: number | null;
  onSelect: (event: T) => void;
}

export default function EventGrid<T extends GridEventItem>({
  events,
  selectedId,
  onSelect,
}: Props<T>) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {events.map((event) => {
        const title = event.name || event.title || `Event #${event.id}`;
        const depositStr = event.deposit
          ? `${event.deposit} AVAX`
          : event.price || '0.1 AVAX';

        const registeredCount = event.registered ?? event.sold ?? 0;
        const totalCapacity = event.capacity ?? 100;
        const isSelected = selectedId === event.id;
        const filled =
          totalCapacity > 0
            ? Math.min(
                100,
                Math.round((registeredCount / totalCapacity) * 100),
              )
            : 0;

        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
            className={`group relative w-full min-w-0 overflow-hidden rounded-2xl border text-left transition-all duration-200 active:scale-[0.99] sm:hover:-translate-y-0.5 ${
              isSelected
                ? 'border-[#e60012]/80 bg-[#e60012]/10 shadow-[0_0_25px_rgba(230,0,18,0.25)]'
                : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
            }`}
          >
            {/* Event image */}
            <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-red-900 via-red-700 to-black sm:h-32">
              <img
                src={event.image}
                alt={title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 sm:group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {isSelected && (
                <span className="absolute right-2.5 top-2.5 max-w-[calc(100%-1.25rem)] rounded-full bg-[#e60012] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-md sm:right-3 sm:top-3 sm:text-[10px]">
                  Active Selection
                </span>
              )}
            </div>

            {/* Event information */}
            <div className="min-w-0 p-4 sm:p-5">
              <h3 className="truncate text-sm font-bold uppercase tracking-tight text-white transition group-hover:text-[#e60012]">
                {title}
              </h3>

              <div className="mt-3 space-y-2 text-xs text-white/50">
                <div className="flex min-w-0 items-start gap-2">
                  <CalendarDays
                    size={13}
                    className="mt-0.5 shrink-0 text-[#e60012]"
                  />
                  <span className="min-w-0 break-words">{event.date}</span>
                </div>

                <div className="flex min-w-0 items-start gap-2">
                  <MapPin
                    size={13}
                    className="mt-0.5 shrink-0 text-[#e60012]"
                  />
                  <span className="min-w-0 break-words">{event.location}</span>
                </div>

                <div className="flex min-w-0 items-start gap-2">
                  <Users
                    size={13}
                    className="mt-0.5 shrink-0 text-[#e60012]"
                  />
                  <span className="min-w-0 break-words">
                    {registeredCount} / {totalCapacity} spots filled
                  </span>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mt-3.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      filled >= 90
                        ? 'bg-[#e60012]'
                        : filled >= 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                    style={{ width: `${filled}%` }}
                  />
                </div>
              </div>

              {/* Stake + remaining spots */}
              <div className="mt-3 flex min-w-0 flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="min-w-0 font-semibold leading-relaxed text-white/40">
                  Required Stake:{' '}
                  <span className="font-bold text-[#ff5555]">
                    {depositStr}
                  </span>
                </span>

                <span className="shrink-0 font-medium text-white/40">
                  {Math.max(0, totalCapacity - registeredCount)} left
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}