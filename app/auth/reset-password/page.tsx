import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | MilestoneX',
  description: 'Create a new password for your MilestoneX account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}