'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api/assets';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ImageUploader } from '@/components/camera/image-uploader';
import { Button } from '@/components/ui/button';
import {
  Package,
  Pencil,
  MapPin,
  Hash,
  Barcode,
  Factory,
  Cpu,
  FileText,
  Calendar,
  Wrench,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AssetImage } from '@/types/asset';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.show(id),
  });

  const { data: imagesData, refetch: refetchImages } = useQuery({
    queryKey: ['asset-images', id],
    queryFn: () => assetsApi.getImages(id),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => assetsApi.uploadImage(id, formData),
    onSuccess: () => {
      refetchImages();
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => assetsApi.deleteImage(id, imageId),
    onSuccess: () => {
      refetchImages();
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
  });

  if (isLoading) {
    return <PageLoading />;
  }

  const asset = data?.data;

  if (!asset) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Asset Not Found" showBack />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">This asset could not be found.</p>
        </div>
      </div>
    );
  }

  const images: AssetImage[] = imagesData?.data || asset.images || [];

  const handleImageAdd = (newImages: { url: string; file?: File }[]) => {
    const addedImages = newImages.filter((img) => img.file);
    addedImages.forEach((img) => {
      if (img.file) {
        const formData = new FormData();
        formData.append('image', img.file);
        uploadMutation.mutate(formData);
      }
    });
  };

  const handleImageRemove = (imageId: string) => {
    deleteImageMutation.mutate(imageId);
  };

  const detailRows = [
    { icon: Hash, label: 'Asset Number', value: asset.asset_number },
    { icon: Hash, label: 'Serial Number', value: asset.serial_number },
    { icon: Barcode, label: 'Barcode', value: asset.barcode },
    { icon: MapPin, label: 'Location', value: asset.location?.name },
    { icon: Factory, label: 'Manufacturer', value: asset.manufacturer },
    { icon: Cpu, label: 'Model', value: asset.model },
    { icon: Package, label: 'Category', value: asset.category },
    { icon: Package, label: 'Asset Type', value: asset.asset_type },
    {
      icon: Calendar,
      label: 'Purchase Date',
      value: asset.purchase_date ? formatDate(asset.purchase_date) : undefined,
    },
    {
      icon: Calendar,
      label: 'Warranty Expiry',
      value: asset.warranty_expiry ? formatDate(asset.warranty_expiry) : undefined,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={asset.asset_name}
        subtitle={asset.asset_number}
        showBack
        backHref="/assets"
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/assets/${id}/edit`)}
            className="h-9 w-9 rounded-lg"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusBadge status={asset.status} />
        </div>

        {/* Images Gallery */}
        <div className="px-4 pb-4">
          {images.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Photos</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img) => (
                  <div key={img.id} className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(img.image_url)}
                      className="h-24 w-24 overflow-hidden rounded-lg bg-muted"
                    >
                      <img
                        src={img.image_url}
                        alt={img.title || 'Asset image'}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(img.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-2">
            <ImageUploader
              images={images.map((img) => ({ url: img.image_url }))}
              onChange={handleImageAdd}
              maxImages={10}
            />
          </div>
        </div>

        {/* Detail Info */}
        <div className="border-t border-border px-4 py-3">
          <div className="space-y-3">
            {detailRows
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <row.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm">{row.value}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Description */}
        {asset.description && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{asset.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 px-4 py-4">
          <button
            onClick={() => router.push(`/assets/${id}/service-requests`)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Service Requests</p>
              <p className="text-xs text-muted-foreground">View service requests for this asset</p>
            </div>
          </button>

          <Button
            onClick={() =>
              router.push(`/service-requests/new?asset_id=${id}&asset_name=${encodeURIComponent(asset.asset_name)}`)
            }
            className="w-full gap-2 py-3 text-sm font-semibold"
            size="lg"
          >
            <Wrench className="h-4 w-4" />
            Create Service Request
          </Button>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedImage}
            alt="Asset"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
