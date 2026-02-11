import type { User } from "@/types/users";

export type ClothingStatus = "Pending" | "Approved" | "Denied" | "Completed";
export type ClothingSize =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "One Size"
  | "30x30"
  | "32x32"
  | "34x32"
  | "36x32";

/** A requestable clothing object (e.g. "Polo Shirt", "Safety Vest"). */
export interface ClothingObject {
  id: string;
  name: string;
  type_name?: string;
  /** Sizes available for this specific item. Used for size picker when creating a request. */
  available_sizes?: string[];
  /** Selected/requested size. Present when object is part of a request response. */
  size?: string;
}

export interface ClothingRequest {
  id: string;
  user: User;
  /** Legacy: when API still returns type-based request */
  clothing_type_id?: string;
  clothing_type_name?: string;
  quantity?: number;
  size?: ClothingSize;
  /** Requested clothing objects (when API uses object-based requests) */
  requested_objects?: ClothingObject[];
  reason: string | null;
  status: ClothingStatus;
  created_at: string;
  updated_at: string;
}

export interface ClothingRequestList {
  items: ClothingRequest[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ClothingRequestCreate {
  clothing_object_ids: string[];
  size: ClothingSize;
  reason?: string;
}
