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
    ? 'lg:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:grid-cols-[320px_minmax(0,720px)_320px] 2xl:justify-center'
    : hasLeftRail
      ? 'lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,720px)] 2xl:justify-center'
      : hasRightRail
        ? 'lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,720px)_320px] 2xl:justify-center'
        : 'lg:grid-cols-1';

  useEffect(() => onHomeReset(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }), []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 relative transition-colors duration-300">
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

      <div className="relative z-10 w-full px-2 sm:px-3 lg:px-4">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none z-0" />
        <div className={`relative z-10 mx-auto max-w-[1680px] grid grid-cols-1 items-start ${gridColumns} gap-4 lg:gap-6`}>
          {hasLeftRail ? (
            <>
              <div className="hidden lg:block">
                <CategorySidebar
                  variant="desktop"
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  translations={translations}
                />
              </div>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-[320px] max-w-[88vw]">
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
            } ${hasLeftRail && hasRightRail ? 'lg:max-w-[720px] lg:justify-self-center' : ''}`}
          >
            {children}
          </main>
          {hasRightRail ? (
            <aside className="hidden lg:block w-[320px] shrink-0">
              <div className="sticky top-[var(--vk-header-height)]">
                {rightRail}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
