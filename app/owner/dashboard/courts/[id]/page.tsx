'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { ArrowRight, MapPin, FileText, Image as ImageIcon, Plus, Trash2, Save, Navigation, ExternalLink } from 'lucide-react';

interface FieldInput {
  id?: string;
  name: string;
  type: string;
  pricePerHour: string;
  isNew?: boolean;
}

interface CourtData {
  id: string;
  name: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  images: string;
  fields: { id: string; name: string; type: string; pricePerHour: number }[];
}

export default function EditCourtPage() {
  const router = useRouter();
  const params = useParams();
  const courtId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fields, setFields] = useState<FieldInput[]>([]);

  // Fetch court data
  useEffect(() => {
    fetch(`/api/owner/courts/${courtId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        const court: CourtData = data.court;
        setName(court.name);
        setDescription(court.description || '');
        setLocation(court.location);
        setLatitude(court.latitude?.toString() || '');
        setLongitude(court.longitude?.toString() || '');
        
        try {
          const images = JSON.parse(court.images || '[]');
          setImageUrl(images[0] || '');
        } catch {
          setImageUrl('');
        }

        setFields(court.fields.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          pricePerHour: f.pricePerHour.toString(),
        })));

        setLoading(false);
      })
      .catch(() => {
        router.push('/owner/dashboard/courts');
      });
  }, [courtId, router]);

  const addField = () => {
    setFields([...fields, { name: '', type: '5v5', pricePerHour: '', isNew: true }]);
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, key: keyof FieldInput, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
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
    setSuccess('');

    const invalidFields = fields.filter(f => !f.name || !f.pricePerHour);
    if (invalidFields.length > 0) {
      setError('يرجى ملء جميع بيانات الملاعب');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/owner/courts/${courtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          location,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          images: imageUrl ? [imageUrl] : [],
          fields: fields.map(f => ({
            id: f.isNew ? undefined : f.id,
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

      setSuccess('تم حفظ التغييرات بنجاح');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/owner/dashboard/courts" className="text-slate-400 hover:text-white flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4" />
            العودة لإدارة الملاعب
          </Link>
          <h1 className="text-2xl font-bold text-white">تعديل النادي</h1>
          <p className="text-slate-400 mt-2">عدّل بيانات النادي والملاعب</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">معلومات النادي</h2>
            
            <div>
              <label className="block text-slate-400 text-sm mb-2">اسم النادي *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">الموقع (العنوان) *</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  <p className="text-slate-500 text-sm mt-1">حدد موقع الملعب على الخريطة</p>
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
                  <label className="block text-slate-500 text-xs mb-1">خط العرض (Latitude)</label>
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
                  <label className="block text-slate-500 text-xs mb-1">خط الطول (Longitude)</label>
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
              <label className="block text-slate-400 text-sm mb-2">وصف النادي</label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">رابط الصورة</label>
              <div className="relative">
                <ImageIcon className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">الملاعب</h2>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="w-4 h-4" />
                إضافة ملعب
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id || index} className="bg-slate-800/50 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">
                      {field.isNew ? 'ملعب جديد' : `ملعب ${index + 1}`}
                    </span>
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
                      <label className="block text-slate-500 text-xs mb-1">اسم الملعب *</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs mb-1">النوع</label>
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
                      <label className="block text-slate-500 text-xs mb-1">السعر/ساعة (ج.م) *</label>
                      <input
                        type="number"
                        value={field.pricePerHour}
                        onChange={(e) => updateField(index, 'pricePerHour', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
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

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 h-12" isLoading={saving}>
              <Save className="w-5 h-5" />
              حفظ التغييرات
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
  );
}
