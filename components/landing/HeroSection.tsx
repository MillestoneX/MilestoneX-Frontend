"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Rocket, Compass } from "lucide-react";

interface HeroStat {
  label: string;
  value: string;
}

const STATS: HeroStat[] = [
  { label: "Total Raised", value: "$2.4M+" },
  { label: "Active Campaigns", value: "340+" },
  { label: "Donors", value: "12,000+" },
];

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated star-field background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    type Star = { x: number; y: number; r: number; speed: number; opacity: number };

    const stars: Star[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0d1b3e] to-[#0a0e1a] px-4 py-20 md:py-28"
      aria-label="MilestoneX hero"
    >
      {/* Animated star canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.18) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-300 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-4 py-1.5">
          Powered by the Stellar Network
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
          Fund Causes That{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Matter
          </span>
          , on the Blockchain
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          MilestoneX connects verified campaign creators with donors worldwide — with full
          transparency, instant settlement, and zero intermediaries.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/dashboard/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-colors duration-200"
          >
            <Rocket className="w-5 h-5" />
            Launch a Campaign
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors duration-200"
          >
            <Compass className="w-5 h-5" />
            Explore Campaigns
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hero stats */}
      <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto grid grid-cols-3 gap-4 sm:gap-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="text-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl py-4 px-2"
          >
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
