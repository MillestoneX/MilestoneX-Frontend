import React from 'react';
import Image from 'next/image';
import { Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import type { Project } from '@/types/api';

interface StoryTabProps {
  project: Project;
}

export function StoryTab({ project }: StoryTabProps) {
  const creator = project.creator;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900">Campaign Story</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-neutral-700 md:text-base">
          <p>{project.story || project.description}</p>
          {project.impact && <p>{project.impact}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900">Creator</h2>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-primary-600">
            {creator?.avatar ? (
              <Image
                src={creator.avatar}
                alt={creator.name || 'Project creator'}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-8 w-8" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-900">{creator?.name || 'MilestoneX Creator'}</h3>
              {(creator?.verified || project.isVerified) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified creator
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {creator?.bio || 'This creator has submitted project documentation for MilestoneX review.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-500">
              {creator?.location || project.location ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {creator?.location || project.location}
                </span>
              ) : null}
              {creator?.email ? (
                <a href={`mailto:${creator.email}`} className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
                  <Mail className="h-4 w-4" />
                  Contact creator
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
