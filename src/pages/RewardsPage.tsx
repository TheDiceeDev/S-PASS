import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Gift,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import {
  SPASS_TOKEN_ADDRESS,
  fetchSpassBalance,
} from '../utils/contract';
import { getDemoSpassBalance, addDemoSpass } from '../services/eventService';

interface OutletContextType {
  walletAddress: string;
  refreshBalances?: () => void;
}

export default function RewardsPage() {
  const { walletAddress, refreshBalances } =
    useOutletContext<OutletContextType>() || {};

  const [onchainBalance, setOnchainBalance] = useState('0');
  const [demoBonus, setDemoBonus] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const activeAddr =
    walletAddress || '0x8D0f9E8C7e9421A9fA7a9B83803B462C23622A91';

  const loadBalances = async () => {
    try {
      const bal = await fetchSpassBalance(activeAddr);
      setOnchainBalance(bal);

      const demo = getDemoSpassBalance(activeAddr);
      setDemoBonus(demo);
    } catch (err) {
      console.warn('Balance load error:', err);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [activeAddr]);

  const totalSpass = (parseFloat(onchainBalance) || 0) + demoBonus;

  const copyAddress = () => {
    navigator.clipboard.writeText(SPASS_TOKEN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimDemoAirdrop = async () => {
    setIsClaiming(true);
    setClaimSuccess(false);

    try {
      await new Promise((r) => setTimeout(r, 900));

      addDemoSpass(activeAddr, 50);
      await loadBalances();

      if (refreshBalances) {
        refreshBalances();
      }

      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 5000);
    } catch (err) {
      console.warn('Claim error:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:gap-5 sm:pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl lg:text-3xl">
            $SPASS Reward Center
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/50 sm:text-sm">
            Official Avalanche Fuji ERC-20 loyalty token for verified event
            attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClaimDemoAirdrop}
          disabled={isClaiming}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e60012] to-red-700 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_25px_rgba(230,0,18,0.4)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:text-xs"
        >
          <Sparkles size={14} className="shrink-0 animate-pulse text-amber-300" />
          <span className="text-center">
            {isClaiming
              ? 'Claiming 50 SPASS…'
              : 'Claim 50 SPASS Investor Demo Reward'}
          </span>
        </button>
      </div>

      {/* Claim Success */}
      {claimSuccess && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              Success! 50 SPASS tokens credited to your wallet balance.
            </span>
          </div>

          <span className="shrink-0 font-mono text-emerald-400/70">
            Token: SPASS
          </span>
        </div>
      )}

      {/* Main Token Metric Banner */}
      <div className="overflow-hidden rounded-3xl border border-[#e60012]/30 bg-gradient-to-br from-zinc-950 via-black to-red-950/30 p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-3 md:gap-0">
          {/* Balance */}
          <div className="min-w-0 border-b border-white/10 pb-6 md:border-b-0 md:border-r md:pr-6 md:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ff6666] sm:text-xs">
              Your Reward Balance
            </span>

            <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-2">
              <span className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                {totalSpass.toLocaleString()}
              </span>

              <span className="text-base font-bold text-[#ff4444] sm:text-lg">
                SPASS
              </span>
            </div>

            <p className="mt-1 text-[11px] leading-relaxed text-white/50 sm:text-xs">
              Live Avalanche Fuji ERC-20 Asset
            </p>
          </div>

          {/* Contract Details */}
          <div className="min-w-0 space-y-2 border-b border-white/10 pb-6 md:border-b-0 md:border-r md:px-6 md:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-xs">
              Smart Contract Specs
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex min-w-0 items-start justify-between gap-4 text-white/60">
                <span>Symbol:</span>
                <strong className="shrink-0 text-white">SPASS</strong>
              </div>

              <div className="flex min-w-0 items-start justify-between gap-4 text-white/60">
                <span>Network:</span>
                <strong className="max-w-[65%] text-right leading-relaxed text-emerald-400">
                  Avalanche Fuji (43113)
                </strong>
              </div>

              <div className="flex min-w-0 items-start justify-between gap-4 text-white/60">
                <span>Standard:</span>
                <strong className="max-w-[65%] text-right leading-relaxed text-white">
                  ERC-20 (OpenZeppelin v5)
                </strong>
              </div>
            </div>
          </div>

          {/* Address & Explorer */}
          <div className="min-w-0 space-y-3 md:pl-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-xs">
              Contract Address
            </span>

            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2 text-xs font-mono text-white/80">
              <span className="min-w-0 flex-1 break-all leading-relaxed">
                {SPASS_TOKEN_ADDRESS}
              </span>

              <button
                type="button"
                onClick={copyAddress}
                className="min-h-9 min-w-9 shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Copy Address"
                aria-label="Copy token contract address"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>

            <a
              href={`https://testnet.snowscan.xyz/token/${SPASS_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 max-w-full items-center gap-1 text-xs font-semibold leading-relaxed text-[#ff6666] hover:underline"
            >
              <span>View on Snowtrace Explorer</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Reward Distribution Streams */}
      <div>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 sm:mb-4 sm:text-xs">
          Attendance Reward Ledger
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Verified Door Check-In',
              amount: '+50 SPASS / event',
              detail: 'Minted on physical venue arrival',
              status: 'Claimed',
              statusColor:
                'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            },
            {
              label: 'No-Show Pool Dividend',
              amount: '0.05 – 0.5 AVAX',
              detail: 'Forfeited deposits split to attendees',
              status: 'Auto-Distributed',
              statusColor:
                'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            },
            {
              label: 'Sponsor Micro-Bounty',
              amount: '+25 SPASS / task',
              detail: 'Booth check-ins & partner quests',
              status: 'Active',
              statusColor:
                'bg-amber-500/15 text-amber-400 border-amber-500/30',
            },
            {
              label: 'Loyal Attendee Multiplier',
              amount: '1.5x Staking Power',
              detail: 'Unlocks VIP early access tiers',
              status: 'Tier 1 Unlocked',
              statusColor:
                'bg-[#e60012]/15 text-[#ff6666] border-[#e60012]/30',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#e60012]/30 hover:bg-white/[0.05] sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="min-w-0 text-[10px] font-bold uppercase leading-relaxed tracking-wider text-white/50 sm:text-xs">
                  {item.label}
                </p>

                <span
                  className={`w-fit max-w-full rounded-full border px-2 py-1 text-[9px] font-bold leading-tight ${item.statusColor}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-3 break-words text-lg font-black text-white sm:text-xl">
                {item.amount}
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-white/40">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Investor Utility Section */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h3 className="flex items-start gap-2 text-sm font-black uppercase tracking-tight text-white sm:items-center sm:text-base">
          <Flame size={16} className="mt-0.5 shrink-0 text-[#e60012] sm:mt-0" />
          <span>Token Utility & Economic Flywheel</span>
        </h3>

        <div className="grid grid-cols-1 gap-3 text-xs sm:gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <h4 className="text-sm font-bold text-white">
              1. VIP Ticket Discounts
            </h4>

            <p className="mt-1 leading-relaxed text-white/60">
              Holders burn or stake SPASS to unlock discounted deposits and
              priority registration windows for high-demand festivals.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <h4 className="text-sm font-bold text-white">
              2. Sponsor Micro-Ad Bounties
            </h4>

            <p className="mt-1 leading-relaxed text-white/60">
              Brands fund pools in AVAX/SPASS to drive verified physical foot
              traffic to event booths with provable on-chain engagement.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <h4 className="text-sm font-bold text-white">
              3. Protocol Governance
            </h4>

            <p className="mt-1 leading-relaxed text-white/60">
              Active attendees curate community event funding and vote on
              no-show forfeiture fee split ratios.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-white/50 sm:items-center sm:px-5 sm:text-xs">
        <Gift size={15} className="mt-0.5 shrink-0 text-[#e60012] sm:mt-0" />

        <span>
          All SPASS tokens are verifiable on the Avalanche Fuji C-Chain
          explorer.
        </span>
      </div>
    </div>
  );
}