import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { createVerificationRequest } from './fetch';
import type { CreateVerificationRequest } from './types';

export function useCreateVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVerificationRequest) => createVerificationRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.verification.all });
    },
  });
}
