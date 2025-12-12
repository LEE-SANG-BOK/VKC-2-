'use client';

import { Suspense, useState, type ReactNode } from "react";
import Header from "@/components/organisms/Header";
import CategorySidebar from "@/components/organisms/CategorySidebar";
import AccountStatusBanner from "@/components/molecules/AccountStatusBanner";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideSidebar?: boolean;
  hideSearch?: boolean;
  rightRail?: ReactNode;
  translations: Record<string, unknown>;
}

export default function MainLayout({ children, selectedCategory = 'all', onCategoryChange, hideSidebar = false, hideSearch = false, rightRail, translations }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      {/* Account Status Banner */}
      <AccountStatusBanner />
      
      {/* Background gradient */}
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none z-0"></div>

      <Suspense fallback={<div className="h-[56px] w-full" />}>
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          hideSearch={hideSearch}
          translations={translations}
        />
      </Suspense>

      <div className="container mx-auto px-2 sm:px-3 lg:px-5 relative z-10">
        <div className="flex gap-4 lg:gap-6">
          {!hideSidebar && (
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
          )}
          <main className="flex-1 min-w-0">
            {children}
          </main>
          {rightRail ? (
            <aside className="hidden lg:block w-[320px] shrink-0">
              <div className="sticky top-[57px]">
                {rightRail}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
