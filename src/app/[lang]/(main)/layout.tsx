import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function MainGroupLayout({ children }: LayoutProps) {
  return children;
}
