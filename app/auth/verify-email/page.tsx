import VerifyEmail from './VerifyEmail';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email | MilestoneX',
  description: 'Verify your email address to activate your MilestoneX account.',
};

export default function VerifyEmailPage() {
  return <VerifyEmail />;
}
