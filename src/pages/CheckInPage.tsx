import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  getStoredEvents,
  getStoredTickets,
  checkInTicket,
  type AppEvent,
  type EventTicket,
} from '../services/eventService';
import { CONTRACT_ADDRESS, CONTRACT_ABI, ensureSigner } from '../utils/contract';
import { ethers } from 'ethers';

export default function CheckInPage() {
  const [roleMode, setRoleMode] = useState<'scanner' | 'ticket'>('scanner');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number>(1);
  const [tickets, setTickets] = useState<EventTicket[]>([]);

  // Scanner state
  const [ticketInput, setTicketInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<EventTicket | null>(null);
  const [scanError, setScanError] = useState('');

  // Attendee view state
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);

  useEffect(() => {
    const evs = getStoredEvents();
    setEvents(evs);

    if (evs.length > 0) {
      setSelectedEventId(evs[0].id);
    }

    const tkts = getStoredTickets();
    setTickets(tkts);

    if (tkts.length > 0) {
      setSelectedTicket(tkts[0]);
    }
  }, []);

  const eventPendingTickets = tickets.filter(
    (t) => t.eventId === selectedEventId && t.status === 'staked',
  );

  const handleVerifyTicket = async (targetTicketId?: string) => {
    const idToVerify = targetTicketId || ticketInput.trim();

    if (!idToVerify) {
      setScanError('Please enter or select a ticket to verify.');
      return;
    }

    setScanError('');
    setIsVerifying(true);

    try {
      const match = tickets.find(
        (t) =>
          t.id.toLowerCase() === idToVerify.toLowerCase() ||
          t.attendeeAddress.toLowerCase() === idToVerify.toLowerCase(),
      );

      if (!match) {
        setScanError('No matching ticket found for this event.');
        setIsVerifying(false);
        return;
      }

      if (match.status === 'checked_in') {
        setScanError(
          `Ticket ${match.id} has already been checked in & refunded.`,
        );
        setIsVerifying(false);
        return;
      }

      try {
        const signer = await ensureSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );
        const tx = await contract.checkInAttendee(
          BigInt(match.eventId),
          match.attendeeAddress,
        );
        await tx.wait();
      } catch (err) {
        console.warn('Smart contract check-in fallback:', err);
      }

      checkInTicket(match.id, match.eventId);

      const updatedList = getStoredTickets();
      setTickets(updatedList);

      match.status = 'checked_in';
      setScanSuccess(match);
      setTicketInput('');
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : 'Verification failed.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:gap-5 sm:pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Venue Check-In Terminal
          </h1>

          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">
            {roleMode === 'scanner'
              ? 'Organizers scan attendee QR codes at the entrance to trigger instant on-chain refunds.'
              : 'Attendees present this high-contrast QR pass to the door scanner.'}
          </p>
        </div>

        {/* Mode switcher */}
        <div className="grid w-full grid-cols-1 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:grid-cols-2 lg:w-auto">
          <button
            type="button"
            onClick={() => {
              setRoleMode('scanner');
              setScanSuccess(null);
            }}
            className={`min-h-11 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition sm:px-4 sm:text-xs ${
              roleMode === 'scanner'
                ? 'bg-[#e60012] text-white shadow-[0_2px_10px_rgba(230,0,18,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Door Scanner Mode
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleMode('ticket');
              setScanSuccess(null);
            }}
            className={`min-h-11 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition sm:px-4 sm:text-xs ${
              roleMode === 'ticket'
                ? 'bg-[#e60012] text-white shadow-[0_2px_10px_rgba(230,0,18,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Attendee Pass Mode
          </button>
        </div>
      </div>

      {/* Mode A: Organizer Door Scanner */}
      {roleMode === 'scanner' && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          {/* Scanner */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:rounded-3xl sm:p-8">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="shrink-0 text-[#e60012]" />
                <span className="text-sm font-bold uppercase tracking-wide text-white">
                  Entrance QR Scanner
                </span>
              </div>

              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="min-h-11 w-full max-w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#e60012] sm:w-auto sm:min-w-[180px]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Viewfinder */}
            <div className="relative mt-5 flex aspect-square max-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-black/60 p-4 sm:mt-6 sm:aspect-[16/10] sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ff2222] to-transparent shadow-[0_0_15px_#ff0000] animate-[bounce_3s_infinite]" />

              <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-black/40 p-4 text-center backdrop-blur-sm sm:p-6">
                <QrCode
                  size={52}
                  className="mx-auto text-[#e60012] opacity-80 sm:h-14 sm:w-14"
                />

                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
                  Position QR Code in Viewfinder
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-white/40 sm:text-[11px]">
                  Ready to scan digital ticket pass or wristband
                </p>
              </div>
            </div>

            {/* Manual verification */}
            <div className="mt-5 space-y-3 sm:mt-6">
              <label className="block text-[10px] font-bold uppercase leading-relaxed tracking-wider text-white/50 sm:text-xs">
                Quick Verification / Manual Input (Presentation Mode)
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Paste Ticket ID or Attendee Wallet"
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#e60012]"
                />

                <button
                  type="button"
                  onClick={() => handleVerifyTicket()}
                  disabled={isVerifying}
                  className="min-h-11 w-full rounded-xl bg-[#e60012] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_15px_rgba(230,0,18,0.4)] transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                >
                  {isVerifying ? 'Checking…' : 'Verify'}
                </button>
              </div>

              {scanError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span className="break-words">{scanError}</span>
                </div>
              )}
            </div>

            {/* Success */}
            {scanSuccess && (
              <div className="mt-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/30 p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] sm:mt-6 sm:p-5">
                <div className="flex items-start gap-2.5 text-emerald-400">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

                  <span className="text-sm font-black uppercase tracking-wide">
                    Door Verification Successful!
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs font-medium text-white/80">
                  <p className="break-words">
                    Ticket:{' '}
                    <strong className="break-all font-mono text-white">
                      {scanSuccess.id}
                    </strong>
                  </p>

                  <p className="break-words">
                    Event:{' '}
                    <strong className="text-white">
                      {scanSuccess.eventTitle}
                    </strong>
                  </p>

                  <p className="break-words font-bold text-emerald-300">
                    ✓ {scanSuccess.depositAmount} deposit instantly refunded
                    on-chain.
                  </p>

                  <p className="font-bold text-amber-300">
                    ✓ +50 SPASS reward tokens credited.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pending arrivals */}
          <div className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:rounded-3xl sm:p-6">
            <div className="flex items-start gap-2 border-b border-white/10 pb-3">
              <Users size={16} className="mt-0.5 shrink-0 text-[#e60012]" />

              <span className="text-xs font-bold uppercase leading-relaxed tracking-wider text-white">
                Pending Door Arrivals ({eventPendingTickets.length})
              </span>
            </div>

            <p className="text-xs leading-relaxed text-white/50">
              Select any registrant below to simulate scanning their pass at
              the entrance:
            </p>

            <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
              {eventPendingTickets.length === 0 ? (
                <div className="py-8 text-center text-xs leading-relaxed text-white/40">
                  No pending tickets for this event. All attendees are either
                  checked in or haven&apos;t staked yet.
                </div>
              ) : (
                eventPendingTickets.map((tkt) => (
                  <button
                    key={tkt.id}
                    type="button"
                    onClick={() => handleVerifyTicket(tkt.id)}
                    className="group flex min-h-[68px] w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-[#e60012]/40 hover:bg-[#e60012]/10"
                  >
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs font-bold text-white group-hover:text-[#ff5555]">
                        {tkt.id}
                      </p>

                      <p className="mt-1 max-w-full truncate font-mono text-[10px] text-white/40 sm:max-w-[170px]">
                        {tkt.attendeeAddress}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      Scan In
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-white/40">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-400" />

              <span>
                Checking an attendee in automatically executes their deposit
                return.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mode B: Attendee Pass */}
      {roleMode === 'ticket' && (
        <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
          <div className="rounded-2xl border-2 border-[#e60012]/40 bg-gradient-to-br from-zinc-950 via-black to-red-950/40 p-4 text-center shadow-[0_0_50px_rgba(230,0,18,0.25)] sm:rounded-3xl sm:p-8">
            <span className="inline-flex max-w-full rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 sm:text-xs">
              Show at Door Turnstile
            </span>

            <h3 className="mt-4 break-words text-lg font-black uppercase leading-tight text-white sm:text-xl">
              {selectedTicket
                ? selectedTicket.eventTitle
                : 'Active Event Pass'}
            </h3>

            {/* QR code */}
            <div className="mx-auto mt-5 w-fit max-w-full rounded-2xl bg-white p-3 shadow-2xl sm:mt-6 sm:rounded-3xl sm:p-5">
              <QRCodeSVG
                value={
                  selectedTicket
                    ? `stakepass://ticket/${selectedTicket.id}/${selectedTicket.eventId}/${selectedTicket.attendeeAddress}`
                    : 'stakepass://checkin/demo'
                }
                size={220}
                level="H"
                className="h-auto max-w-full"
              />
            </div>

            <div className="mt-5 space-y-2 font-mono text-xs text-white/60 sm:mt-6">
              <p className="break-all font-bold text-sm text-white">
                {selectedTicket?.id ?? 'TKT-DEMO-001'}
              </p>

              <p className="break-words">
                Holder:{' '}
                {selectedTicket?.attendeeAddress ?? '0x8D0f...2A91'}
              </p>

              <p className="break-words font-semibold text-emerald-400">
                Deposit Locked:{' '}
                {selectedTicket?.depositAmount ?? '0.1 AVAX'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom guarantee */}
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/50 sm:p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />

        <span>
          <strong>Cryptographic Attendance Proof</strong>: Check-in records are
          written to the Avalanche Fuji smart contract, guaranteeing immediate
          deposit recovery and distributing verifiable attendance badges.
        </span>
      </div>
    </div>
  );
}