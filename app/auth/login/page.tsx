import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | MilestoneX',
  description:
    'Sign in to your MilestoneX account to continue supporting causes on the Stellar Network.',
};

export default function LoginPage() {
  return <LoginForm />;
}
