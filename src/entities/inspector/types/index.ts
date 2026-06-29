
export interface Inspector {
  id: string;
  name_en: string;
  name_fa: string;
  location?: string;
  specialties: string[];
  rating: number;
  status: string;
  activeJobs: number;
  completedJobs: number;
}
