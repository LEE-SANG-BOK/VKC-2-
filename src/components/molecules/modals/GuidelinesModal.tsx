'use client';

import { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import Modal from '@/components/atoms/Modal';
import { Button } from '@/components/ui/button';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  confirmLabel: string;
}

export default function GuidelinesModal({ isOpen, onClose, title, items, confirmLabel }: GuidelinesModalProps) {
  const cleanedItems = useMemo(() => items.map((item) => item.trim()).filter(Boolean), [items]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 p-4">
          <ShieldAlert className="h-5 w-5 text-amber-800 dark:text-amber-100 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{title}</p>
            <ul className="text-sm text-amber-900/90 dark:text-amber-50 space-y-1.5 list-disc list-inside">
              {cleanedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onClose} className="h-11 rounded-full px-6">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

