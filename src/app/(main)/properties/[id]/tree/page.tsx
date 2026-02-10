'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers,
} from 'lucide-react';
import { locationsApi } from '@/lib/api/locations';
import { LocationTree } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';

const LOCATION_TYPE_COLORS: Record<string, string> = {
  campus: 'bg-purple-100 text-purple-700',
  building: 'bg-blue-100 text-blue-700',
  floor: 'bg-green-100 text-green-700',
  room: 'bg-orange-100 text-orange-700',
};

interface TreeNodeProps {
  node: LocationTree;
  depth: number;
  currentLocationId: string;
}

function TreeNode({ node, depth, currentLocationId }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isCurrent = node.id === currentLocationId;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border-b border-border',
          isCurrent && 'bg-primary/5'
        )}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
      >
        {/* Expand/Collapse Toggle */}
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

        {/* Node Icon */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-muted">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* Node Info */}
        <Link
          href={`/properties/${node.id}`}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm truncate',
                isCurrent ? 'font-semibold text-primary' : 'font-medium'
              )}
            >
              {node.name}
            </p>
            {node.status && (
              <p className="text-xs text-muted-foreground capitalize">
                {node.status}
              </p>
            )}
          </div>

          {/* Type Badge */}
          <span
            className={cn(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
              LOCATION_TYPE_COLORS[node.type] ||
                'bg-gray-100 text-gray-700'
            )}
          >
            {node.type}
          </span>
        </Link>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              currentLocationId={currentLocationId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyTreePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['location-tree', id],
    queryFn: () => locationsApi.getTree(id),
    enabled: !!id,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return <PageLoading />;
  }

  const tree = data?.data;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Location Hierarchy"
        showBack
        backHref={`/properties/${id}`}
      />

      {/* Legend */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 overflow-x-auto">
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

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {!tree ? (
          <EmptyState
            icon={GitBranch}
            title="No hierarchy data"
            description="The location tree could not be loaded"
          />
        ) : (
          <div>
            <TreeNode
              node={tree}
              depth={0}
              currentLocationId={id}
            />
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}
