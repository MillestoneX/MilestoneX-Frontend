'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, ExternalLink, Share2, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ShareButtons } from '@/components/campaigns/ShareButtons';
import { toast } from '@/utils/toast';
import type { Project } from '@/types/api';

interface CampaignSuccessDetailsProps {
  campaign: Project;
}

export function CampaignSuccessDetails({ campaign }: CampaignSuccessDetailsProps) {
  const [copiedField, setCopiedField] = useState<'url' | 'address' | null>(null);

  const campaignUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://milestonex.com'}/campaigns/${campaign.id}`;
  const contractAddress = campaign.contract?.contractId || campaign.contract?.sorobanAddress;
  const networkType = campaign.contract?.network || 'testnet';
  
  // Generate explorer URL based on network
  const getExplorerUrl = (address: string) => {
    if (networkType === 'public') {
      return `https://stellar.expert/explorer/public/contract/${address}`;
    } else if (networkType === 'testnet') {
      return `https://stellar.expert/explorer/testnet/contract/${address}`;
    }
    return '';
  };

  const explorerUrl = contractAddress ? getExplorerUrl(contractAddress) : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopiedField('url');
      toast.success('Campaign URL copied!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleCopyAddress = async () => {
    if (!contractAddress) return;
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopiedField('address');
      toast.success('Contract address copied!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign URL Section */}
      <Card variant="bordered" padding="lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your Campaign is Live! 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              Share this link with supporters to help your campaign reach more people.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
            <input
              type="text"
              value={campaignUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-foreground outline-none truncate"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {copiedField === 'url' ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Share Buttons Section */}
      <Card variant="bordered" padding="lg">
        <ShareButtons
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          campaignUrl={campaignUrl}
        />
      </Card>

      {/* Contract Address Section */}
      {contractAddress && (
        <Card variant="bordered" padding="lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <span>Contract Address</span>
                <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {networkType}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                View your contract details on Stellar Expert
              </p>
            </div>

            <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
              <code className="flex-1 text-xs text-foreground font-mono truncate">
                {contractAddress}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyAddress}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {copiedField === 'address' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {explorerUrl && (
              <Link href={explorerUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  fullWidth
                  className="flex items-center gap-2 justify-center"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Stellar Expert
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/campaigns/${campaign.id}`}>
          <Button variant="outline" fullWidth className="flex items-center gap-2 justify-center">
            <ExternalLink className="h-4 w-4" />
            View Campaign
          </Button>
        </Link>

        <Link href="/dashboard">
          <Button variant="primary" fullWidth className="flex items-center gap-2 justify-center">
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>

      {/* Campaign Summary Card */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Campaign Summary</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Campaign Title</p>
              <p className="text-sm font-medium text-foreground">{campaign.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
              <p className="text-sm font-medium text-foreground">
                {campaign.currency || 'XLM'} {campaign.targetAmount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-medium text-foreground">{campaign.category || 'General'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-medium text-green-600 capitalize">
                {campaign.status || 'Active'}
              </p>
            </div>
          </div>

          {campaign.location && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-medium text-foreground">{campaign.location}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps */}
      <Card variant="bordered" padding="lg" className="bg-blue-50 border-blue-200">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">
              ✓
            </span>
            Next Steps
          </h3>
          
          <ol className="space-y-2 ml-8 list-decimal">
            <li className="text-sm text-foreground">
              <strong>Share your campaign:</strong> Use the share buttons above to promote your campaign on social media
            </li>
            <li className="text-sm text-foreground">
              <strong>Monitor progress:</strong> Track donations and engagement on your dashboard
            </li>
            <li className="text-sm text-foreground">
              <strong>Post updates:</strong> Keep supporters informed with regular campaign updates
            </li>
            <li className="text-sm text-foreground">
              <strong>Manage milestones:</strong> Update milestone status as funds are received
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
