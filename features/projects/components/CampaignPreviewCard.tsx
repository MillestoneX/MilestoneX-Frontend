'use client';

import React from 'react';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { TrustBadge } from '@/components/TrustBadge';

interface CampaignPreviewCardProps {
  formData: Record<string, unknown>;
}

export const CampaignPreviewCard: React.FC<CampaignPreviewCardProps> = ({ formData }) => {
  const title = (formData.title as string) || 'Campaign Title';
  const description = (formData.description as string) || 'Campaign description';
  const goalAmount = (formData.goalAmount as number) || 0;
  const raisedAmount = 0; // New campaigns start with 0 raised
  const endDate = new Date(Date.now() + (formData.campaignDuration as number) * 24 * 60 * 60 * 1000).toISOString();
  const currency = (formData.acceptedAssets as string[])?.[0] || 'XLM';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How your campaign will look to donors
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          This is a preview of how donors will see your campaign on the discover page.
        </p>
      </div>

      {/* Campaign Card Preview */}
      <div className="max-w-sm">
        <CampaignCard
          title={title}
          description={description}
          goalAmount={goalAmount}
          raisedAmount={raisedAmount}
          currency={currency}
          endDate={endDate}
          donorCount={0}
          creatorAddress="Your Wallet"
          isVerified={false}
        />
      </div>

      {/* Preview Details */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-4">Preview Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600">Title shown:</span>
            <span className="text-sm font-medium text-gray-900 text-right flex-1 ml-4">{title}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-600">Description:</span>
            <span className="text-sm text-gray-900 text-right flex-1 ml-4 line-clamp-2">{description}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Goal:</span>
            <span className="text-sm font-medium text-gray-900">
              {goalAmount.toLocaleString()} {currency}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Duration:</span>
            <span className="text-sm font-medium text-gray-900">
              {formData.campaignDuration as number} days
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Accepted Assets:</span>
            <div className="flex gap-1">
              {(formData.acceptedAssets as string[])?.map((asset) => (
                <span
                  key={asset}
                  className="text-xs font-semibold px-2 py-1 bg-white text-blue-600 rounded border border-blue-200"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> Your campaign will start with 0 raised. Donors will see the progress bar increase as they contribute. Your campaign will be marked as &quot;Verified&quot; after admin approval.
        </p>
      </div>
    </div>
  );
};
