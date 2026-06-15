import Signup from './SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | MilestoneX',
  description:
    'Sign up for an MilestoneX account to start supporting causes on the Stellar Network.',
};

export default function SignupPage() {
  return <Signup />;
}

