'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Modal from '@/components/atoms/Modal';
import LoginPrompt from '@/components/organisms/LoginPrompt';

type LoginPromptContextValue = {
  openLoginPrompt: () => void;
  closeLoginPrompt: () => void;
};

type LoginPromptTranslations = {
  login?: {
    title?: string;
    desc?: string;
    login?: string;
    signup?: string;
    cancel?: string;
  };
  common?: {
    signup?: string;
    cancel?: string;
    login?: string;
  };
};

const LoginPromptContext = createContext<LoginPromptContextValue | null>(null);

export default function LoginPromptProvider({
  children,
  translations,
}: {
  children: React.ReactNode;
  translations: Record<string, unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginPrompt = useCallback(() => setIsOpen(true), []);
  const closeLoginPrompt = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      openLoginPrompt,
      closeLoginPrompt,
    }),
    [openLoginPrompt, closeLoginPrompt]
  );

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      <Modal isOpen={isOpen} onClose={closeLoginPrompt}>
        <LoginPrompt
          onClose={closeLoginPrompt}
          variant="modal"
          translations={translations as unknown as LoginPromptTranslations}
        />
      </Modal>
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt(): LoginPromptContextValue {
  const value = useContext(LoginPromptContext);
  if (!value) {
    throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  }
  return value;
}
