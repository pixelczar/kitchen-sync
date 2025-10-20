import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
      gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s or auth errors
        if (error?.message?.includes('404') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 2; // Reduce retries to save costs
      },
      refetchOnWindowFocus: false, // Disable aggressive refetching
      refetchOnMount: false, // Use cache when available
      refetchOnReconnect: true,
    },
  },
});

