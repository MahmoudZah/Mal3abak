"use client";

import { useState } from "react";
import {
  X,
  Upload,
  Loader2,
  CreditCard,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Building2,
  Calendar,
} from "lucide-react";
import { uploadImage, validateImageFile, compressImage } from "@/lib/upload";
import { Button } from "./ui/button";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentProofUrl: string) => Promise<void>;
  courtName: string;
  fieldName: string;
  date: string;
  time: string;
  hours: number;
  pricePerHour: number;
  ownerPaymentName: string;
  ownerPaymentPhone: string;
  ownerPaymentMethod: string;
}

const SERVICE_FEE = 10; // 10 EGP service fee

export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  courtName,
  fieldName,
  date,
  time,
  hours,
  pricePerHour,
  ownerPaymentName,
  ownerPaymentPhone,
  ownerPaymentMethod,
}: PaymentConfirmationModalProps) {
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalFieldPrice = pricePerHour * hours;
  const totalPrice = totalFieldPrice + SERVICE_FEE;

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Validate file
      validateImageFile(file);

      // Compress image before preview
      const compressedFile = await compressImage(file, 1200, 0.85);
      setPaymentProofFile(compressedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ملف غير صالح");
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!paymentProofFile) {
      setError("يرجى إرفاق صورة إثبات الدفع");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload payment proof image
      const result = await uploadImage(paymentProofFile, "payment-proofs");

      // Call parent confirmation handler
      await onConfirm(result.url);

      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في رفع إثبات الدفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-500" />
              تأكيد الحجز والدفع
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              الرجاء اتباع الخطوات أدناه لإتمام حجزك
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-2 transition-all"
            disabled={uploading}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Booking Summary */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-xl p-6 space-y-4 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">تفاصيل الحجز</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">الملعب</p>
                  <p className="text-white font-medium">{courtName}</p>
                  <p className="text-emerald-400 text-xs">{fieldName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">التاريخ والوقت</p>
                  <p className="text-white font-medium">{date}</p>
                  <p className="text-slate-300 text-xs">
                    {time} ({hours} ساعة)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 border border-slate-700/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  سعر الملعب ({hours} × {pricePerHour} ج.م)
                </span>
                <span className="text-white font-medium">
                  {totalFieldPrice} ج.م
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">رسوم الخدمة</span>
                <span className="text-emerald-400 font-medium">
                  +{SERVICE_FEE} ج.م
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2 mt-2">
                <span className="text-white">المبلغ الإجمالي</span>
                <span className="text-emerald-500">{totalPrice} ج.م</span>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Instructions */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold text-emerald-400">
                قم بالتحويل إلى
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-400/80">الاسم</p>
                </div>
                <p className="text-white font-semibold">{ownerPaymentName}</p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-400/80">رقم الهاتف</p>
                </div>
                <p className="text-white font-semibold font-mono" dir="ltr">
                  {ownerPaymentPhone}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-400/80">الطريقة</p>
                </div>
                <p className="text-white font-semibold">{ownerPaymentMethod}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-emerald-300 font-medium mb-1">
                  تعليمات مهمة:
                </p>
                <ul className="text-emerald-200/80 space-y-1 list-disc list-inside">
                  <li>
                    حوّل مبلغ{" "}
                    <strong className="text-emerald-300">
                      {totalPrice} ج.م
                    </strong>{" "}
                    للرقم أعلاه
                  </li>
                  <li>احتفظ بإيصال أو لقطة شاشة للتحويل</li>
                  <li>أرفق الإثبات في الخطوة التالية</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3: Upload Payment Proof */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">
                أرفق إثبات الدفع
              </h3>
            </div>

            {!paymentProofPreview ? (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="payment-proof-input"
                  disabled={uploading}
                />
                <label
                  htmlFor="payment-proof-input"
                  className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all ${
                    uploading
                      ? "border-emerald-500 bg-emerald-500/5 cursor-wait"
                      : "border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50 cursor-pointer"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-emerald-500 mb-4 animate-spin" />
                      <p className="text-white font-medium mb-1">
                        جاري معالجة الصورة...
                      </p>
                      <p className="text-slate-400 text-sm">يرجى الانتظار</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-white font-medium mb-2 text-lg">
                        اضغط لرفع صورة إثبات الدفع
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        أو اسحب الصورة وأفلتها هنا
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          JPG, PNG, WebP
                        </span>
                        <span>•</span>
                        <span>حد أقصى 5 ميجابايت</span>
                      </div>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="relative group">
                <div className="bg-slate-800 rounded-xl p-4 border-2 border-emerald-500/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentProofPreview}
                    alt="Payment Proof"
                    className="w-full max-h-80 object-contain rounded-lg"
                  />
                  <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>تم رفع الصورة بنجاح</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPaymentProofFile(null);
                    setPaymentProofPreview(null);
                  }}
                  className="absolute top-6 right-6 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-lg opacity-0 group-hover:opacity-100"
                  disabled={uploading}
                  title="إزالة الصورة"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={onClose}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              className="flex-1 h-12 text-lg font-semibold"
              onClick={handleConfirm}
              isLoading={uploading}
              disabled={!paymentProofFile || uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التأكيد...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  تأكيد الحجز
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
