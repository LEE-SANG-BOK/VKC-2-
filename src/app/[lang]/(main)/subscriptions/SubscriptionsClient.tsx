'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import LoginPrompt from '@/components/organisms/LoginPrompt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, useMySubscriptions, useSubscriptionSettings } from '@/repo/categories/query';
import { useToggleSubscription, useUpdateSubscriptionSettings } from '@/repo/categories/mutation';
import type {
  NotificationChannel,
  NotificationFrequency,
  SubscriptionNotificationSetting,
} from '@/repo/categories/types';
import { LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

interface SubscriptionsClientProps {
  translations: Record<string, unknown>;
  lang: string;
}

const DEFAULT_CHANNEL: NotificationChannel = 'in_app';
const DEFAULT_FREQUENCY: NotificationFrequency = 'instant';

export default function SubscriptionsClient({ translations, lang }: SubscriptionsClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user?.id;

  const tSubscription = (translations?.subscription || {}) as Record<string, string>;
  const tSidebar = (translations?.sidebar || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;

  const copy = useMemo(() => {
    return {
      title: tSubscription.title || '',
      description: tSubscription.description || '',
      subscribedCount: tSubscription.subscribedCount || 'You are subscribed to {count} categories.',
      manageTitle: tSidebar.mySubscriptions || 'My subscriptions',
      manageDesc: tSubscription.manageDesc || tSubscription.description || '',
      settingsTitle: tSubscription.settingsTitle || '',
      settingsDesc: tSubscription.settingsDesc || '',
      categoriesLabel: tSidebar.categories || 'Categories',
      topicsLabel: tSubscription.topicsLabel || '',
      subscribeLabel: tSidebar.subscribe || 'Subscribe',
      subscribedLabel: tSidebar.subscribedLabel || tSidebar.subscribed || 'Subscribed',
      subscribedToast: tSidebar.subscribedToast || 'Subscribed.',
      unsubscribedToast: tSidebar.unsubscribedToast || 'Unsubscribed.',
      subscribeError: tSidebar.subscribeError || 'Failed to update subscription.',
      noSubscriptions: tSidebar.noSubscriptions || 'No subscriptions yet.',
      channelLabel: tSubscription.channelLabel || '',
      frequencyLabel: tSubscription.frequencyLabel || '',
      channelInApp: tSubscription.channelInApp || '',
      channelEmail: tSubscription.channelEmail || '',
      channelPush: tSubscription.channelPush || '',
      frequencyInstant: tSubscription.frequencyInstant || '',
      frequencyDaily: tSubscription.frequencyDaily || '',
      frequencyWeekly: tSubscription.frequencyWeekly || '',
      frequencyOff: tSubscription.frequencyOff || '',
      loading: tCommon.loading || 'Loading...',
      updateError: tSubscription.updateError || '',
      unknownCategory: tCommon.uncategorized || '',
    };
  }, [tSubscription, tSidebar, tCommon]);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: mySubscriptions, isLoading: subscriptionsLoading } = useMySubscriptions(isLoggedIn);
  const { data: subscriptionSettings, isLoading: settingsLoading } = useSubscriptionSettings(isLoggedIn);

  const { mutate: toggleSubscription } = useToggleSubscription();
  const updateSubscriptionSettings = useUpdateSubscriptionSettings();

  const [pendingSettingId, setPendingSettingId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const subscribedIds = useMemo(() => new Set((mySubscriptions || []).map((sub) => sub.id)), [mySubscriptions]);

  const settingsByCategoryId = useMemo(() => {
    const map = new Map<string, SubscriptionNotificationSetting>();
    (subscriptionSettings || []).forEach((setting) => {
      map.set(setting.categoryId, setting);
    });
    return map;
  }, [subscriptionSettings]);

  const categoryMeta = useMemo(() => {
    const legacyBySlug = new Map(LEGACY_CATEGORIES.map((cat) => [cat.slug, cat]));
    const resolveName = (slug: string, fallback: string) => {
      const legacy = legacyBySlug.get(slug);
      return legacy ? getCategoryName(legacy, lang) : fallback;
    };

    const map = new Map<
      string,
      {
        name: string;
        slug: string;
        parentName?: string;
      }
    >();

    (categories || []).forEach((category) => {
      const parentName = resolveName(category.slug, category.name);
      map.set(category.id, { name: parentName, slug: category.slug });
      (category.children || []).forEach((child) => {
        const childName = resolveName(child.slug, child.name);
        map.set(child.id, { name: childName, slug: child.slug, parentName });
      });
    });

    return map;
  }, [categories, lang]);

  const subscribedCountText = copy.subscribedCount.replace('{count}', String(subscribedIds.size));
  const isLoading = status === 'loading' || categoriesLoading || (isLoggedIn && (subscriptionsLoading || settingsLoading));

  const handleToggleSubscription = (categoryId: string) => {
    if (pendingToggleId) return;
    setPendingToggleId(categoryId);

    toggleSubscription(categoryId, {
      onSuccess: (res) => {
        const message = res?.isSubscribed ? copy.subscribedToast : copy.unsubscribedToast;
        toast.success(message);
      },
      onError: () => {
        toast.error(copy.subscribeError);
      },
      onSettled: () => {
        setPendingToggleId(null);
      },
    });
  };

  const handleSettingChange = async (categoryId: string, update: { channel?: NotificationChannel; frequency?: NotificationFrequency }) => {
    const current = settingsByCategoryId.get(categoryId);
    const currentChannel = current?.notificationChannel || DEFAULT_CHANNEL;
    const currentFrequency = current?.notificationFrequency || DEFAULT_FREQUENCY;

    if (update.channel && update.channel === currentChannel) return;
    if (update.frequency && update.frequency === currentFrequency) return;

    setPendingSettingId(categoryId);
    try {
      await updateSubscriptionSettings.mutateAsync({
        categoryId,
        notificationChannel: update.channel,
        notificationFrequency: update.frequency,
      });
    } catch {
      toast.error(copy.updateError);
    } finally {
      setPendingSettingId(null);
    }
  };

  if (!isLoggedIn && status !== 'loading') {
    return (
      <div className="px-4 py-10">
        <LoginPrompt onClose={() => router.push(`/${lang}`)} translations={translations as any} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{copy.description}</p>
          </div>
          {isLoggedIn ? (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">{subscribedCountText}</div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{copy.manageTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{copy.manageDesc}</p>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{copy.loading}</div>
          ) : (
            <div className="space-y-4">
              {(categories || []).map((category) => {
                const parentMeta = categoryMeta.get(category.id);
                const parentName = parentMeta?.name || category.name || copy.unknownCategory;
                const parentSubscribed = subscribedIds.has(category.id);

                return (
                  <div
                    key={category.id}
                    className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{parentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{copy.categoriesLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSubscription(category.id)}
                        disabled={pendingToggleId === category.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                          parentSubscribed
                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                        } ${pendingToggleId === category.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {parentSubscribed ? copy.subscribedLabel : copy.subscribeLabel}
                      </button>
                    </div>

                    {category.children && category.children.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{copy.topicsLabel}</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {category.children.map((child) => {
                            const childMeta = categoryMeta.get(child.id);
                            const childName = childMeta?.name || child.name || copy.unknownCategory;
                            const childSubscribed = subscribedIds.has(child.id);

                            return (
                              <div
                                key={child.id}
                                className="flex min-w-0 flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <span className="min-w-0 flex-1 text-sm text-gray-800 dark:text-gray-100 break-words sm:truncate">
                                  {childName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubscription(child.id)}
                                  disabled={pendingToggleId === child.id}
                                  className={`shrink-0 self-end text-center whitespace-normal break-words text-xs font-semibold px-2.5 py-1.5 rounded-full border transition sm:self-auto sm:whitespace-nowrap sm:py-1 max-w-[140px] sm:max-w-none min-h-[32px] sm:min-h-0 ${
                                    childSubscribed
                                      ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                                  } ${pendingToggleId === child.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  <span className="block leading-snug">
                                    {childSubscribed ? copy.subscribedLabel : copy.subscribeLabel}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{copy.settingsTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{copy.settingsDesc}</p>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{copy.loading}</div>
          ) : (mySubscriptions || []).length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{copy.noSubscriptions}</div>
          ) : (
            <div className="space-y-3">
              {(mySubscriptions || []).map((subscription) => {
                const meta = categoryMeta.get(subscription.id);
                const label = meta?.name || subscription.name || copy.unknownCategory;
                const parentLabel = meta?.parentName;
                const settings = settingsByCategoryId.get(subscription.id);
                const channel = settings?.notificationChannel || DEFAULT_CHANNEL;
                const frequency = settings?.notificationFrequency || DEFAULT_FREQUENCY;
                const isPending = pendingSettingId === subscription.id;

                return (
                  <div
                    key={subscription.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{label}</div>
                        {parentLabel ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{parentLabel}</div>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{copy.subscribedLabel}</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{copy.channelLabel}</span>
                        <Select
                          value={channel}
                          onValueChange={(value) => handleSettingChange(subscription.id, { channel: value as NotificationChannel })}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[140px]" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_app">{copy.channelInApp}</SelectItem>
                            <SelectItem value="email">{copy.channelEmail}</SelectItem>
                            <SelectItem value="push">{copy.channelPush}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{copy.frequencyLabel}</span>
                        <Select
                          value={frequency}
                          onValueChange={(value) => handleSettingChange(subscription.id, { frequency: value as NotificationFrequency })}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[140px]" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">{copy.frequencyInstant}</SelectItem>
                            <SelectItem value="daily">{copy.frequencyDaily}</SelectItem>
                            <SelectItem value="weekly">{copy.frequencyWeekly}</SelectItem>
                            <SelectItem value="off">{copy.frequencyOff}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
