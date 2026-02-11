import { apiRequest } from '@/utils/api';

export interface MediaUploadResponse {
  message: string;
  file_url: string;
  original_filename: string;
  entity_type: string;
}

/**
 * Upload a file (image) to the media endpoint.
 * For RN, pass an object with uri, type, name (from expo-image-picker result).
 */
export const mediaService = {
  async uploadFile(
    file: { uri: string; type?: string; name?: string },
    entityType: string = 'spiffs',
    category: string = 'images'
  ): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file as unknown as Blob);
    formData.append('entity_type', entityType);
    formData.append('category', category);

    return apiRequest<FormData, MediaUploadResponse>(
      'media/upload',
      { method: 'POST', data: formData }
    );
  },
};
