'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (base64: string) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSave, width = 400, height = 200 }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const base64 = sigRef.current.toDataURL('image/png');
      onSave(base64);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-border bg-background">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            width,
            height,
            className: 'w-full rounded-lg',
            style: { width: '100%', height: height },
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Clear
        </Button>
        <Button type="button" onClick={handleSave} disabled={isEmpty} className="flex-1">
          Save Signature
        </Button>
      </div>
    </div>
  );
}
