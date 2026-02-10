'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assetsApi } from '@/lib/api/assets';
import { locationsApi } from '@/lib/api/locations';
import { LocationTree } from '@/types/location';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SearchBar } from '@/components/ui/search-bar';
import { Loader2, ChevronDown, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const assetSchema = z.object({
  asset_name: z.string().min(1, 'Asset name is required'),
  serial_number: z.string().optional(),
  barcode: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  location_id: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface FlatLocation {
  id: string;
  name: string;
  depth: number;
  type: string;
}

function flattenTree(nodes: LocationTree[], depth = 0): FlatLocation[] {
  const result: FlatLocation[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth, type: node.type });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'disposed', label: 'Disposed' },
];

export default function NewAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const { data: locationsData } = useQuery({
    queryKey: ['locations-full-tree'],
    queryFn: () => locationsApi.getFullTree(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssetFormData) => assetsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      router.push(`/assets/${response.data.id}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to create asset. Please try again.';
      setServerError(message);
    },
  });

  const onSubmit = (data: AssetFormData) => {
    setServerError('');
    createMutation.mutate(data);
  };

  const locationTree: LocationTree[] = locationsData?.data || [];
  const flatLocations = flattenTree(locationTree);
  const filteredLocations = locationSearch
    ? flatLocations.filter((loc) =>
        loc.name.toLowerCase().includes(locationSearch.toLowerCase())
      )
    : flatLocations;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="New Asset" showBack />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Asset Name */}
          <div>
            <Label className="mb-1">
              Asset Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('asset_name')}
              type="text"
              placeholder="Enter asset name"
            />
            {errors.asset_name && (
              <p className="mt-1 text-xs text-destructive">{errors.asset_name.message}</p>
            )}
          </div>

          {/* Serial Number */}
          <div>
            <Label className="mb-1">Serial Number</Label>
            <Input
              {...register('serial_number')}
              type="text"
              placeholder="Enter serial number"
            />
          </div>

          {/* Barcode */}
          <div>
            <Label className="mb-1">Barcode</Label>
            <Input
              {...register('barcode')}
              type="text"
              placeholder="Enter barcode"
            />
          </div>

          {/* Status */}
          <div>
            <Label className="mb-1">
              Status <span className="text-destructive">*</span>
            </Label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Location - Sheet Picker */}
          <div>
            <Label className="mb-1">Location</Label>
            <Controller
              name="location_id"
              control={control}
              render={({ field }) => {
                const selectedLocation = flatLocations.find((l) => l.id === field.value);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setLocationSheetOpen(true)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm',
                        !selectedLocation && 'text-muted-foreground'
                      )}
                    >
                      <span className="truncate">
                        {selectedLocation ? selectedLocation.name : 'Select a location'}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </button>

                    <Sheet open={locationSheetOpen} onOpenChange={setLocationSheetOpen}>
                      <SheetContent side="bottom" className="h-[70vh] flex flex-col">
                        <SheetHeader>
                          <SheetTitle>Select Location</SheetTitle>
                        </SheetHeader>
                        <div className="px-1 py-3">
                          <SearchBar
                            onSearch={setLocationSearch}
                            placeholder="Search locations..."
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto -mx-6 px-6">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('');
                              setLocationSheetOpen(false);
                              setLocationSearch('');
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors',
                              !field.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                            )}
                          >
                            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="flex-1">None</span>
                            {!field.value && <Check className="h-4 w-4 text-primary" />}
                          </button>
                          {filteredLocations.map((loc) => (
                            <button
                              type="button"
                              key={loc.id}
                              onClick={() => {
                                field.onChange(loc.id);
                                setLocationSheetOpen(false);
                                setLocationSearch('');
                              }}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors',
                                field.value === loc.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted'
                              )}
                              style={{ paddingLeft: `${12 + loc.depth * 16}px` }}
                            >
                              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              <span className="flex-1 truncate">{loc.name}</span>
                              <span className="text-xs text-muted-foreground capitalize">{loc.type}</span>
                              {field.value === loc.id && <Check className="h-4 w-4 text-primary" />}
                            </button>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </>
                );
              }}
            />
          </div>

          {/* Manufacturer */}
          <div>
            <Label className="mb-1">Manufacturer</Label>
            <Input
              {...register('manufacturer')}
              type="text"
              placeholder="Enter manufacturer"
            />
          </div>

          {/* Model */}
          <div>
            <Label className="mb-1">Model</Label>
            <Input
              {...register('model')}
              type="text"
              placeholder="Enter model"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1">Description</Label>
            <Textarea
              {...register('description')}
              rows={3}
              placeholder="Enter description"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 safe-bottom">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 text-sm font-semibold"
            size="lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Asset'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
