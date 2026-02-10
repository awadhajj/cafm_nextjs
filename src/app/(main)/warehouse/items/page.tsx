'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { warehouseApi } from '@/lib/api/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { Item } from '@/types/warehouse';
import {
  Package,
  Plus,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

export default function ItemsListPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { hasPermission } = useAuth();

  const {
    data: itemsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['warehouse-items', search, categoryFilter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category_id = categoryFilter;
      return warehouseApi.items.list(params);
    },
  });

  const items = itemsData?.data || [];

  // Extract unique categories from items for the filter
  const categories = items.reduce(
    (acc: { id: string; label: string }[], item: Item) => {
      if (item.category && !acc.find((c) => c.id === item.category!.id)) {
        acc.push(item.category);
      }
      return acc;
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const clearFilters = useCallback(() => {
    setCategoryFilter('');
    setShowFilters(false);
  }, []);

  const hasActiveFilters = !!categoryFilter;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Items"
        subtitle={itemsData?.pagination ? `${itemsData.pagination.total} items` : undefined}
        showBack
        backHref="/warehouse"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative rounded-lg p-2 hover:bg-muted ${hasActiveFilters ? 'text-primary' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            {hasPermission('warehouse.items.create') && (
              <button
                onClick={() => router.push('/warehouse/items/new')}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 py-3">
        <SearchBar onSearch={handleSearch} placeholder="Search items by name, number, barcode..." />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-primary"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border border-border text-muted-foreground'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border border-border text-muted-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items found"
              description={
                search || categoryFilter
                  ? 'No items match your search or filter criteria'
                  : 'No warehouse items have been added yet'
              }
              action={
                hasPermission('warehouse.items.create') ? (
                  <button
                    onClick={() => router.push('/warehouse/items/new')}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Add First Item
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {items.map((item: Item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/warehouse/items/${item.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.item_number}</span>
                      {item.barcode && <span>| {item.barcode}</span>}
                    </div>
                    {item.category && (
                      <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {item.category.label}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.unit_price !== undefined && item.unit_price !== null && (
                      <p className="text-sm font-semibold">${item.unit_price.toFixed(2)}</p>
                    )}
                    {item.stores && item.stores.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.stores.reduce((sum, s) => sum + s.available_quantity, 0)} avail.
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
