export type RepairStatus = 'New' | 'Assigned' | 'In Repair' | 'Complete';
export type RepairPriority = 'Low' | 'Medium' | 'High';

export interface RepairRequest {
  id: string;
  user: { id: string; first_name: string; last_name: string; email: string };
  vehicle: { id: string; vehicle_name: string; license_plate: string; vin: string };
  request_date: string;
  description: string;
  status: RepairStatus;
  priority: RepairPriority;
  created_at: string;
  updated_at: string;
}

export interface RepairRequestList {
  items: RepairRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface RepairRequestCreate {
  vehicle_id: string;
  description: string;
  priority?: RepairPriority | null;
}
