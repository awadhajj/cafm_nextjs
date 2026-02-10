'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { locationsApi } from '@/lib/api/locations';
import { LocationTree } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LOCATION_TYPE_COLORS: Record<string, string> = {
  campus: 'bg-purple-100 text-purple-700',
  building: 'bg-blue-100 text-blue-700',
  floor: 'bg-green-100 text-green-700',
  room: 'bg-orange-100 text-orange-700',
};

const LOCATION_TYPE_FILTERS = [
  { key: '', label: 'All Types' },
  { key: 'campus', label: 'Campus' },
  { key: 'building', label: 'Building' },
  { key: 'floor', label: 'Floor' },
  { key: 'room', label: 'Room' },
];

function filterTree(
  nodes: LocationTree[],
  search: string,
  typeFilter: string
): LocationTree[] {
  const lowerSearch = search.toLowerCase();

  return nodes.reduce<LocationTree[]>((acc, node) => {
    const filteredChildren = filterTree(node.children, search, typeFilter);

    const nameMatches = !search || node.name.toLowerCase().includes(lowerSearch);
    const typeMatches = !typeFilter || node.type === typeFilter;
    const selfMatches = nameMatches && typeMatches;

    if (selfMatches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: selfMatches && !search && !typeFilter
          ? node.children
          : filteredChildren,
      });
    }

    return acc;
  }, []);
}

interface TreeNodeProps {
  node: LocationTree;
  depth: number;
  defaultExpanded?: boolean;
}

function TreeNode({ node, depth, defaultExpanded = false }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border"
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-6 flex-shrink-0" />
        )}

        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-muted">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <Link
          href={`/properties/${node.id}`}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          <p className="flex-1 text-sm font-medium truncate min-w-0">
            {node.name}
          </p>
          <span
            className={cn(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
              LOCATION_TYPE_COLORS[node.type] || 'bg-muted text-muted-foreground'
            )}
          >
            {node.type}
          </span>
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['locations-full-tree'],
    queryFn: () => locationsApi.getFullTree(),
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const allTrees: LocationTree[] = data?.data || [];

  const filteredTrees = useMemo(
    () => filterTree(allTrees, debouncedSearch, typeFilter),
    [allTrees, debouncedSearch, typeFilter]
  );

  const isFiltering = !!debouncedSearch || !!typeFilter;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Properties"
        subtitle="Locations & Spaces"
        actions={
          <Button size="icon" className="rounded-full" asChild>
            <Link href="/properties/new">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        }
      />

      {/* Search and Filter Bar */}
      <div className="border-b border-border bg-background px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search locations..."
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex-shrink-0',
              showFilters || typeFilter
                ? 'border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>
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

      {/* Legend */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 overflow-x-auto bg-background">
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          Types:
        </span>
        {Object.entries(LOCATION_TYPE_COLORS).map(([type, color]) => (
          <span
            key={type}
            className={cn(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
              color
            )}
          >
            {type}
          </span>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {filteredTrees.length === 0 ? (
            <EmptyState
              icon={isFiltering ? GitBranch : Building2}
              title="No locations found"
              description={
                isFiltering
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first location'
              }
              action={
                !isFiltering ? (
                  <Button asChild>
                    <Link href="/properties/new">
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div>
              {filteredTrees.map((tree) => (
                <TreeNode
                  key={tree.id}
                  node={tree}
                  depth={0}
                  defaultExpanded={isFiltering}
                />
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
