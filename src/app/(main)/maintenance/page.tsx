'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { workOrdersApi } from '@/lib/api/work-orders';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { ppmApi } from '@/lib/api/ppm';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Wrench, ClipboardList, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: Record<string, { label: string; value: string }[]> = {
  work_orders: [
    { label: 'All', value: '' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  service_requests: [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Closed', value: 'closed' },
  ],
  ppm: [
    { label: 'All', value: '' },
    { label: 'Published', value: 'published' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending Verification', value: 'pending_verification' },
    { label: 'On Hold', value: 'on_hold' },
  ],
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600',
  high: 'text-orange-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('work_orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [search, statusFilter]);

  const { data: woData, isLoading: woLoading } = useQuery({
    queryKey: ['work-orders', queryParams],
    queryFn: () => workOrdersApi.list(queryParams),
    enabled: activeTab === 'work_orders',
  });

  const { data: srData, isLoading: srLoading } = useQuery({
    queryKey: ['service-requests', queryParams],
    queryFn: () => serviceRequestsApi.list(queryParams),
    enabled: activeTab === 'service_requests',
  });

  const { data: ppmData, isLoading: ppmLoading } = useQuery({
    queryKey: ['ppm-work-orders', queryParams],
    queryFn: () => ppmApi.list(queryParams),
    enabled: activeTab === 'ppm',
  });

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearch('');
    setStatusFilter('');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const workOrders = woData?.data || [];
  const serviceRequests = srData?.data || [];
  const ppmWorkOrders = ppmData?.data || [];

  const tabs = [
    { key: 'work_orders', label: 'Work Orders', count: woData?.pagination?.total },
    { key: 'service_requests', label: 'Service Requests', count: srData?.pagination?.total },
    { key: 'ppm', label: 'PPM', count: ppmData?.pagination?.total },
  ];

  const isLoading =
    (activeTab === 'work_orders' && woLoading) ||
    (activeTab === 'service_requests' && srLoading) ||
    (activeTab === 'ppm' && ppmLoading);

  const statusOptions = STATUS_OPTIONS[activeTab] || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Maintenance" />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Search and Filter Bar */}
      <div className="space-y-3 border-b border-border bg-white px-4 py-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder={
            activeTab === 'work_orders'
              ? 'Search work orders...'
              : activeTab === 'service_requests'
              ? 'Search service requests...'
              : 'Search PPM work orders...'
          }
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoading />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Work Orders Tab */}
          {activeTab === 'work_orders' && (
            <>
              {workOrders.length === 0 ? (
                <EmptyState
                  icon={Wrench}
                  title="No work orders"
                  description="Work orders assigned to you will appear here"
                />
              ) : (
                <div className="divide-y divide-border">
                  {workOrders.map((wo) => (
                    <button
                      key={wo.id}
                      onClick={() => router.push(`/maintenance/work-orders/${wo.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {wo.work_order_number}
                          </span>
                          <StatusBadge status={wo.status} />
                        </div>
                        <p className="mt-1 text-sm font-medium truncate">
                          {wo.title || wo.description || 'Untitled Work Order'}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          {wo.priority && (
                            <span className={cn('font-medium', PRIORITY_COLORS[wo.priority] || '')}>
                              {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)}
                            </span>
                          )}
                          {wo.craft && <span>{wo.craft.craft_name}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Service Requests Tab */}
          {activeTab === 'service_requests' && (
            <>
              {serviceRequests.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No service requests"
                  description="Service requests will appear here"
                />
              ) : (
                <div className="divide-y divide-border">
                  {serviceRequests.map((sr) => (
                    <button
                      key={sr.id}
                      onClick={() => router.push(`/maintenance/service-requests/${sr.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {sr.service_request_number}
                          </span>
                          <StatusBadge status={sr.status} />
                        </div>
                        <p className="mt-1 text-sm font-medium truncate">{sr.title}</p>
                        {sr.serviceType && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {sr.serviceType.label}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PPM Tab */}
          {activeTab === 'ppm' && (
            <>
              {ppmWorkOrders.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No PPM work orders"
                  description="Planned preventive maintenance orders will appear here"
                />
              ) : (
                <div className="divide-y divide-border">
                  {ppmWorkOrders.map((ppm) => (
                    <button
                      key={ppm.id}
                      onClick={() => router.push(`/maintenance/ppm/${ppm.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {ppm.ppm_wo_number}
                          </span>
                          <StatusBadge status={ppm.status} />
                        </div>
                        <p className="mt-1 text-sm font-medium truncate">
                          {ppm.description || 'PPM Work Order'}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          {ppm.priority && (
                            <span className={cn('font-medium', PRIORITY_COLORS[ppm.priority] || '')}>
                              {ppm.priority.charAt(0).toUpperCase() + ppm.priority.slice(1)}
                            </span>
                          )}
                          {ppm.asset && <span>{ppm.asset.asset_name}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
