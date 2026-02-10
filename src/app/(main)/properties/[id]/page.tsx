'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Globe,
  Layers,
  DoorOpen,
  X,
  ChevronLeft,
  ExternalLink,
  Camera,
  Trash2,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { locationsApi } from '@/lib/api/locations';
import { LocationImage, BreadcrumbItem } from '@/types/location';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const LOCATION_TYPE_COLORS: Record<string, string> = {
  campus: 'bg-purple-100 text-purple-700',
  building: 'bg-blue-100 text-blue-700',
  floor: 'bg-green-100 text-green-700',
  room: 'bg-orange-100 text-orange-700',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  campus: 'Campus',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

function ImageGalleryModal({
  images,
  initialIndex,
  locationName,
  onClose,
  onDelete,
  isDeleting,
}: {
  images: LocationImage[];
  initialIndex: number;
  locationName: string;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
  isDeleting?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const image = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-white/70">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => onDelete(image.id)}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-400" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
        )}

        <img
          src={image.url || image.image_url || ''}
          alt={image.alt_text || image.caption || locationName}
          className="max-h-full max-w-full object-contain"
        />

        {currentIndex < images.length - 1 && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {image.caption && (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-white/80">{image.caption}</p>
        </div>
      )}
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationsApi.show(id),
    enabled: !!id,
  });

  const { data: imagesData, refetch: refetchImages } = useQuery({
    queryKey: ['location-images', id],
    queryFn: () => locationsApi.getImages(id),
    enabled: !!id,
  });

  const { data: mappingData } = useQuery({
    queryKey: ['location-mapping', id],
    queryFn: () => locationsApi.getMapping(id),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return locationsApi.uploadImage(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-images', id] });
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      toast.success('Image uploaded');
    },
    onError: () => {
      toast.error('Failed to upload image');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => locationsApi.deleteImage(id, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-images', id] });
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      toast.success('Image deleted');
      setGalleryIndex(null);
    },
    onError: () => {
      toast.error('Failed to delete image');
    },
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        uploadMutation.mutate(file);
      }
      e.target.value = '';
    },
    [uploadMutation]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchImages()]);
  }, [refetch, refetchImages]);

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
  const rawCoords = mappingData?.data;
  const coordinates = rawCoords?.latitude != null && rawCoords?.longitude != null ? rawCoords : null;
  const breadcrumb: BreadcrumbItem[] = location.breadcrumb || [];
  const heroImage = location.image_url || (images.length > 0 ? (images[0].url || images[0].image_url) : null);
  const locationType = location.type;
  const childrenCount = location.children?.length || 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={location.display_name || location.name}
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
        {/* Hero Image */}
        {heroImage ? (
          <div
            className="relative h-48 w-full cursor-pointer bg-muted"
            onClick={() => images.length > 0 ? setGalleryIndex(0) : undefined}
          >
            <img
              src={heroImage}
              alt={location.display_name || location.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {images.length > 1 && (
                <div className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1">
                  <ImageIcon className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">{images.length}</span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center bg-muted/30 py-12"
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {uploadMutation.isPending ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <Camera className="h-10 w-10" />
              )}
              <span className="text-xs">{uploadMutation.isPending ? 'Uploading...' : 'Add Photo'}</span>
            </div>
          </button>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-muted/30 px-4 py-2">
            {breadcrumb.map((item, i) => (
              <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                {item.id === id ? (
                  <span className="text-xs font-medium text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={`/properties/${item.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Status, Type Badge & Quick Stats */}
        <div className="border-b border-border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={location.status} />
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                LOCATION_TYPE_COLORS[locationType] || 'bg-muted text-muted-foreground'
              )}
            >
              {LOCATION_TYPE_LABELS[locationType] || locationType}
            </span>
            {location.code && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {location.code}
              </span>
            )}
          </div>

          {/* Stats Row */}
          {(childrenCount > 0 || location.number_of_floors || location.number_of_rooms || images.length > 0) && (
            <div className="flex gap-4">
              {childrenCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                  </span>
                </div>
              )}
              {location.number_of_floors != null && location.number_of_floors > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {location.number_of_floors} {location.number_of_floors === 1 ? 'floor' : 'floors'}
                  </span>
                </div>
              )}
              {location.number_of_rooms != null && location.number_of_rooms > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {location.number_of_rooms} {location.number_of_rooms === 1 ? 'room' : 'rooms'}
                  </span>
                </div>
              )}
              {images.length > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {images.length} {images.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="border-b border-border">
            <p className="px-4 pt-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gallery ({images.length})
            </p>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setGalleryIndex(index)}
                  className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={image.url || image.image_url || ''}
                    alt={image.alt_text || image.caption || location.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Detail Fields */}
        <div className="border-b border-border divide-y divide-border">
          <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Details
          </p>

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

          {/* Parent Location */}
          {location.parent && (
            <Link
              href={`/properties/${location.parent_location_id}`}
              className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
            >
              <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Parent Location</p>
                <p className="text-sm text-primary">{location.parent.display_name || location.parent.name}</p>
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
                <p className="text-sm">
                  {[location.address, location.city, location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Google Maps */}
          {location.google_maps_url && (
            <a
              href={location.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 active:bg-muted/50"
            >
              <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Google Maps</p>
                <p className="text-sm text-primary">Open in Google Maps</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
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
          {location.location_identifier && (
            <div className="flex items-center gap-3 px-4 py-3">
              <QrCode className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">QR Code</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(location.location_identifier!);
                    toast.success('Code copied to clipboard');
                  }}
                  className="text-sm font-mono text-left hover:text-primary transition-colors"
                >
                  {location.location_identifier}
                </button>
              </div>
              <QRCodeSVG
                value={location.location_identifier}
                size={48}
                level="M"
                className="flex-shrink-0 rounded"
              />
            </div>
          )}

          {/* Tag */}
          {location.tag && location.tag !== location.location_identifier && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Tag</p>
                <p className="text-sm font-mono">{location.tag}</p>
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{child.display_name || child.name}</p>
                    <span
                      className={cn(
                        'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                        LOCATION_TYPE_COLORS[child.type] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {child.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{child.code}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        {/* Architectural Plan */}
        {location.architectural_plan_url && (
          <div className="border-b border-border">
            <p className="px-4 pt-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Architectural Plan
            </p>
            <div className="px-4 pb-3">
              <a
                href={location.architectural_plan_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 active:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">View Architectural Plan</p>
                  <p className="text-xs text-muted-foreground">Open in new tab</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </PullToRefresh>

      {/* Full-screen Gallery Modal */}
      {galleryIndex !== null && images.length > 0 && (
        <ImageGalleryModal
          images={images}
          initialIndex={galleryIndex}
          locationName={location.name}
          onClose={() => setGalleryIndex(null)}
          onDelete={(imageId) => deleteMutation.mutate(imageId)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
