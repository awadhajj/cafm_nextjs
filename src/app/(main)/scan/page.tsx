'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { locationsApi } from '@/lib/api/locations';
import { assetsApi } from '@/lib/api/assets';
import { warehouseApi } from '@/lib/api/warehouse';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/ui/page-header';
import {
  Building2,
  Package,
  Warehouse,
  Box,
  ScanLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ScanMode = null | 'location' | 'asset' | 'slot' | 'item' | 'auto';

const SCAN_OPTIONS = [
  {
    mode: 'auto' as ScanMode,
    icon: ScanLine,
    label: 'Auto Detect',
    description: 'Scan any QR code and auto-detect the type',
    color: 'bg-primary/10 text-primary dark:bg-primary/20',
  },
  {
    mode: 'location' as ScanMode,
    icon: Building2,
    label: 'Location',
    description: 'Scan a location or room QR code',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    mode: 'asset' as ScanMode,
    icon: Package,
    label: 'Asset',
    description: 'Scan an asset barcode or QR code',
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  {
    mode: 'slot' as ScanMode,
    icon: Warehouse,
    label: 'Warehouse Slot',
    description: 'Scan a warehouse slot QR code',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  },
  {
    mode: 'item' as ScanMode,
    icon: Box,
    label: 'Warehouse Item',
    description: 'Scan a warehouse item barcode',
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
];

const SCAN_TITLES: Record<string, string> = {
  auto: 'Scan Any Code',
  location: 'Scan Location QR',
  asset: 'Scan Asset QR',
  slot: 'Scan Slot QR',
  item: 'Scan Item QR',
};

export default function ScanPage() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleScan = useCallback(
    async (code: string) => {
      setIsResolving(true);

      try {
        if (scanMode === 'location') {
          const res = await locationsApi.findByQrCode(code);
          if (res?.success) {
            router.push(`/properties/${res.data.id}`);
            return;
          }
        } else if (scanMode === 'asset') {
          const res = await assetsApi.findByQrCode(code);
          if (res?.success) {
            router.push(`/assets/${res.data.id}`);
            return;
          }
        } else if (scanMode === 'slot') {
          const res = await warehouseApi.slots.findByQrCode(code);
          if (res?.success) {
            router.push(`/warehouse/slots/${res.data.id}?store_id=${res.data.store_id}`);
            return;
          }
        } else if (scanMode === 'item') {
          const res = await warehouseApi.items.findByQrCode(code);
          if (res?.success) {
            router.push(`/warehouse/items/${res.data.id}`);
            return;
          }
        } else {
          // Auto-detect: try all entity types in parallel
          const results = await Promise.allSettled([
            locationsApi.findByQrCode(code),
            assetsApi.findByQrCode(code),
            warehouseApi.stores.findByQrCode(code),
            warehouseApi.slots.findByQrCode(code),
            warehouseApi.items.findByQrCode(code),
          ]);

          const [locationRes, assetRes, storeRes, slotRes, itemRes] = results;

          if (locationRes.status === 'fulfilled' && locationRes.value?.success) {
            router.push(`/properties/${locationRes.value.data.id}`);
            return;
          } else if (assetRes.status === 'fulfilled' && assetRes.value?.success) {
            router.push(`/assets/${assetRes.value.data.id}`);
            return;
          } else if (storeRes.status === 'fulfilled' && storeRes.value?.success) {
            router.push('/warehouse');
            return;
          } else if (slotRes.status === 'fulfilled' && slotRes.value?.success) {
            const slot = slotRes.value.data;
            router.push(`/warehouse/slots/${slot.id}?store_id=${slot.store_id}`);
            return;
          } else if (itemRes.status === 'fulfilled' && itemRes.value?.success) {
            router.push(`/warehouse/items/${itemRes.value.data.id}`);
            return;
          }
        }

        // Nothing found
        toast.error(`No match found for code: ${code}`);
        setIsResolving(false);
        setScanMode(null);
      } catch {
        toast.error('Failed to look up code. Please try again.');
        setIsResolving(false);
        setScanMode(null);
      }
    },
    [router, scanMode]
  );

  if (isResolving) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Looking up code...</p>
      </div>
    );
  }

  if (scanMode) {
    return (
      <QRScanner
        onScan={handleScan}
        onClose={() => setScanMode(null)}
        title={SCAN_TITLES[scanMode]}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Scan" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-base font-semibold">What do you want to scan?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a type or use auto-detect
          </p>
        </div>

        <div className="space-y-3">
          {SCAN_OPTIONS.map((option) => (
            <button
              key={option.mode}
              onClick={() => setScanMode(option.mode)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors active:bg-muted/50"
            >
              <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', option.color)}>
                <option.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
