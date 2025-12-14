'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { ArrowRight, MapPin, FileText, Image as ImageIcon, Plus, Trash2, Navigation, ExternalLink } from 'lucide-react';

interface FieldInput {
  name: string;
  type: string;
  pricePerHour: string;
}

export default function NewCourtPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fields, setFields] = useState<FieldInput[]>([
    { name: 'ملعب خماسي', type: '5v5', pricePerHour: '200' }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const addField = () => {
    setFields([...fields, { name: '', type: '5v5', pricePerHour: '' }]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, key: keyof FieldInput, value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      (err) => {
        console.error(err);
        setError('فشل في تحديد الموقع. تأكد من السماح للمتصفح بالوصول للموقع.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const openInMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    const invalidFields = fields.filter(f => !f.name || !f.pricePerHour);
    if (invalidFields.length > 0) {
      setError('يرجى ملء جميع بيانات الملاعب');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          location,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          images: imageUrl ? [imageUrl] : [],
          fields: fields.map(f => ({
            name: f.name,
            type: f.type,
            pricePerHour: parseFloat(f.pricePerHour),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ');
      }

      router.push('/owner/dashboard/courts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/owner/dashboard/courts" className="text-slate-400 hover:text-white flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4" />
              العودة لإدارة الملاعب
            </Link>
            <h1 className="text-3xl font-bold text-white">إضافة نادي جديد</h1>
            <p className="text-slate-400 mt-2">أضف تفاصيل النادي والملاعب الموجودة فيه</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-white">معلومات النادي</h2>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">اسم النادي *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="مثال: نادي الشمس الرياضي"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">الموقع (العنوان) *</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="مثال: القاهرة - مدينة نصر"
                    required
                  />
                </div>
              </div>

              {/* GPS Location */}
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-500" />
                      موقع GPS (للخريطة)
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">حدد موقع الملعب على الخريطة ليسهل على اللاعبين الوصول</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <span className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    تحديد موقعي
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">خط العرض (Latitude)</label>
                    <input
                      type="text"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      placeholder="30.0511"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">خط الطول (Longitude)</label>
                    <input
                      type="text"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      placeholder="31.3656"
                      dir="ltr"
                    />
                  </div>
                </div>

                {latitude && longitude && (
                  <button
                    type="button"
                    onClick={openInMaps}
                    className="text-emerald-400 text-sm flex items-center gap-1 hover:text-emerald-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    عرض على الخريطة
                  </button>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">وصف النادي</label>
                <div className="relative">
                  <FileText className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[100px] resize-none"
                    placeholder="أضف وصفاً تفصيلياً للنادي..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">رابط صورة النادي</label>
                <div className="relative">
                  <ImageIcon className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">الملاعب</h2>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="w-4 h-4" />
                  إضافة ملعب
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="bg-slate-800/50 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">ملعب {index + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 text-xs mb-1">اسم الملعب *</label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, 'name', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          placeholder="ملعب خماسي 1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs mb-1">النوع</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="5v5">خماسي (5×5)</option>
                          <option value="7v7">سباعي (7×7)</option>
                          <option value="11v11">كبير (11×11)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs mb-1">السعر/ساعة (ج.م) *</label>
                        <input
                          type="number"
                          value={field.pricePerHour}
                          onChange={(e) => updateField(index, 'pricePerHour', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          placeholder="200"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 h-12" isLoading={loading}>
                إضافة النادي
              </Button>
              <Link href="/owner/dashboard/courts">
                <Button type="button" variant="outline" className="h-12">
                  إلغاء
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
