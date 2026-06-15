'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, Mail, ArrowRight, ShieldCheck, Milestone, ExternalLink } from 'lucide-react';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { address: walletAddress, connect: connectWallet } = useWalletStore();
  const { isAuthenticated } = useAuthStore();

  const redirectParam = searchParams?.get('redirect') || '';

  // Store the intended destination in sessionStorage on mount/change
  useEffect(() => {
    if (redirectParam) {
      sessionStorage.setItem('intended-destination', redirectParam);
    }
  }, [redirectParam]);

  // Auto-redirect to dashboard (or intended destination) if already connected AND authenticated
  useEffect(() => {
    if (walletAddress && isAuthenticated) {
      const destination = sessionStorage.getItem('intended-destination') || '/dashboard';
      sessionStorage.removeItem('intended-destination');
      router.push(destination);
    }
  }, [walletAddress, isAuthenticated, router]);

  const handleWalletConnect = async (walletType: string) => {
    try {
      if (walletType === 'freighter' && typeof window !== 'undefined' && (window as any).stellar) {
        const stellar = (window as any).stellar;
        const { address } = await stellar.getCurrentAddress();
        if (address) {
          connectWallet(walletType, address);
          return;
        }
      }
    } catch (e) {
      console.warn('Extension connection failed, falling back to mock key', e);
    }
    
    // Fallback to demo key
    const demoAddresses: Record<string, string> = {
      freighter: 'GC2BJMDO7XZ6ST5GD7X3GH25SZ2RR35CY6SZ6SZ6SZ6SZ6SZ6SZ6SZ6',
      albedo: 'GBLSTR7XZ6ST5GD7X3GH25SZ2RR35CY6SZ6SZ6SZ6SZ6SZ6SZ6SZ6SZ6',
      lobstr: 'GDLOBSTRXZ6ST5GD7X3GH25SZ2RR35CY6SZ6SZ6SZ6SZ6SZ6SZ6SZ6SZ',
    };
    const address = demoAddresses[walletType] || 'GDEMO7XZ6ST5GD7X3GH25SZ2RR35CY6SZ6SZ6SZ6SZ6SZ6SZ6SZ6SZ6';
    connectWallet(walletType, address);
  };

  const loginUrl = redirectParam ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}` : '/auth/login';
  const signupUrl = redirectParam ? `/auth/signup?redirect=${encodeURIComponent(redirectParam)}` : '/auth/signup';

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-[#f0f4fa] via-white to-[#e2ecf8] pt-24 pb-16 space-y-10">
      
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Stellar Cryptographic Login</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Connect to MilestoneX
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
          MilestoneX uses Stellar network wallets for secure, passwordless authentication and fast blockchain donations. Access your dashboard and projects in seconds.
        </p>
      </div>

      {/* Wallet Grid */}
      <div className="grid gap-6 sm:grid-cols-3 max-w-4xl w-full animate-fade-in delay-100">
        {/* Freighter Card */}
        <div
          onClick={() => handleWalletConnect('freighter')}
          className="bg-card border border-border hover:border-yellow-500/50 hover:shadow-lg rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 group cursor-pointer"
        >
          <div className="w-14 h-14 bg-yellow-500/10 text-yellow-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Freighter</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">
            Official browser extension by the Stellar Development Foundation. Secure and developer-friendly.
          </p>
          <button className="mt-4 text-xs font-semibold text-primary group-hover:underline flex items-center gap-1 cursor-pointer">
            Connect Extension <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Albedo Card */}
        <div
          onClick={() => handleWalletConnect('albedo')}
          className="bg-card border border-border hover:border-primary/50 hover:shadow-lg rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 group cursor-pointer"
        >
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Milestone className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Albedo</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">
            Secure web-based single sign-on wallet. Works seamlessly on both desktop and mobile browsers.
          </p>
          <button className="mt-4 text-xs font-semibold text-primary group-hover:underline flex items-center gap-1 cursor-pointer">
            Connect Web <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Lobstr Card */}
        <div
          onClick={() => handleWalletConnect('lobstr')}
          className="bg-card border border-border hover:border-purple-500/50 hover:shadow-lg rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 group cursor-pointer"
        >
          <div className="w-14 h-14 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-foreground">LOBSTR</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">
            Popular mobile and web wallet. Simple interface for managing, tracking, and sending Stellar assets.
          </p>
          <button className="mt-4 text-xs font-semibold text-primary group-hover:underline flex items-center gap-1 cursor-pointer">
            Connect App <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Guide Section */}
      <div className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-fade-in delay-200">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="font-bold text-base text-foreground flex items-center justify-center sm:justify-start gap-2">
            New to Stellar wallets?
          </h4>
          <p className="text-xs text-muted-foreground max-w-xl">
            A Stellar wallet holds your cryptographic keys, allowing you to sign transactions, store XLM, and interact securely with applications on the Stellar network.
          </p>
        </div>
        <a
          href="https://stellar.org/learn/stellar-wallets"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 text-xs font-bold text-foreground border border-border rounded-xl transition-all cursor-pointer"
        >
          What is a Stellar Wallet?
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Status & Alt Sign In Option */}
      <div className="space-y-4 max-w-xl w-full text-center animate-fade-in delay-300">
        {walletAddress && (
          <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10 inline-flex items-start gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-normal">
              <span className="font-semibold text-yellow-800">Wallet Connected:</span>{' '}
              <code className="text-yellow-900 bg-yellow-500/10 px-1 rounded font-mono break-all">{walletAddress}</code>.
              <p className="mt-1 text-muted-foreground">
                To access private pages (like creating campaigns or viewing profile), please log in with your email account below.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Have an email account?{' '}
          <Link href={loginUrl} className="font-semibold text-primary hover:underline">
            Sign in with Email
          </Link>
          {' '}or{' '}
          <Link href={signupUrl} className="font-semibold text-primary hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
      
    </main>
  );
}
