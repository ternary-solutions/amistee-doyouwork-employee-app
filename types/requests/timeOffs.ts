export interface TimeOffRequest {
  id: string;
  user: { id: string; first_name: string; last_name: string; email: string };
  entity_type: TimeOffType;
  start_date: string;
  end_date: string;
  time_off_days: number;
  status: TimeOffStatus;
  created_at?: string;
  updated_at?: string;
}

export type TimeOffStatus = 'Pending' | 'Approved' | 'Denied';
export type TimeOffType = 'Vacation' | 'Sick' | 'Personal';

export interface TimeOffRequestList {
  items: TimeOffRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TimeOffRequestCreate {
  entity_type: TimeOffType;
  start_date: string;
  end_date: string;
}
