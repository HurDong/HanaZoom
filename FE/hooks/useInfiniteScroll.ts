"use client";

import { useState, useEffect, useCallback } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  threshold = 200
}: UseInfiniteScrollOptions) {
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore, threshold]);

  const reset = useCallback(() => {
    setPage(0);
    setIsLoadingMore(false);
  }, []);

  const setLoadingMore = useCallback((loading: boolean) => {
    setIsLoadingMore(loading);
  }, []);

  return {
    page,
    isLoadingMore,
    loadMore,
    reset,
    setLoadingMore
  };
}
