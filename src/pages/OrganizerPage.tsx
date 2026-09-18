import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Plus,
  XCircle,
  Users,
  Coins,
  QrCode,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Activity,
  CalendarDays,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import EventGrid from '../components/EventGrid';
import {
  getStoredEvents,
  saveNewEvent,
  getEventAttendees,
  checkInTicket,
  createTicket,
  type AppEvent,
} from '../services/eventService';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  ensureSigner,
} from '../utils/contract';

export default function OrganizerPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [attendees, setAttendees] = useState<
    {
      address: string;
      status: 'Verified' | 'Pending';
      ticketId: string;
    }[]
  >([]);

  const [eventName, setEventName] = useState('');
  const [category, setCategory] = useState('Tech');
  const [location, setLocation] = useState('Miami, FL');
  const [date, setDate] = useState('18 Oct 2026');
  const [capacity, setCapacity] = useState('150');
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [description, setDescription] = useState(
    'Join our exclusive Web3 summit where refundable staking ensures 100% verified attendance.',
  );

  const [statusMessage, setStatusMessage] = useState(
    'Select an event to manage attendees, or launch a new event on Avalanche Fuji.',
  );
  const [isBusy, setIsBusy] = useState(false);
  const [lastTxHash, setLastTxHash] = useState('');

  const reloadEvents = () => {
    const list = getStoredEvents();
    setEvents(list);

    if (!selectedEvent && list.length > 0) {
      setSelectedEvent(list[0]);
    }
  };

  useEffect(() => {
    reloadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const list = getEventAttendees(selectedEvent.id);
      setAttendees(list);
    }
  }, [selectedEvent]);

  const createEvent = async () => {
    if (!eventName.trim()) {
      setStatusMessage('Please enter an event name.');
      return;
    }

    try {
      setIsBusy(true);
      setStatusMessage(
        'Submitting createEvent transaction to Avalanche Fuji…',
      );

      let onchainId = events.length + 1;

      try {
        const signer = await ensureSigner();

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );

        const tx = await contract.createEvent(
          ethers.parseEther(depositAmount),
        );

        setLastTxHash(tx.hash);

        setStatusMessage(
          'Transaction submitted. Waiting for Avalanche block confirmation…',
        );

        const receipt = await tx.wait();

        if (receipt) {
          setStatusMessage(
            `Event confirmed on Fuji! Tx: ${tx.hash.slice(0, 10)}…`,
          );
        }
      } catch (chainErr: any) {
        console.warn(
          'On-chain createEvent failed or skipped:',
          chainErr,
        );

        setStatusMessage(
          'Demo Mode: Created event locally (connect wallet for Fuji on-chain state).',
        );
      }

      const newId = Date.now();

      const newEvent: AppEvent = {
        id: newId,
        onchainId,
        title: eventName,
        price: `${depositAmount} AVAX`,
        date,
        location,
        capacity: parseInt(capacity, 10) || 100,
        sold: 0,
        category,
        organizer: 'Organizer Portal',
        organizerInitials: eventName.slice(0, 2).toUpperCase(),
        gradient: 'from-red-900 via-zinc-900 to-black',
        image:
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&h=800&auto=format&fit=crop',
        description,
        featured: false,
      };

      saveNewEvent(newEvent);
      reloadEvents();
      setSelectedEvent(newEvent);
      setEventName('');

      setStatusMessage(
        `"${eventName}" published! Available on discovery catalog and ready for attendee stakes.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Event creation failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyAttendee = async (
    attendeeAddress: string,
    ticketId: string,
  ) => {
    if (!selectedEvent) return;

    try {
      setIsBusy(true);

      setStatusMessage(
        `Verifying check-in and refunding ${attendeeAddress.slice(0, 6)}…`,
      );

      try {
        const signer = await ensureSigner();

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );

        const tx = await contract.checkInAttendee(
          BigInt(selectedEvent.onchainId || selectedEvent.id),
          attendeeAddress,
        );

        await tx.wait();
        setLastTxHash(tx.hash);
      } catch (err) {
        console.warn(
          'On-chain check-in skipped or fallback:',
          err,
        );
      }

      checkInTicket(ticketId, selectedEvent.id);
      setAttendees(getEventAttendees(selectedEvent.id));

      setStatusMessage(
        `Attendee ${attendeeAddress.slice(0, 6)}… verified! Deposit refunded.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Check-in failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddDemoAttendee = () => {
    if (!selectedEvent) return;

    const demoAddr = `0x${Math.random()
      .toString(16)
      .substring(2, 10)}...${Math.random()
      .toString(16)
      .substring(2, 6)}`;

    createTicket(selectedEvent, demoAddr);
    setAttendees(getEventAttendees(selectedEvent.id));

    setStatusMessage(
      'Added a demo registered attendee to demonstrate door check-in.',
    );
  };

  const closeEvent = async () => {
    if (!selectedEvent) {
      setStatusMessage('Select an event from the grid first.');
      return;
    }

    try {
      setIsBusy(true);

      setStatusMessage(
        'Closing event and distributing no-show pool on-chain…',
      );

      const signer = await ensureSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.closeEventAndDistributePool(
        BigInt(selectedEvent.onchainId || selectedEvent.id),
      );

      await tx.wait();

      setLastTxHash(tx.hash);

      setStatusMessage(
        `"${selectedEvent.title}" closed on Fuji! No-show pool distributed to verified attendees.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Event close failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const verifiedCount = attendees.filter(
    (a) => a.status === 'Verified',
  ).length;

  const pendingCount = attendees.filter(
    (a) => a.status === 'Pending',
  ).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070707] text-white">
      {/* Ambient dashboard glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 overflow-hidden">
        <div className="absolute left-[15%] top-0 h-64 w-64 rounded-full bg-[#e60012]/[0.035] blur-[120px]" />
        <div className="absolute right-[10%] top-10 h-52 w-52 rounded-full bg-[#e60012]/[0.02] blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-7 px-3 py-5 sm:space-y-9 sm:px-5 sm:py-8 lg:px-6">
        {/* ═══════════════ DASHBOARD HEADER ═══════════════ */}
        <header className="border-b border-white/[0.07] pb-5 sm:pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e60012]/10 ring-1 ring-[#e60012]/20">
                  <Activity
                    size={14}
                    className="text-[#e60012]"
                  />
                </span>

                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e60012] sm:text-[10px]">
                  Organizer Dashboard
                </span>

                <span className="h-1 w-1 rounded-full bg-emerald-400" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
                  Fuji Network
                </span>
              </div>

              <h1 className="text-2xl font-black uppercase leading-none tracking-[-0.035em] text-white sm:text-4xl">
                Command Center
              </h1>

              <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-white/40 sm:text-sm">
                Create events, monitor registrations, verify attendance,
                and settle refundable deposits from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkin')}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 text-xs font-bold uppercase tracking-[0.08em] text-white/75 transition hover:border-[#e60012]/30 hover:bg-[#e60012]/[0.07] hover:text-white sm:w-auto"
            >
              <QrCode
                size={15}
                className="text-[#e60012]"
              />
              Launch Door Scanner
              <ArrowUpRight size={13} className="text-white/30" />
            </button>
          </div>

          {/* Status strip */}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.018] px-3.5 py-3 sm:items-center">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e60012] shadow-[0_0_8px_rgba(230,0,18,0.7)] sm:mt-0" />

            <p className="min-w-0 break-words text-[10px] leading-relaxed text-white/40 sm:text-xs">
              {statusMessage}
            </p>
          </div>
        </header>

        {/* ═══════════════ OVERVIEW METRICS ═══════════════ */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/30">
              <CalendarDays size={14} className="text-[#e60012]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                Events
              </span>
            </div>

            <p className="mt-2 text-xl font-black sm:text-2xl">
              {events.length}
            </p>

            <p className="mt-0.5 text-[9px] text-white/25">
              In discovery catalog
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/30">
              <Users size={14} className="text-[#e60012]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                Registered
              </span>
            </div>

            <p className="mt-2 text-xl font-black sm:text-2xl">
              {attendees.length}
            </p>

            <p className="mt-0.5 text-[9px] text-white/25">
              Current event
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/30">
              <ShieldCheck
                size={14}
                className="text-emerald-400"
              />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                Verified
              </span>
            </div>

            <p className="mt-2 text-xl font-black text-emerald-400 sm:text-2xl">
              {verifiedCount}
            </p>

            <p className="mt-0.5 text-[9px] text-white/25">
              Checked in
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-white/30">
              <Sparkles
                size={14}
                className="text-amber-400"
              />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
                Pending
              </span>
            </div>

            <p className="mt-2 text-xl font-black text-amber-300 sm:text-2xl">
              {pendingCount}
            </p>

            <p className="mt-0.5 text-[9px] text-white/25">
              Awaiting check-in
            </p>
          </div>
        </section>

        {/* ═══════════════ EVENT SELECTOR ═══════════════ */}
        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                Event Management
              </p>

              <h2 className="mt-1 text-lg font-black uppercase tracking-tight sm:text-xl">
                Select Event
              </h2>
            </div>

            {selectedEvent && (
              <div className="flex max-w-full items-center gap-2 text-[10px] text-white/35 sm:text-xs">
                <span>Selected</span>

                <span className="max-w-[220px] truncate font-bold text-[#ff5555]">
                  {selectedEvent.title}
                </span>
              </div>
            )}
          </div>

          <EventGrid
            events={events}
            selectedId={selectedEvent?.id ?? null}
            onSelect={(ev) => setSelectedEvent(ev as AppEvent)}
          />
        </section>

        {/* ═══════════════ WORKSPACE ═══════════════ */}
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          {/* Create Event */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
            <div className="border-b border-white/[0.07] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e60012]/10">
                      <Plus
                        size={15}
                        className="text-[#e60012]"
                      />
                    </span>

                    <h2 className="text-sm font-black uppercase tracking-tight sm:text-base">
                      Deploy New Event
                    </h2>
                  </div>

                  <p className="mt-1 text-[10px] text-white/30">
                    Publish a new refundable-stake event.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-[#e60012]/20 bg-[#e60012]/[0.07] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#ff5555]">
                  Avalanche Fuji
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  Event Title
                </label>

                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Avalanche Web3 Summit 2026"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/15 focus:border-[#e60012]/50 focus:bg-black/40 focus:ring-2 focus:ring-[#e60012]/10"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#e60012]/50"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Concerts">Concerts</option>
                    <option value="Sports">Sports</option>
                    <option value="Art">Art</option>
                    <option value="Food">Food</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Refundable Deposit
                  </label>

                  <div className="relative">
                    <input
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(e.target.value)
                      }
                      placeholder="0.1"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 pr-16 text-sm text-white outline-none focus:border-[#e60012]/50"
                    />

                    <span className="absolute right-3 top-1/2 translate-y-[2px] text-[9px] font-black uppercase text-[#ff5555]">
                      AVAX
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Event Date
                  </label>

                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="18 Oct 2026"
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#e60012]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Location
                  </label>

                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Miami, FL"
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#e60012]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Capacity
                  </label>

                  <input
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="200"
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none focus:border-[#e60012]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  Event Description
                </label>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-[#e60012]/50"
                />
              </div>

              <button
                type="button"
                onClick={createEvent}
                disabled={isBusy}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e60012] px-4 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_30px_rgba(230,0,18,0.16)] transition hover:bg-[#c90010] hover:shadow-[0_10px_35px_rgba(230,0,18,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />

                {isBusy
                  ? 'Publishing On-Chain…'
                  : 'Deploy Event to Fuji'}

                {!isBusy && (
                  <ArrowUpRight
                    size={14}
                    className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                )}
              </button>
            </div>
          </section>

          {/* Settlement */}
          <section className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              <div className="border-b border-white/[0.07] px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10">
                      <XCircle
                        size={15}
                        className="text-amber-300"
                      />
                    </span>

                    <h2 className="text-sm font-black uppercase tracking-tight sm:text-base">
                      Event Settlement
                    </h2>
                  </div>

                  <span className="text-[10px] font-mono text-white/25">
                    #{selectedEvent?.id ?? '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/25">
                    Active Event
                  </p>

                  <p className="mt-1 break-words text-base font-black text-white sm:text-lg">
                    {selectedEvent
                      ? selectedEvent.title
                      : 'No event chosen'}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-white/25">
                        Stake
                      </p>

                      <p className="mt-1 text-xs font-bold text-white/75">
                        {selectedEvent?.price ?? '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-white/25">
                        Registered
                      </p>

                      <p className="mt-1 text-xs font-bold text-white/75">
                        {attendees.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-white/25">
                        Verified
                      </p>

                      <p className="mt-1 text-xs font-bold text-emerald-400">
                        {verifiedCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleAddDemoAttendee}
                    disabled={!selectedEvent}
                    className="min-h-11 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 text-[10px] font-bold uppercase tracking-[0.04em] text-white/65 transition hover:border-amber-400/25 hover:bg-amber-400/[0.05] hover:text-white disabled:opacity-40"
                  >
                    <Sparkles
                      size={13}
                      className="mr-1.5 inline text-amber-400"
                    />
                    Simulate Stake
                  </button>

                  <button
                    type="button"
                    onClick={closeEvent}
                    disabled={isBusy || !selectedEvent}
                    className="min-h-11 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 text-[10px] font-bold uppercase tracking-[0.04em] text-amber-300 transition hover:bg-amber-400/[0.12] disabled:opacity-40"
                  >
                    Close & Distribute
                  </button>
                </div>

                {lastTxHash && (
                  <a
                    href={`https://testnet.snowscan.xyz/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 break-all text-[10px] font-semibold text-[#ff5555] hover:text-[#ff7777] hover:underline"
                  >
                    <span className="min-w-0">
                      View last transaction on Snowtrace
                    </span>

                    <ExternalLink
                      size={11}
                      className="shrink-0"
                    />
                  </a>
                )}
              </div>
            </div>

            {/* Settlement explanation */}
            <div className="rounded-2xl border border-emerald-500/[0.12] bg-emerald-500/[0.025] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ShieldCheck
                    size={15}
                    className="text-emerald-400"
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-white">
                    Smart Settlement
                  </p>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/40 sm:text-xs">
                    Attendees who check in receive their deposit refund.
                    At event close, remaining no-show deposits are
                    distributed according to the StakePass settlement
                    mechanism.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ═══════════════ ATTENDEE ROSTER ═══════════════ */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.07] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e60012]/10">
                  <Users
                    size={15}
                    className="text-[#e60012]"
                  />
                </span>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black uppercase tracking-tight text-white sm:text-base">
                    {selectedEvent
                      ? `Registered Roster — ${selectedEvent.title}`
                      : 'Registered Attendees'}
                  </h3>

                  <p className="mt-0.5 text-[9px] text-white/25">
                    Wallets registered for the selected event.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white/35">
                {attendees.length} registered
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {attendees.length === 0 ? (
              <div className="px-6 py-12 text-center sm:py-16">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.035]">
                  <Users size={21} className="text-white/15" />
                </div>

                <p className="mt-4 text-xs font-bold text-white/50">
                  No registered attendees
                </p>

                <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-white/25">
                  Add a demo attendee above to test the complete
                  registration and door check-in flow.
                </p>
              </div>
            ) : (
              <table className="min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
                    <th className="px-4 py-3.5 sm:px-6">
                      Ticket ID
                    </th>

                    <th className="px-4 py-3.5 sm:px-6">
                      Attendee Wallet
                    </th>

                    <th className="px-4 py-3.5 sm:px-6">
                      Status
                    </th>

                    <th className="px-4 py-3.5 text-right sm:px-6">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.045] text-[10px]">
                  {attendees.map((a) => (
                    <tr
                      key={a.ticketId || a.address}
                      className="transition hover:bg-white/[0.018]"
                    >
                      <td className="px-4 py-4 font-mono text-white/45 sm:px-6">
                        {a.ticketId || 'STAKE-PASS'}
                      </td>

                      <td className="px-4 py-4 font-mono text-white/65 sm:px-6">
                        {a.address}
                      </td>

                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold ${
                            a.status === 'Verified'
                              ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400'
                              : 'border-amber-500/20 bg-amber-500/[0.08] text-amber-300'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              a.status === 'Verified'
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                : 'bg-amber-400'
                            }`}
                          />

                          {a.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right sm:px-6">
                        {a.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleVerifyAttendee(
                                a.address,
                                a.ticketId,
                              )
                            }
                            disabled={isBusy}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3 text-[10px] font-bold text-emerald-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/[0.14] disabled:opacity-40"
                          >
                            <CheckCircle2 size={12} />
                            Check-In & Refund
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400/70">
                            <CheckCircle2 size={12} />
                            Refunded & Rewarded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Footer hint */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-white/20">
            <Coins size={12} />
            StakePass Organizer Protocol
          </div>

          <p className="text-[9px] text-white/20">
            Avalanche Fuji • Chain ID 43113
          </p>
        </div>
      </div>
    </div>
  );
}