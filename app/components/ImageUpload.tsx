'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { uploadImage, validateImageFile, compressImage } from '@/lib/upload';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      setError(`يمكنك رفع ${maxImages} صور كحد أقصى`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Validate file
        validateImageFile(file);

        // Compress image before upload
        const compressedFile = await compressImage(file, 1200, 0.8);

        // Log compression results
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
        console.log(
          `🖼️ Compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% smaller)`
        );

        // Upload compressed image to Supabase
        const result = await uploadImage(compressedFile, 'courts');
        uploadedUrls.push(result.url);
      }

      // Add new URLs to existing images
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في رفع الصورة');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="w-full border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-emerald-500 hover:bg-slate-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm">جاري رفع الصور...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <p className="text-sm">
                  اضغط لرفع صور الملعب ({images.length}/{maxImages})
                </p>
                <p className="text-xs text-slate-500">
                  JPG, PNG, WebP (حد أقصى 5 ميجابايت لكل صورة)
                </p>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden group"
            >
              <img
                src={url}
                alt={`صورة ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  title="حذف الصورة"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                  الصورة الرئيسية
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

