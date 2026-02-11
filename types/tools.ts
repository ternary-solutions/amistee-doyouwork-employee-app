export interface Tool {
  id: string;
  tool_type_id: string;
  tool_name: string;
  is_returnable: boolean;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export interface ToolList {
  items: Tool[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
