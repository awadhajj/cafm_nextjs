'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { serviceRequestsApi } from '@/lib/api/service-requests';
import { locationsApi } from '@/lib/api/locations';
import { assetsApi } from '@/lib/api/assets';
import { LocationTree } from '@/types/location';
import { Asset } from '@/types/asset';
import { IssueCategory } from '@/types/work-order';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Loader2,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  ImagePlus,
  Send,
  Package,
  Building2,
  Zap,
  Droplet,
  Flame,
  ArrowDownUp,
  Snowflake,
  Sparkles,
  Trash2,
  Bug,
  TreePine,
  Wrench,
  Shield,
  Paintbrush,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------- helpers ----------

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

const BI_ICON_MAP: Record<string, LucideIcon> = {
  'bi-building': Building2,
  'bi-thermometer-snow': Snowflake,
  'bi-lightning-charge': Zap,
  'bi-droplet': Droplet,
  'bi-fire': Flame,
  'bi-arrow-down-up': ArrowDownUp,
  'bi-stars': Sparkles,
  'bi-trash': Trash2,
  'bi-bug': Bug,
  'bi-tree': TreePine,
  'bi-wrench': Wrench,
  'bi-shield': Shield,
  'bi-paint-bucket': Paintbrush,
};

function CategoryIcon({ icon, color }: { icon?: string; color?: string }) {
  const Icon = (icon && BI_ICON_MAP[icon]) || Package;
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-xl"
      style={{ backgroundColor: color ? `${color}18` : 'var(--color-muted)' }}
    >
      <Icon className="h-6 w-6" style={{ color: color || undefined }} />
    </div>
  );
}

// ---------- component ----------

export default function NewServiceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledLocationId = searchParams.get('location_id') || '';
  const prefilledAssetId = searchParams.get('asset_id') || '';

  // Wizard state
  const [step, setStep] = useState(prefilledLocationId ? 2 : 1);
  const [locationId, setLocationId] = useState(prefilledLocationId);
  const [assetId, setAssetId] = useState(prefilledAssetId);
  const [selectedParent, setSelectedParent] = useState<IssueCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [serverError, setServerError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If we have an asset_id but no location_id, fetch the asset to resolve its location
  const { data: prefilledAssetData } = useQuery({
    queryKey: ['asset', prefilledAssetId],
    queryFn: () => assetsApi.show(prefilledAssetId),
    enabled: !!prefilledAssetId && !prefilledLocationId,
  });

  // Once asset data loads, set its location and skip to step 2
  useEffect(() => {
    if (prefilledAssetData?.data?.location_id && !prefilledLocationId) {
      setLocationId(prefilledAssetData.data.location_id);
      setStep(2);
    }
  }, [prefilledAssetData, prefilledLocationId]);

  // Data queries
  const { data: locationsData } = useQuery({
    queryKey: ['locations-full-tree'],
    queryFn: () => locationsApi.getFullTree(),
  });

  const { data: assetsData } = useQuery({
    queryKey: ['assets-for-location', locationId],
    queryFn: () => assetsApi.list(locationId ? { location_id: locationId } : undefined),
    enabled: step === 1,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['issue-categories'],
    queryFn: () => serviceRequestsApi.issueCategories(),
  });

  // Resolve names for display
  const flatLocations = flattenTree(locationsData?.data || []);
  const filteredLocations = locationSearch
    ? flatLocations.filter((l) => l.name.toLowerCase().includes(locationSearch.toLowerCase()))
    : flatLocations;
  const selectedLocation = flatLocations.find((l) => l.id === locationId);

  const assets: Asset[] = assetsData?.data || [];
  const prefilledAssetName = searchParams.get('asset_name')
    ? decodeURIComponent(searchParams.get('asset_name')!)
    : '';
  const selectedAsset = assets.find((a) => a.id === assetId) || prefilledAssetData?.data;
  const selectedAssetName = selectedAsset?.asset_name || prefilledAssetName;

  const categories: IssueCategory[] = categoriesData?.data || [];
  const parentCategories = categories;
  const childCategories = selectedParent?.children || [];

  // Submit
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('location_id', locationId);
      if (assetId) formData.append('asset_id', assetId);
      formData.append('issue_category_id', selectedCategory!.id);
      if (description.trim()) formData.append('description', description.trim());
      images.forEach((img) => formData.append('images[]', img.file));
      return serviceRequestsApi.createWizard(formData);
    },
    onSuccess: (response) => {
      toast.success('Service request submitted');
      router.push(`/maintenance/service-requests/${response.data.id}`);
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || 'Failed to submit. Please try again.'
      );
    },
  });

  const handleImageAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newImages = files.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
      e.target.value = '';
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1);
      URL.revokeObjectURL(removed[0].url);
      return updated;
    });
  }, []);

  // ---------- Step 1: Location & Asset ----------
  if (step === 1) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Select Location" showBack />

        <div className="flex-1 overflow-y-auto">
          {/* Location search */}
          <div className="px-4 py-3 border-b border-border">
            <SearchBar onSearch={setLocationSearch} placeholder="Search locations..." />
          </div>

          {/* Location list */}
          <div className="divide-y divide-border">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setLocationId(loc.id);
                  setAssetId(''); // reset asset when location changes
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                  locationId === loc.id ? 'bg-primary/10' : 'active:bg-muted/50'
                )}
                style={{ paddingLeft: `${16 + loc.depth * 16}px` }}
              >
                <Building2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    locationId === loc.id ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className={cn('flex-1 truncate', locationId === loc.id && 'text-primary font-medium')}>
                  {loc.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{loc.type}</span>
                {locationId === loc.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Asset selection (optional, shown if location selected) */}
        {locationId && assets.length > 0 && (
          <div className="border-t border-border">
            <p className="px-4 pt-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Asset (Optional)
            </p>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3">
              <button
                type="button"
                onClick={() => setAssetId('')}
                className={cn(
                  'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  !assetId
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                None
              </button>
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setAssetId(asset.id)}
                  className={cn(
                    'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    assetId === asset.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {asset.asset_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next button */}
        <div className="border-t border-border bg-background px-4 py-3 safe-bottom">
          <Button
            type="button"
            disabled={!locationId}
            onClick={() => setStep(2)}
            className="w-full"
            size="lg"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Step 2: Issue Category ----------
  if (step === 2) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader
          title={selectedParent ? selectedParent.label_en : 'Select Issue'}
          showBack
          onBack={() => {
            if (selectedParent) {
              setSelectedParent(null);
              setSelectedCategory(null);
            } else {
              setStep(1);
            }
          }}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!selectedParent && (
            <>
              <div className="mb-4">
                <h2 className="text-base font-semibold">What is the issue?</h2>
                <p className="text-sm text-muted-foreground">Select the category that best describes your issue</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {parentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (cat.children && cat.children.length > 0) {
                        setSelectedParent(cat);
                      } else {
                        setSelectedCategory(cat);
                        setSelectedParent(cat);
                        setStep(3);
                      }
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors active:bg-muted/50"
                  >
                    <CategoryIcon icon={cat.icon} color={cat.color} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{cat.label_en}</p>
                      {cat.label_ar && (
                        <p className="text-xs text-muted-foreground leading-tight" dir="rtl">{cat.label_ar}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedParent && (
            <div className="space-y-2">
              {childCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(sub);
                    setStep(3);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors active:bg-muted/50',
                    selectedCategory?.id === sub.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sub.label_en}</p>
                    {sub.label_ar && (
                      <p className="text-xs text-muted-foreground" dir="rtl">{sub.label_ar}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Step 3: Details & Submit ----------
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Details"
        showBack
        onBack={() => setStep(2)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium truncate">{selectedLocation?.name}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-primary">
                Change
              </button>
            </div>
            {(selectedAssetName || assetId) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Asset</p>
                  <p className="text-sm font-medium truncate">{selectedAssetName || assetId}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Issue</p>
                <p className="text-sm font-medium truncate">
                  {selectedParent?.label_en}
                  {selectedCategory && selectedCategory.id !== selectedParent?.id && (
                    <> &rsaquo; {selectedCategory.label_en}</>
                  )}
                </p>
              </div>
              <button type="button" onClick={() => setStep(2)} className="text-xs text-primary">
                Change
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1">Additional Details</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue (optional)"
            />
          </div>

          {/* Images */}
          <div>
            <Label className="mb-1">Photos</Label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Up to 5 photos (max 5MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              multiple
              onChange={handleImageAdd}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-border bg-background px-4 py-3 safe-bottom">
        <Button
          type="button"
          disabled={submitMutation.isPending}
          onClick={() => {
            setServerError('');
            submitMutation.mutate();
          }}
          className="w-full"
          size="lg"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
