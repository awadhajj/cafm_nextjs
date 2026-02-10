'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { locationsApi } from '@/lib/api/locations';
import { assetsApi } from '@/lib/api/assets';
import { warehouseApi } from '@/lib/api/warehouse';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ScanPage() {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState('');

  const handleScan = useCallback(
    async (code: string) => {
      setIsResolving(true);
      setError('');

      // Try resolving across entity types in parallel
      const results = await Promise.allSettled([
        locationsApi.findByQrCode(code),
        assetsApi.findByQrCode(code),
        warehouseApi.stores.findByQrCode(code),
        warehouseApi.slots.findByQrCode(code),
        warehouseApi.items.findByQrCode(code),
      ]);

      // Check which resolved successfully
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value?.success) {
          const entity = result.value.data;
          switch (i) {
            case 0: // Location
              router.push(`/properties/${entity.id}`);
              return;
            case 1: // Asset
              router.push(`/assets/${entity.id}`);
              return;
            case 2: // Store
              router.push(`/warehouse`);
              return;
            case 3: // Slot
              router.push(`/warehouse/slots/${entity.id}`);
              return;
            case 4: // Item
              router.push(`/warehouse/items/${entity.id}`);
              return;
          }
        }
      }

      setIsResolving(false);
      setError(`No match found for code: ${code}`);
    },
    [router]
  );

  if (isResolving) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Looking up code...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <QRScanner
        onScan={handleScan}
        onClose={() => router.back()}
      />
      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-50 rounded-lg bg-destructive px-4 py-3 text-center text-sm text-white">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}
