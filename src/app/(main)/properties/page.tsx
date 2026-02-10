'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, MapPin, Filter, ChevronRight } from 'lucide-react';
import { locationsApi } from '@/lib/api/locations';
import { Location } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';

const LOCATION_TYPE_LABELS: Record<string, string> = {
  campus: 'Campus',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

const LOCATION_TYPE_FILTERS = [
  { key: '', label: 'All Types' },
  { key: 'campus', label: 'Campus' },
  { key: 'building', label: 'Building' },
  { key: 'floor', label: 'Floor' },
  { key: 'room', label: 'Room' },
];

export default function PropertiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  const params: Record<string, string> = {};
  if (debouncedSearch) params.search = debouncedSearch;
  if (typeFilter) params.location_type = typeFilter;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['locations', debouncedSearch, typeFilter],
    queryFn: () => locationsApi.list(params),
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const locations: Location[] = data?.data || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Properties"
        subtitle="Locations & Spaces"
        actions={
          <Link
            href="/properties/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      {/* Search and Filter Bar */}
      <div className="border-b border-border bg-white px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search locations..."
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border',
              showFilters || typeFilter
                ? 'border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LOCATION_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTypeFilter(filter.key)}
                className={cn(
                  'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  typeFilter === filter.key
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {locations.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No locations found"
              description={
                debouncedSearch || typeFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first location'
              }
              action={
                !debouncedSearch && !typeFilter ? (
                  <Link
                    href="/properties/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Location
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {locations.map((location) => (
                <Link
                  key={location.id}
                  href={`/properties/${location.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {location.name}
                      </p>
                      <StatusBadge status={location.status} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{location.code}</span>
                      <span>·</span>
                      <span>
                        {LOCATION_TYPE_LABELS[location.location_type] ||
                          location.location_type}
                      </span>
                    </div>
                    {location.parent && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{location.parent.name}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
