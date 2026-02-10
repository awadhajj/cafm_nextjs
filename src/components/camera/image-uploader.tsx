'use client';

import { useState, useRef } from 'react';
import { Camera, X, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  images: { url: string; file?: File }[];
  onChange: (images: { url: string; file?: File }[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUploader({ images, onChange, maxImages = 5, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    onChange([...images, ...newImages].slice(0, maxImages));
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    const removed = updated.splice(index, 1);
    // Revoke object URL if it was created locally
    if (removed[0]?.file) {
      URL.revokeObjectURL(removed[0].url);
    }
    onChange(updated);
  };

  return (
    <div className={cn('space-y-2', className)}>
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
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
