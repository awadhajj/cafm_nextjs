'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';

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
      <div className="rounded-lg border-2 border-dashed border-border bg-white">
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
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
