/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaFacebookF, FaLinkedinIn, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Copy,
  ExternalLink,
  Heart,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

import { DonationModal } from '@/components/donations/DonationModal';
import type { DonationReceipt } from '@/components/donations/TransactionSuccessModal';
import { FundingProgress } from '@/components/projects/FundingProgress';
import { ImageGallery, type GalleryImage } from '@/components/projects/ImageGallery';
import type { Project, Update } from '@/types/api';

// Tabs
import { StoryTab } from './tabs/StoryTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { SmartContractTab } from './tabs/SmartContractTab';
import { DonorsTab } from './tabs/DonorsTab';

interface ProjectDetailsClientProps {
  project: Project;
  serverTime: string;
}

type TabKey = 'story' | 'updates' | 'milestones' | 'contract' | 'donors';

type Countdown = {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function toNumber(value: string | number | undefined) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getServerTimeMs(serverTime: string) {
  const time = new Date(serverTime).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

function getCountdown(deadline: string, nowMs: number): Countdown {
  const deadlineMs = new Date(deadline).getTime();
  const totalSeconds = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalSeconds, days, hours, minutes, seconds };
}

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

function formatCountdown(countdown: Countdown): string {
  return `${countdown.days}d ${padTime(countdown.hours)}:${padTime(countdown.minutes)}:${padTime(countdown.seconds)}`;
}

function getDaysRemaining(project: Project) {
  if (typeof project.daysRemaining === 'number') {
    return project.daysRemaining;
  }

  if (!project.deadline) {
    return undefined;
  }

  const deadline = new Date(project.deadline).getTime();
  if (!Number.isFinite(deadline)) {
    return undefined;
  }

  const remaining = Math.ceil((deadline - Date.now()) / 86400000);
  return Math.max(remaining, 0);
}

function getDonorCount(project: Project) {
  return project.donorCount ?? project.donors ?? 0;
}

function getProjectImages(project: Project): GalleryImage[] {
  const urls = project.imageUrls?.length ? project.imageUrls : project.imageUrl ? [project.imageUrl] : [];

  return urls.map((url, index) => ({
    src: url,
    alt: `${project.title} image ${index + 1}`,
    caption: index === 0 ? project.title : `Campaign image ${index + 1}`,
  }));
}

function getUpdates(project: Project, images: GalleryImage[]): Update[] {
  if (project.updates?.length) {
    return project.updates;
  }

  return [
    {
      id: `${project.id}-launch`,
      campaignId: project.id,
      title: 'Campaign launched',
      content: `${project.title} is now accepting donations from MilestoneX supporters.`,
      imageUrls: images[0]?.src ? [images[0].src] : [],
      createdAt: project.createdAt,
    },
  ];
}

export function ProjectDetailsClient({ project, serverTime }: ProjectDetailsClientProps) {
  const [projectState, setProjectState] = useState(project);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('story');
  const [countdown, setCountdown] = useState<Countdown | null>(() =>
    project.deadline ? getCountdown(project.deadline, getServerTimeMs(serverTime)) : null
  );

  const images = useMemo(() => getProjectImages(projectState), [projectState]);
  const updates = useMemo(() => getUpdates(projectState, images), [projectState, images]);
  const currentAmount = toNumber(projectState.currentAmount);
  const targetAmount = toNumber(projectState.targetAmount);
  const donorCount = getDonorCount(projectState);
  const daysRemaining = getDaysRemaining(projectState);

  const countdownLabel = projectState.deadline
    ? countdown
      ? countdown.totalSeconds > 0
        ? formatCountdown(countdown)
        : 'Campaign Ended'
      : typeof daysRemaining === 'number'
      ? `${daysRemaining} days`
      : 'Open'
    : typeof daysRemaining === 'number'
    ? `${daysRemaining} days`
    : 'Open';

  useEffect(() => {
    if (!project.deadline) {
      return;
    }

    const initialServerMs = getServerTimeMs(serverTime);
    const startPerf = performance.now();

    const tick = () => {
      const elapsedMs = performance.now() - startPerf;
      setCountdown(getCountdown(project.deadline!, initialServerMs + Math.round(elapsedMs)));
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [project.deadline, serverTime]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  function handleDonationSuccess(receipt: DonationReceipt) {
    setProjectState((current) => ({
      ...current,
      currentAmount: String(toNumber(current.currentAmount) + receipt.usdEquivalent),
      donorCount: getDonorCount(current) + 1,
    }));
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: projectState.title,
        text: projectState.summary || projectState.description,
        url: shareUrl || window.location.href,
      });
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Support ${projectState.title} on MilestoneX.`);
  const socialLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const tabs: { id: TabKey; label: string; count?: number }[] = [
    { id: 'story', label: 'Story & Creator' },
    { id: 'updates', label: 'Updates', count: updates.length },
    { id: 'milestones', label: 'Milestones', count: projectState.milestones?.length || 0 },
    { id: 'contract', label: 'Smart Contract', count: projectState.contract?.transactionHistory?.length },
    { id: 'donors', label: 'Donors', count: projectState.donorsList?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      <div className="border-b border-neutral-200 bg-white pt-24">
        <div className="container mx-auto max-w-[1280px] px-4 py-5">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="h-4 w-4 text-neutral-300" />
            <Link href="/projects" className="hover:text-primary-600">Projects</Link>
            <ChevronRight className="h-4 w-4 text-neutral-300" />
            <span className="max-w-[260px] truncate text-neutral-900">{projectState.title}</span>
          </nav>
        </div>
      </div>

      <main className="container mx-auto max-w-[1280px] px-4 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-8">
            <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold uppercase text-secondary-700">
                      {projectState.category || 'Community'}
                    </span>
                    {projectState.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase text-primary-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                    {projectState.isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-3 py-1 text-xs font-bold uppercase text-danger-700">
                        <Zap className="h-3.5 w-3.5" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-5xl">
                    {projectState.title}
                  </h1>
                  <p className="mt-4 text-base leading-7 text-neutral-600 md:text-lg">
                    {projectState.summary || projectState.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                    aria-label="Share project"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                    aria-label="Copy project link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {images.length ? (
                <ImageGallery images={images} />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-neutral-200 bg-gradient-to-br from-primary-100 via-white to-secondary-100">
                  <Sparkles className="h-12 w-12 text-primary-500" />
                </div>
              )}
              {copied && <p className="mt-3 text-sm font-semibold text-success-700">Project link copied.</p>}
            </section>

            {/* Tabs Navigation */}
            <nav className="flex items-center gap-2 border-b border-neutral-200 pb-px overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors",
                      isActive ? "text-primary-700" : "text-neutral-500 hover:text-neutral-700"
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={clsx(
                        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
                        isActive ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-600"
                      )}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                        initial={false}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'story' && <StoryTab project={projectState} />}
              {activeTab === 'updates' && <UpdatesTab updates={updates} />}
              {activeTab === 'milestones' && <MilestonesTab project={projectState} />}
              {activeTab === 'contract' && <SmartContractTab project={projectState} />}
              {activeTab === 'donors' && <DonorsTab project={projectState} />}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <FundingProgress
              currentAmount={currentAmount}
              targetAmount={targetAmount}
              currency={projectState.currency}
              donorCount={donorCount}
              daysRemaining={daysRemaining}
            />

            <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setIsDonationOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-bold text-white shadow-stellar transition hover:bg-primary-700"
              >
                <Heart className="h-5 w-5" />
                Donate Now
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-neutral-50 p-3">
                  <CalendarDays className="h-4 w-4 text-warning-500" />
                  <p className="mt-2 font-bold text-neutral-900">{countdownLabel}</p>
                  <p className="text-xs text-neutral-500">Campaign window</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3">
                  <ExternalLink className="h-4 w-4 text-primary-500" />
                  <p className="mt-2 font-bold text-neutral-900">{projectState.status || 'Active'}</p>
                  <p className="text-xs text-neutral-500">Status</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase text-neutral-500">Share Campaign</h2>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { href: socialLinks.x, label: 'Share on X', icon: FaXTwitter },
                  { href: socialLinks.facebook, label: 'Share on Facebook', icon: FaFacebookF },
                  { href: socialLinks.whatsapp, label: 'Share on WhatsApp', icon: FaWhatsapp },
                  { href: socialLinks.linkedin, label: 'Share on LinkedIn', icon: FaLinkedinIn },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </section>

            <section className={clsx('rounded-xl border p-5 shadow-sm', projectState.isUrgent ? 'border-danger-200 bg-danger-50' : 'border-primary-100 bg-primary-50')}>
              <h2 className={clsx('text-sm font-bold uppercase', projectState.isUrgent ? 'text-danger-700' : 'text-primary-700')}>
                {projectState.isUrgent ? 'Urgent Need' : 'Verified Impact'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {projectState.isUrgent
                  ? 'This campaign has been marked urgent due to time-sensitive needs.'
                  : 'Project information is reviewed so donors can support with confidence.'}
              </p>
            </section>
          </aside>
        </div>
      </main>

      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onSuccess={handleDonationSuccess}
        project={{
          id: projectState.id,
          title: projectState.title,
          imageUrl: projectState.imageUrl || images[0]?.src,
        }}
      />
    </div>
  );
}

export default ProjectDetailsClient;
