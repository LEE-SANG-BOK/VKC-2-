'use client';

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Header from "@/components/organisms/Header";
import CategorySidebar from "@/components/organisms/CategorySidebar";
import AccountStatusBanner from "@/components/molecules/banners/AccountStatusBanner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { onHomeReset } from "@/utils/homeReset";

interface MainLayoutProps {
  children: ReactNode;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideSidebar?: boolean;
  hideSearch?: boolean;
  rightRail?: ReactNode;
  centerVariant?: 'panel' | 'canvas';
  translations: Record<string, unknown>;
}

export default function MainLayout({ children, selectedCategory = 'all', onCategoryChange, hideSidebar = false, hideSearch = false, rightRail, centerVariant = 'panel', translations }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasLeftRail = !hideSidebar;
  const hasRightRail = Boolean(rightRail);
  const gridColumns = hasLeftRail && hasRightRail
    ? 'lg:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:grid-cols-[320px_minmax(0,920px)_320px] 2xl:justify-center'
    : hasLeftRail
      ? 'lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,920px)] 2xl:justify-center'
      : hasRightRail
        ? 'lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,920px)_320px] 2xl:justify-center'
        : 'lg:grid-cols-1';

  useEffect(() => onHomeReset(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }), []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-100 dark:bg-gray-950 relative transition-colors duration-300">
      {/* Account Status Banner */}
      <AccountStatusBanner />

      <Suspense fallback={<div className="h-[56px] w-full" />}>
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          hideSearch={hideSearch}
          translations={translations}
        />
      </Suspense>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none z-0" />
        <div className={`relative z-10 mx-auto max-w-[1680px] grid grid-cols-1 items-start ${gridColumns} gap-4 lg:gap-6`}>
          {hasLeftRail ? (
            <>
              <aside className="hidden lg:block lg:justify-self-start sticky top-[var(--vk-header-height)] h-[calc(100vh-var(--vk-header-height))] h-[calc(100dvh-var(--vk-header-height))]">
                <CategorySidebar
                  variant="desktop"
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  translations={translations}
                />
              </aside>
	              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
	                <SheetContent side="left" showCloseButton={false} className="p-0 w-[320px] sm:w-[360px] max-w-[85vw]">
	                  <CategorySidebar
	                    variant="mobile"
	                    setIsMobileMenuOpen={setIsMobileMenuOpen}
	                    selectedCategory={selectedCategory}
                    onCategoryChange={onCategoryChange}
                    translations={translations}
                  />
                </SheetContent>
              </Sheet>
            </>
          ) : null}
          <main
            className={`min-w-0 w-full ${
              centerVariant === 'canvas' ? 'bg-transparent' : 'bg-white dark:bg-gray-900'
            } ${hasLeftRail || hasRightRail ? 'lg:max-w-[920px] lg:justify-self-center' : ''}`}
          >
            {hasRightRail ? (
              <div className="lg:hidden mb-4">
                {rightRail}
              </div>
            ) : null}
            {children}
          </main>
          {hasRightRail ? (
            <aside className="hidden lg:block w-full lg:w-[320px] shrink-0 lg:justify-self-end">
              {rightRail}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
