import { supabase, COURT_IMAGES_BUCKET } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload
 * @param folder - Optional folder path (e.g., 'courts/court-id')
 * @returns Object with public URL and storage path
 */
export async function uploadImage(
  file: File,
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(COURT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(COURT_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('فشل في رفع الصورة');
  }
}

/**
 * Upload multiple images
 * @param files - Array of files to upload
 * @param folder - Optional folder path
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from storage
 * @param path - The storage path of the image
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(COURT_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('فشل في حذف الصورة');
  }
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم. استخدم صور بصيغة JPG, PNG, أو WebP');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
  }

  return true;
}

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 1200px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('فشل في إنشاء Canvas'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('فشل في ضغط الصورة'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        reject(new Error('فشل في تحميل الصورة'));
      };
    };
    reader.onerror = () => {
      reject(new Error('فشل في قراءة الملف'));
    };
  });
}

