import type {
    ClothingObject,
    ClothingRequest,
    ClothingRequestCreate,
    ClothingRequestList,
} from "@/types/requests/clothings";
import { apiRequest } from "@/utils/api";

/** Backend clothing item from GET /clothing/ (paginated) */
interface ClothingApiItem {
  id: string;
  item_name: string;
  sku?: string;
  clothing_type?: { id: string; name: string };
  available_sizes?: string[];
  thumbnail_url?: string;
}

function mapClothingApiItemToObject(item: ClothingApiItem): ClothingObject {
  return {
    id: item.id,
    name: item.item_name,
    type_name: item.clothing_type?.name,
    size: item.available_sizes?.[0],
  };
}

export const clothingRequestsService = {
  /** List requestable clothing objects (to choose from when creating a request). */
  async listObjects(): Promise<ClothingObject[]> {
    const res = await apiRequest<
      unknown,
      {
        items: ClothingApiItem[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      }
    >("clothing/?page=1&limit=100", { method: "GET" }, true, true);
    const items = res?.items ?? [];
    return items.map(mapClothingApiItemToObject);
  },

  async list(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<ClothingRequestList> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);
    return apiRequest<unknown, ClothingRequestList>(
      `clothing-requests/?${params.toString()}`,
      { method: "GET" },
      true,
      true,
    );
  },

  async getById(id: string): Promise<ClothingRequest> {
    return apiRequest<unknown, ClothingRequest>(
      `clothing-requests/${id}`,
      { method: "GET" },
      true,
      true,
    );
  },

  /** Create one or more clothing requests (one request per selected item, each with quantity 1). */
  async create(data: ClothingRequestCreate): Promise<ClothingRequest | void> {
    const { clothing_object_ids: ids, size, reason } = data;
    if (!ids?.length || !size) return;

    const payload = (clothing_id: string) => ({
      clothing_id,
      quantity: 1,
      size,
      reason: reason?.trim() || undefined,
    });

    let last: ClothingRequest | undefined;
    for (const id of ids) {
      last = await apiRequest<ReturnType<typeof payload>, ClothingRequest>(
        "clothing-requests/",
        { method: "POST", data: payload(id) },
        true,
        true,
      );
    }
    return last;
  },
};
