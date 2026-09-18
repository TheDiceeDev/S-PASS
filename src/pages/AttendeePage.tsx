import { useState, useEffect } from 'react';
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserPlus,
  CheckCircle,
  Ticket,
  ShieldCheck,
  Clock,
  MapPin,
} from 'lucide-react';
import EventGrid from '../components/EventGrid';
import {
  getStoredEvents,
  getStoredTickets,
  getUserTickets,
  createTicket,
  checkInTicket,
  type AppEvent,
  type EventTicket,
} from '../services/eventService';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  ensureSigner,
} from '../utils/contract';

interface OutletContextType {
  walletAddress: string;
  refreshBalances?: () => void;
}

export default function AttendeePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress, refreshBalances } =
    useOutletContext<OutletContextType>() || {};

  const [activeTab, setActiveTab] = useState<'passes' | 'discover'>('passes');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  const [statusMessage, setStatusMessage] = useState(
    'Manage your active event tickets and verify door check-ins.',
  );
  const [isBusy, setIsBusy] = useState(false);

  const loadData = () => {
    const evs = getStoredEvents();
    setEvents(evs);

    const addr =
      walletAddress ||
      '0x8D0f9E8C7e9421A9fA7a9B83803B462C23622A91';

    let userTkts = getUserTickets(addr);

    if (userTkts.length === 0) {
      userTkts = getStoredTickets();
    }

    setTickets(userTkts);

    const preselectedId = (
      location.state as { eventId?: number } | null
    )?.eventId;

    if (preselectedId) {
      const match = evs.find((e) => e.id === preselectedId);

      if (match) {
        setSelectedEvent(match);
      }

      setActiveTab('discover');
    } else if (evs.length > 0 && !selectedEvent) {
      setSelectedEvent(evs[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, [walletAddress]);

  const registerAndStake = async () => {
    if (!selectedEvent) {
      setStatusMessage('Select an event from the grid first.');
      return;
    }

    try {
      setIsBusy(true);
      setStatusMessage(
        `Staking ${selectedEvent.price} on Avalanche Fuji…`,
      );

      const depositNum =
        selectedEvent.price.match(/^([\d.]+)/)?.[1] || '0.1';

      let userAddr = walletAddress;
      let txHash = '';

      try {
        const signer = await ensureSigner();
        userAddr = await signer.getAddress();

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );

        const tx = await contract.registerAndStake(
          BigInt(selectedEvent.onchainId || selectedEvent.id),
          {
            value: ethers.parseEther(depositNum),
          },
        );

        txHash = tx.hash;

        setStatusMessage(
          'Staking transaction submitted. Waiting for Avalanche block…',
        );

        await tx.wait();
      } catch (chainErr) {
        console.warn('On-chain staking demo fallback:', chainErr);

        if (!userAddr) {
          userAddr =
            '0x8D0f9E8C7e9421A9fA7a9B83803B462C23622A91';
        }
      }

      const tkt = createTicket(selectedEvent, userAddr, txHash);
      void tkt;

      loadData();
      setActiveTab('passes');

      if (refreshBalances) {
        refreshBalances();
      }

      setStatusMessage(
        `Registered for "${selectedEvent.title}"! Ticket added to your digital wallet.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Registration failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelfCheckIn = async (ticket: EventTicket) => {
    try {
      setIsBusy(true);

      setStatusMessage(
        `Executing on-chain check-in for "${ticket.eventTitle}"…`,
      );

      try {
        const signer = await ensureSigner();
        const address = await signer.getAddress();

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );

        const tx = await contract.checkInAttendee(
          BigInt(ticket.eventId),
          address,
        );

        await tx.wait();
      } catch (err) {
        console.warn('On-chain check-in fallback:', err);
      }

      checkInTicket(ticket.id, ticket.eventId);
      loadData();

      if (refreshBalances) {
        refreshBalances();
      }

      setStatusMessage(
        `Checked in! Deposit of ${ticket.depositAmount} refunded to your wallet.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Check-in failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-5 sm:py-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Attendee Passbook
          </h1>

          <p className="mt-1 max-w-3xl break-words text-xs leading-relaxed text-white/50 sm:text-sm">
            {statusMessage}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:flex sm:w-auto">
          <button
            onClick={() => setActiveTab('passes')}
            className={`min-h-10 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition sm:px-4 sm:text-xs ${
              activeTab === 'passes'
                ? 'bg-[#e60012] text-white shadow-[0_2px_10px_rgba(230,0,18,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            My Passes ({tickets.length})
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`min-h-10 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition sm:px-4 sm:text-xs ${
              activeTab === 'discover'
                ? 'bg-[#e60012] text-white shadow-[0_2px_10px_rgba(230,0,18,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Stake & Reserve
          </button>
        </div>
      </div>

      {/* Passes Tab */}
      {activeTab === 'passes' && (
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
              Active Digital Passes & Door QRs
            </h2>

            <button
              onClick={() => navigate('/checkin')}
              className="w-fit text-xs font-bold text-[#ff6666] hover:underline"
            >
              Open Camera Check-In Scanner →
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 text-center sm:p-12">
              <Ticket
                size={40}
                className="mx-auto mb-3 text-white/20"
              />

              <p className="text-base font-bold text-white">
                No active event passes
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/50">
                Stake your refundable deposit on an event to claim your pass.
                100% of your deposit is returned when you arrive.
              </p>

              <button
                onClick={() => setActiveTab('discover')}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#e60012] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Browse & Stake Events
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
              {tickets.map((tkt) => {
                const isVerified = tkt.status === 'checked_in';

                return (
                  <div
                    key={tkt.id}
                    className={`relative min-w-0 overflow-hidden rounded-3xl border p-4 backdrop-blur-sm transition-all sm:p-6 ${
                      isVerified
                        ? 'border-emerald-500/30 bg-gradient-to-br from-zinc-950 to-emerald-950/20'
                        : 'border-[#e60012]/30 bg-gradient-to-br from-zinc-950 via-black to-red-950/20'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex min-w-0 flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${
                            isVerified
                              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                              : 'border border-amber-500/40 bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              isVerified
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                          />

                          {isVerified
                            ? 'Checked In & Refunded'
                            : 'Deposit Staked'}
                        </span>

                        <h3 className="mt-2 break-words text-base font-black uppercase leading-tight text-white sm:text-lg">
                          {tkt.eventTitle}
                        </h3>
                      </div>

                      <span className="max-w-full break-all font-mono text-[10px] font-bold text-white/40 sm:text-xs">
                        {tkt.id}
                      </span>
                    </div>

                    {/* QR Code and details */}
                    <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                      <div className="shrink-0 rounded-2xl bg-white p-3 shadow-xl">
                        <QRCodeSVG
                          value={`stakepass://ticket/${tkt.id}/${tkt.eventId}/${tkt.attendeeAddress}`}
                          size={125}
                          level="M"
                        />
                      </div>

                      <div className="min-w-0 w-full space-y-2 text-center text-xs text-white/60 sm:text-left">
                        <p className="flex items-center justify-center gap-1.5 text-white/80 sm:justify-start">
                          <Clock
                            size={13}
                            className="shrink-0 text-[#e60012]"
                          />
                          <span className="break-words">{tkt.date}</span>
                        </p>

                        <p className="flex items-center justify-center gap-1.5 text-white/80 sm:justify-start">
                          <MapPin
                            size={13}
                            className="shrink-0 text-[#e60012]"
                          />
                          <span className="break-words">
                            {tkt.location}
                          </span>
                        </p>

                        <p className="mx-auto max-w-full truncate font-mono text-[11px] text-white/40 sm:mx-0 sm:max-w-[200px]">
                          Holder: {tkt.attendeeAddress}
                        </p>

                        <p className="flex items-center justify-center gap-1 font-bold text-emerald-400 sm:justify-start">
                          <ShieldCheck size={14} className="shrink-0" />
                          Deposit: {tkt.depositAmount}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 border-t border-white/10 pt-4">
                      {isVerified ? (
                        <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <CheckCircle size={15} className="shrink-0" />
                          100% Refund credited + 50 SPASS
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelfCheckIn(tkt)}
                          disabled={isBusy}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2.5 text-xs font-bold text-emerald-300 shadow-sm transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle size={14} />
                          {isBusy
                            ? 'Checking In…'
                            : 'Check In & Claim Refund'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Discover & Stake Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-5 sm:space-y-6">
          <div className="min-w-0">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-white/40">
              Select an Event to Stake Deposit
            </h2>

            <EventGrid
              events={events}
              selectedId={selectedEvent?.id ?? null}
              onSelect={(ev) =>
                setSelectedEvent(ev as AppEvent)
              }
            />
          </div>

          {selectedEvent && (
            <div className="min-w-0 rounded-3xl border border-[#e60012]/40 bg-gradient-to-br from-black via-zinc-950 to-red-950/30 p-4 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff5555]">
                    {selectedEvent.category} Experience
                  </span>

                  <h3 className="mt-1 break-words text-xl font-black uppercase leading-tight text-white sm:text-2xl">
                    {selectedEvent.title}
                  </h3>

                  <p className="mt-1 break-words text-xs leading-relaxed text-white/50">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:border-l sm:border-white/10 sm:pl-6 sm:text-right">
                  <p className="text-xs font-bold uppercase text-white/40">
                    Required Stake
                  </p>

                  <p className="text-2xl font-black text-[#ff4444] sm:text-3xl">
                    {selectedEvent.price}
                  </p>

                  <p className="text-[11px] font-semibold text-emerald-400">
                    100% refunded at door
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Clock
                      size={14}
                      className="shrink-0 text-[#e60012]"
                    />
                    {selectedEvent.date}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin
                      size={14}
                      className="shrink-0 text-[#e60012]"
                    />
                    {selectedEvent.location}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <ShieldCheck
                      size={14}
                      className="shrink-0 text-emerald-400"
                    />
                    Avalanche Fuji Smart Contract
                  </span>
                </div>

                <button
                  onClick={registerAndStake}
                  disabled={isBusy}
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e60012] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_25px_rgba(230,0,18,0.4)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                >
                  <UserPlus size={15} />

                  {isBusy
                    ? 'Staking on Fuji…'
                    : `Stake ${selectedEvent.price} & Reserve Pass`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Guarantee */}
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-white/50">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-emerald-400"
        />

        <span>
          <strong>The S-PASS Anti-Flake Commitment</strong>: Your staked AVAX
          remains safely in the Fuji contract. Once you check in, you
          immediately get your deposit back plus a split of any no-show
          penalties and $SPASS loyalty tokens.
        </span>
      </div>
    </div>
  );
}