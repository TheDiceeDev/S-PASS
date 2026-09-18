import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  CalendarCheck,
  UserCheck,
  Award,
  Ticket,
  QrCode,
  Gift,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: typeof CalendarCheck;
}

const mainItems: MenuItem[] = [
  { label: 'Organizer', path: '/organizer', icon: CalendarCheck },
  { label: 'Attendee', path: '/attendee', icon: UserCheck },
  { label: 'Sponsor', path: '/sponsor', icon: Award },
];

const secondaryItems: MenuItem[] = [
  { label: 'Events', path: '/event', icon: Ticket },
  { label: 'Check-In', path: '/checkin', icon: QrCode },
  { label: 'Rewards', path: '/rewards', icon: Gift },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ open, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(19rem,88vw)] flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="StakePass navigation menu"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <span className="text-base font-black uppercase tracking-tight text-white sm:text-lg">
            Stake<span className="text-[#e60012]">Pass</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6">
          {/* Main */}
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 sm:text-xs">
            Select role
          </p>

          <div className="space-y-1">
            {mainItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition sm:px-4 ${
                    active
                      ? 'border-l-4 border-[#e60012] bg-[#e60012]/10 text-[#e60012]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-white/10 sm:my-6" />

          {/* Secondary */}
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 sm:text-xs">
            More
          </p>

          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition sm:px-4 ${
                    active
                      ? 'border-l-4 border-[#e60012] bg-[#e60012]/10 text-[#e60012]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}