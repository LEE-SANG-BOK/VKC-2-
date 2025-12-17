'use client';

import { Toaster } from '@/components/ui/sonner';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof Toaster>;

export default function AppToaster(props: Props) {
  return <Toaster {...props} />;
}

