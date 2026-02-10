'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Edit,
  MapPin,
  ChevronRight,
  GitBranch,
  ClipboardList,
  PlusCircle,
  Image as ImageIcon,
  Hash,
  Tag,
  Info,
  Navigation,
  QrCode,
  Calendar,
} from 'lucide-react';
import { locationsApi } from '@/lib/api/locations';
import { LocationImage } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { formatDate } from '@/lib/utils';

const LOCATION_TYPE_LABELS: Record<string, string> = {
  campus: 'Campus',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationsApi.show(id),
    enabled: !!id,
  });

  const { data: imagesData } = useQuery({
    queryKey: ['location-images', id],
    queryFn: () => locationsApi.getImages(id),
    enabled: !!id,
  });

  const { data: mappingData } = useQuery({
    queryKey: ['location-mapping', id],
    queryFn: () => locationsApi.getMapping(id),
    enabled: !!id,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return <PageLoading />;
  }

  const location = data?.data;
  if (!location) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Location" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Location not found</p>
        </div>
      </div>
    );
  }

  const images: LocationImage[] = imagesData?.data || location.images || [];
  const coordinates = mappingData?.data;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={location.name}
        subtitle={location.code}
        showBack
        backHref="/properties"
        actions={
          <Link
            href={`/properties/${id}/edit`}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Edit className="h-4 w-4" />
          </Link>
        }
      />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="border-b border-border">
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="h-40 w-56 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={image.image_url}
                    alt={image.title || location.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="flex items-center justify-center border-b border-border bg-muted/30 py-8">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs">No images</span>
            </div>
          </div>
        )}

        {/* Status and Type */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={location.status} />
            <span className="text-sm text-muted-foreground">
              {LOCATION_TYPE_LABELS[location.location_type] ||
                location.location_type}
            </span>
          </div>
        </div>

        {/* Detail Fields */}
        <div className="border-b border-border divide-y divide-border">
          {/* Code */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Code</p>
              <p className="text-sm font-mono">{location.code}</p>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm">
                {LOCATION_TYPE_LABELS[location.location_type] ||
                  location.location_type}
              </p>
            </div>
          </div>

          {/* Parent Location */}
          {location.parent && (
            <Link
              href={`/properties/${location.parent_location_id}`}
              className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
            >
              <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Parent Location</p>
                <p className="text-sm text-primary">{location.parent.name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {/* Address */}
          {location.address && (
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm">{location.address}</p>
              </div>
            </div>
          )}

          {/* Map Coordinates */}
          {coordinates && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Navigation className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Coordinates</p>
                <p className="text-sm font-mono">
                  {coordinates.latitude.toFixed(6)},{' '}
                  {coordinates.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* QR Code */}
          {location.qr_code && (
            <div className="flex items-center gap-3 px-4 py-3">
              <QrCode className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">QR Code</p>
                <p className="text-sm font-mono">{location.qr_code}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {location.description && (
            <div className="flex items-start gap-3 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {location.description}
                </p>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(location.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="border-b border-border divide-y divide-border">
          <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Actions
          </p>

          {/* Create Service Request */}
          <Link
            href={`/service-requests/new?location_id=${id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <PlusCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Create Service Request</p>
              <p className="text-xs text-muted-foreground">
                Report an issue at this location
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* View Tree */}
          <Link
            href={`/properties/${id}/tree`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
              <GitBranch className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Location Hierarchy</p>
              <p className="text-xs text-muted-foreground">
                View location tree structure
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Service Requests */}
          <Link
            href={`/properties/${id}/service-requests`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <ClipboardList className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Service Requests</p>
              <p className="text-xs text-muted-foreground">
                View all service requests for this location
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Children Locations */}
        {location.children && location.children.length > 0 && (
          <div className="border-b border-border divide-y divide-border">
            <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Child Locations ({location.children.length})
            </p>
            {location.children.map((child) => (
              <Link
                key={child.id}
                href={`/properties/${child.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{child.name}</p>
                  <p className="text-xs text-muted-foreground">{child.code}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </PullToRefresh>
    </div>
  );
}
