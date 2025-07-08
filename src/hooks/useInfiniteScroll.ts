
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  threshold?: number;
}

export const useInfiniteScroll = (
  loadMore: () => void,
  options: UseInfiniteScrollOptions
) => {
  const { hasNextPage, isLoading, threshold = 100 } = options;
  const [isFetching, setIsFetching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Para scroll infinito no final (lista de conversas)
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      setIsFetching(true);
      loadMore();
    }
  }, [loadMore, isLoading, hasNextPage, threshold]);

  const handleScrollTop = useCallback(() => {
    if (!containerRef.current || isLoading || !hasNextPage) return;

    const { scrollTop } = containerRef.current;
    
    // Para scroll infinito no topo (mensagens antigas)
    if (scrollTop < threshold) {
      setIsFetching(true);
      loadMore();
    }
  }, [loadMore, isLoading, hasNextPage, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScrollTop);
    return () => container.removeEventListener('scroll', handleScrollTop);
  }, [handleScrollTop]);

  useEffect(() => {
    if (!isLoading) {
      setIsFetching(false);
    }
  }, [isLoading]);

  return { containerRef, isFetching };
};
