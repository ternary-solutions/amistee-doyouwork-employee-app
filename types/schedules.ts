export interface MyScheduleResponse {
  id: string | null;
  notes?: string | null;
  assigned_employees: Array<{
    id: string;
    first_name: string;
    last_name?: string;
  }>;
  vehicle: {
    id: string;
    vehicle_name: string;
    image_url?: string | null;
  };
  date: string;
}
