import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Award, QrCode, Trophy, Coins, ArrowRight } from 'lucide-react';
import EventGrid from '../components/EventGrid';
import { getStoredEvents, type AppEvent } from '../services/eventService';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  ensureSigner,
} from '../utils/contract';

export default function SponsorPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [sponsorBudget, setSponsorBudget] = useState('0.5');
  const [taskName, setTaskName] = useState('Visit Booth & Scan QR');
  const [statusMessage, setStatusMessage] = useState(
    'Select an event, fund micro-bounties in AVAX, and incentivize attendee foot traffic.',
  );
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const list = getStoredEvents();
    setEvents(list);

    if (list.length > 0) {
      setSelectedEvent(list[0]);
    }
  }, []);

  const depositFunds = async () => {
    if (!selectedEvent) {
      setStatusMessage('Select an event from the grid first.');
      return;
    }

    try {
      setIsBusy(true);
      setStatusMessage(
        `Funding bounty with ${sponsorBudget} AVAX on Avalanche Fuji…`,
      );

      const signer = await ensureSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.sponsorDeposit(
        BigInt(selectedEvent.onchainId || selectedEvent.id),
        {
          value: ethers.parseEther(sponsorBudget),
        },
      );

      await tx.wait();

      setStatusMessage(
        `Bounty funded with ${sponsorBudget} AVAX for "${selectedEvent.title}".`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Deposit failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const markTaskComplete = async () => {
    if (!selectedEvent) {
      setStatusMessage('Select an event from the grid first.');
      return;
    }

    try {
      setIsBusy(true);

      const signer = await ensureSigner();
      const address = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      await contract.markSponsorTaskCompleted(
        BigInt(selectedEvent.onchainId || selectedEvent.id),
        address,
      );

      setStatusMessage(
        `Task "${taskName}" marked complete for ${address.slice(0, 6)}…!`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Task marking failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const claimReward = async () => {
    if (!selectedEvent) {
      setStatusMessage('Select an event from the grid first.');
      return;
    }

    try {
      setIsBusy(true);

      const signer = await ensureSigner();
      const address = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.claimSponsorReward(
        BigInt(selectedEvent.onchainId || selectedEvent.id),
        address,
      );

      await tx.wait();

      setStatusMessage(
        'Sponsor micro-reward claimed successfully from smart contract.',
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Reward claim failed.',
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-5 sm:py-8">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl lg:text-3xl">
          Sponsor Portal & Micro-Bounties
        </h1>

        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-white/50 sm:text-sm">
          {statusMessage}
        </p>
      </div>

      {/* Event Selection */}
      <div className="min-w-0">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-xs">
          Select Event to Sponsor
        </h2>

        <EventGrid
          events={events}
          selectedId={selectedEvent?.id ?? null}
          onSelect={(ev) => setSelectedEvent(ev as AppEvent)}
        />
      </div>

      {/* Active Sponsorship Target */}
      {selectedEvent && (
        <div className="min-w-0 rounded-2xl border border-[#e60012]/30 bg-[#e60012]/10 px-4 py-3 text-xs leading-relaxed text-[#ff6666] sm:px-5 sm:py-3 sm:text-sm">
          <span>Active Sponsorship Target: </span>

          <strong className="break-words text-white">
            {selectedEvent.title}
          </strong>

          <span className="text-[#ff6666]"> — {selectedEvent.location}</span>
        </div>
      )}

      {/* Sponsor Controls */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Fund Bounty Budget */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-2 sm:items-center">
            <Coins size={18} className="mt-0.5 shrink-0 text-[#e60012] sm:mt-0" />

            <span className="text-sm font-bold uppercase tracking-tight text-white sm:text-base">
              Fund Bounty Budget
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {/* Target Event */}
            <div className="min-w-0 rounded-xl border border-white/10 bg-black/40 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 sm:text-[11px]">
                Target Event
              </p>

              <p className="mt-1 break-words text-sm font-black leading-relaxed text-white">
                {selectedEvent
                  ? selectedEvent.title
                  : 'Select an event above'}
              </p>
            </div>

            {/* Budget */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 sm:text-xs">
                Bounty Pool Budget (AVAX)
              </label>

              <input
                value={sponsorBudget}
                onChange={(e) => setSponsorBudget(e.target.value)}
                placeholder="0.5"
                inputMode="decimal"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-[#e60012]"
              />
            </div>

            {/* Deposit */}
            <button
              type="button"
              onClick={depositFunds}
              disabled={isBusy || !selectedEvent}
              className="min-h-11 w-full rounded-xl bg-[#e60012] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_15px_rgba(230,0,18,0.35)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
            >
              {isBusy
                ? 'Submitting to Fuji…'
                : 'Deposit Sponsor Budget (AVAX)'}
            </button>
          </div>
        </div>

        {/* Quest & Verification */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-2 sm:items-center">
            <Award size={18} className="mt-0.5 shrink-0 text-amber-400 sm:mt-0" />

            <span className="text-sm font-bold uppercase tracking-tight text-white sm:text-base">
              Quest & Verification
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {/* Quest Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 sm:text-xs">
                Quest / Micro-Task
              </label>

              <select
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-xs text-white outline-none transition focus:border-[#e60012]"
              >
                <option value="Visit Booth & Scan QR">
                  Visit Sponsor Booth & Scan QR
                </option>
                <option value="Try Live Product Demo">
                  Complete 2-Minute Product Demo
                </option>
                <option value="Follow & Claim Swag">
                  Join Discord / Follow on X for Swag
                </option>
              </select>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={markTaskComplete}
                disabled={isBusy || !selectedEvent}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[11px] font-bold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
              >
                <QrCode size={15} className="shrink-0" />
                <span>Mark Attendee Task Complete</span>
              </button>

              <button
                type="button"
                onClick={claimReward}
                disabled={isBusy || !selectedEvent}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e60012]/40 bg-[#e60012]/15 px-4 py-3 text-[11px] font-bold text-[#ff6666] transition hover:bg-[#e60012]/25 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
              >
                <Trophy size={15} className="shrink-0" />
                <span>Claim Sponsor Micro-Reward (0.01 AVAX)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-white/50 sm:items-center sm:px-5 sm:text-xs">
        <ArrowRight
          size={15}
          className="mt-0.5 shrink-0 text-white/30 sm:mt-0"
        />

        <span>
          Sponsors only pay for verified physical engagement recorded on-chain,
          eliminating wasted marketing budgets.
        </span>
      </div>
    </div>
  );
}