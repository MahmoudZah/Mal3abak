// Governorates and their regions in Egypt
export interface Region {
  id: string;
  name: string;
}

export interface Governorate {
  id: string;
  name: string;
  regions: Region[];
}

export const GOVERNORATES: Governorate[] = [
  {
    id: "cairo",
    name: "القاهرة",
    regions: [
      { id: "nasr-city", name: "مدينة نصر" },
      { id: "maadi", name: "المعادي" },
      { id: "heliopolis", name: "مصر الجديدة" },
      { id: "new-cairo", name: "القاهرة الجديدة" },
      { id: "shoubra", name: "شبرا" },
      { id: "downtown", name: "وسط البلد" },
      { id: "dokki", name: "الدقي" },
      { id: "mohandessin", name: "المهندسين" },
      { id: "zamalek", name: "الزمالك" },
      { id: "nasr-city-east", name: "شرق مدينة نصر" },
    ],
  },
  {
    id: "giza",
    name: "الجيزة",
    regions: [
      { id: "faisal", name: "فيصل" },
      { id: "giza-square", name: "ميدان الجيزة" },
      { id: "6-october", name: "6 أكتوبر" },
      { id: "haram", name: "الهرم" },
      { id: "mohandessin-giza", name: "المهندسين" },
      { id: "dokki-giza", name: "الدقي" },
      { id: "agouza", name: "العجوزة" },
      { id: "imbaba", name: "إمبابة" },
    ],
  },
  {
    id: "helwan",
    name: "حلوان",
    regions: [
      { id: "helwan-city", name: "مدينة حلوان" },
      { id: "maasara", name: "المعصرة" },
      { id: "15-mayo", name: "15 مايو" },
      { id: "ain-helwan", name: "عين حلوان" },
    ],
  },
];

// Helper function to get regions by governorate
export function getRegionsByGovernorate(governorateId: string): Region[] {
  const governorate = GOVERNORATES.find((g) => g.id === governorateId);
  return governorate?.regions || [];
}

// Helper function to get governorate name by ID
export function getGovernorateName(governorateId: string): string {
  const governorate = GOVERNORATES.find((g) => g.id === governorateId);
  return governorate?.name || governorateId;
}

// Helper function to get region name by IDs
export function getRegionName(governorateId: string, regionId: string): string {
  const regions = getRegionsByGovernorate(governorateId);
  const region = regions.find((r) => r.id === regionId);
  return region?.name || regionId;
}

// Get full location string
export function getFullLocation(governorateId: string, regionId: string): string {
  const govName = getGovernorateName(governorateId);
  const regName = getRegionName(governorateId, regionId);
  return `${govName} - ${regName}`;
}

