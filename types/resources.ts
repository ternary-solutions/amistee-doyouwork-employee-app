export interface Resource {
  id: string;
  title: string;
  resource_type: { id: string; name: string; description: string | null };
  resource_category: { id: string; name: string; description: string | null };
  attachment_url: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceList {
  items: Resource[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
