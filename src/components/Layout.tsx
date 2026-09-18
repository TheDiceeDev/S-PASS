import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Menu,
  Wallet,
  LogOut,
  ChevronDown,
  Coins,
  CircleDot,
} from 'lucide-react';
import HamburgerMenu from './HamburgerMenu';
import { FUJI_CHAIN_ID, switchToFuji } from '../utils/network';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../data/users';
import { fetchSpassBalance } from '../utils/contract';
import { getDemoSpassBalance } from '../services/eventService';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [spassBalance, setSpassBalance] = useState('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const updateBalance = useCallback(async (address: string) => {
    if (!address) return;

    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(address);
        setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      }

      const onchainSpass = await fetchSpassBalance(address);
      const demoSpass = getDemoSpassBalance(address);
      const totalSpass = (parseFloat(onchainSpass) || 0) + demoSpass;

      setSpassBalance(totalSpass.toFixed(0));
    } catch (err) {
      console.warn('Balance update failed:', err);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('No wallet found. Install MetaMask or Rabby.');
      return;
    }

    try {
      setIsConnecting(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      setChainId(currentChainId);

      if (currentChainId !== FUJI_CHAIN_ID) {
        const switched = await switchToFuji();

        if (!switched) {
          alert(
            'This app requires Avalanche Fuji testnet. Please switch to Fuji (Chain ID 43113) in your wallet.'
          );

          setIsConnecting(false);
          return;
        }

        setChainId(FUJI_CHAIN_ID);
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      await updateBalance(address);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Connection failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => window.location.reload();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress('');
        setBalance('');
        setSpassBalance('0');
      } else {
        setWalletAddress(accounts[0]);
        updateBalance(accounts[0]);
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );
    };
  }, [updateBalance]);

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e60012]/[0.045] blur-[120px]" />
        <div className="absolute right-0 top-[35%] h-64 w-64 rounded-full bg-[#e60012]/[0.025] blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070707]/80 backdrop-blur-2xl">
        <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-6">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex shrink-0 items-center gap-2"
            aria-label="Go to StakePass home"
          >
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#e60012] shadow-[0_0_24px_rgba(230,0,18,0.22)] sm:h-9 sm:w-9">
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />

              <span className="relative text-sm font-black tracking-tighter text-white sm:text-base">
                S
              </span>
            </span>

            <span className="hidden text-[15px] font-black uppercase tracking-[-0.04em] sm:block sm:text-lg">
              Stake<span className="text-[#e60012]">Pass</span>
            </span>

            {!isHome && (
              <ChevronDown
                size={14}
                className="rotate-90 text-white/25 transition group-hover:text-white/50"
              />
            )}
          </button>

          {/* Header Actions */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {/* Authenticated user */}
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                title={`Signed in as ${user.name}`}
                className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 transition hover:border-white/15 hover:bg-white/[0.06] sm:inline-flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e60012]/15 text-[10px] font-black uppercase text-[#ff5555] ring-1 ring-[#e60012]/20">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>

                <span className="text-left leading-tight">
                  <span className="block max-w-[100px] truncate text-xs font-bold text-white">
                    {user.name}
                  </span>

                  <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
                    {roleLabel[user.role]}
                  </span>
                </span>
              </button>
            )}

            {/* Network */}
            {chainId && (
              <div
                className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] md:inline-flex ${
                  chainId === FUJI_CHAIN_ID
                    ? 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/[0.07] text-amber-400'
                }`}
              >
                <CircleDot
                  size={10}
                  className={
                    chainId === FUJI_CHAIN_ID
                      ? 'fill-emerald-400 text-emerald-400'
                      : 'fill-amber-400 text-amber-400'
                  }
                />

                {chainId === FUJI_CHAIN_ID
                  ? 'Fuji'
                  : `Chain ${chainId}`}
              </div>
            )}

            {/* AVAX balance */}
            {walletAddress && balance && (
              <div className="hidden items-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 lg:inline-flex">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">
                  AVAX
                </span>

                <span className="ml-2 text-xs font-bold text-white/80">
                  {balance}
                </span>
              </div>
            )}

            {/* SPASS balance */}
            {walletAddress && (
              <button
                type="button"
                onClick={() => navigate('/rewards')}
                title="Your StakePass SPASS Reward Tokens"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e60012]/25 bg-[#e60012]/[0.08] px-2.5 py-1.5 transition hover:border-[#e60012]/45 hover:bg-[#e60012]/[0.14] sm:px-3"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e60012]/15">
                  <Coins
                    size={12}
                    className="text-[#ff5555] transition group-hover:scale-110"
                  />
                </span>

                <span className="text-xs font-black text-[#ff5555]">
                  {spassBalance}
                </span>

                <span className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-white/45 sm:inline">
                  SPASS
                </span>
              </button>
            )}

            {/* Auth */}
            <button
              type="button"
              onClick={() =>
                isAuthenticated ? logout() : navigate('/login')
              }
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white md:inline-flex"
            >
              {isAuthenticated ? (
                <>
                  <LogOut size={13} />
                  Sign out
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e60012] shadow-[0_0_8px_rgba(230,0,18,0.8)]" />
                  Sign in
                </>
              )}
            </button>

            {/* Wallet */}
            <button
              type="button"
              onClick={connectWallet}
              disabled={isConnecting}
              className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#e60012] px-3 text-[11px] font-black uppercase tracking-[0.04em] text-white shadow-[0_4px_24px_rgba(230,0,18,0.2)] transition hover:bg-[#c90010] hover:shadow-[0_5px_28px_rgba(230,0,18,0.3)] disabled:cursor-wait disabled:opacity-70 sm:h-10 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <Wallet
                size={13}
                className="transition group-hover:scale-110 sm:h-[14px] sm:w-[14px]"
              />

              {isConnecting ? (
                'Connecting…'
              ) : walletAddress ? (
                `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              ) : (
                <>
                  <span className="sm:hidden">Connect</span>
                  <span className="hidden sm:inline">
                    Connect Wallet
                  </span>
                </>
              )}
            </button>

            {/* Menu */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/55 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white sm:h-10 sm:w-10"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {/* Connected wallet status bar */}
        {walletAddress && (
          <div className="border-t border-white/[0.045] bg-white/[0.012]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-1.5 sm:px-5 lg:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                  Wallet connected
                </span>
              </div>

              <span className="truncate text-[9px] font-mono text-white/25">
                {walletAddress}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="min-h-[calc(100vh-4rem)] min-w-0">
        <Outlet
          context={{
            walletAddress,
            balance,
            spassBalance,
            chainId,
            connectWallet,
            user,
            isAuthenticated,
            refreshBalances: () => updateBalance(walletAddress),
          }}
        />
      </main>

      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}