import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about MilestoneX's mission to revolutionize charitable giving through blockchain transparency. Meet our team and discover our impact stories.",
  openGraph: {
    title: "About Us | MilestoneX",
    description: "Learn about MilestoneX's mission to revolutionize charitable giving through blockchain transparency. Meet our team and discover our impact stories.",
    url: "/about",
  },
  twitter: {
    title: "About Us | MilestoneX",
    description: "Learn about MilestoneX's mission to revolutionize charitable giving through blockchain transparency. Meet our team and discover our impact stories.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}