'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { assetsApi } from '@/lib/api/assets';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Package, Plus, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Asset } from '@/types/asset';

export default function AssetsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['assets', search, page],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page) };
      if (search) params.search = search;
      return assetsApi.list(params);
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  const assets = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Assets"
        actions={
          <button
            onClick={() => router.push('/assets/new')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search assets..."
        />
      </div>

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {assets.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No assets found"
              description={
                search
                  ? 'Try adjusting your search terms'
                  : 'Assets will appear here once created'
              }
            />
          ) : (
            <div className="space-y-2 px-4 pb-4">
              {assets.map((asset: Asset) => (
                <button
                  key={asset.id}
                  onClick={() => router.push(`/assets/${asset.id}`)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-white p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {asset.asset_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.asset_number}
                        </p>
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>
                    {asset.location && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{asset.location.name}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={page >= pagination.last_page}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
