import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from './fetch';
import { adminQueryKeys } from './query';

export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.auth.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.session });
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.auth.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, suspendDays }: { id: string; status: string; suspendDays?: number }) =>
      adminFetch.users.updateStatus(id, status, suspendDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.posts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.comments.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: string; reviewNote?: string; deleteTarget?: boolean };
    }) => adminFetch.reports.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useUpdateVerificationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status: string;
        reason?: string;
        verifiedProfileSummary?: string | null;
        verifiedProfileKeywords?: string[] | null;
      };
    }) => adminFetch.verifications.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.verifications.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.categories.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        slug?: string;
        parentId?: string | null;
        order?: number;
        isActive?: boolean;
      };
    }) => adminFetch.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.categories.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.notifications.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.notifications.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications.all });
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.news.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.news.all });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        category?: string;
        content?: string;
        language?: string;
        imageUrl?: string | null;
        linkUrl?: string | null;
        isActive?: boolean;
        order?: number;
      };
    }) => adminFetch.news.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.news.all });
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminFetch.news.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.news.all });
    },
  });
}
