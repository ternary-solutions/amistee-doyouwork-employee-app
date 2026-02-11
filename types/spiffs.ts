import type { UserInfo } from "@/types/users";

export interface SpiffTypeInfoOutput {
  id: string;
  name: string;
  description: string | null;
  predetermined_amount: string | null;
}

export type SpiffStatus = "Pending" | "Approved" | "Denied";

export interface Spiff {
  id: string;
  user_id: string;
  user: UserInfo;
  spiff_type: SpiffTypeInfoOutput;
  spiff_date: string;
  amount: string;
  details: string | null;
  attachment_urls?: string[] | null;
  status: SpiffStatus;
  created_at: string;
  updated_at: string;
}

export interface SpiffList {
  items: Spiff[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SpiffCreate {
  spiff_type_id: string;
  spiff_date: string;
  amount: number | string;
  details?: string | null;
  attachment_urls?: string[];
}

export interface SpiffSummary {
  total_earned: number | string;
  total_spiffs: number;
  active_spiffs: number;
  approved_spiffs: number;
}

export interface SpiffComment {
  id: string;
  spiff_id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  };
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface SpiffCommentCreate {
  comment: string;
}
