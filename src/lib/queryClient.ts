import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 10000, // Poll every 10 seconds
      staleTime: 5000, // Consider fresh for 5 seconds
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

