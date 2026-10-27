import { api } from "./api";

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  mimetype?: string;
  data?: UploadedFile | UploadedFile[];
  files?: UploadedFile[];
  message?: string;
  error?: string;
}

export interface UploadListItem {
  filename: string;
  url: string;
  size: number;
  modifiedAt: string;
}

export interface UploadListResponse {
  success: boolean;
  total?: number;
  files: UploadListItem[];
}

export const uploadService = {
  /**
   * Upload a single file (image, document, receipt, etc.)
   */
  uploadFile: async (
    file: File,
    folder: string = "",
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    const { data } = await api.post<UploadResponse>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return data;
  },

  /**
   * Upload multiple files simultaneously
   */
  uploadMultiple: async (
    files: File[],
    folder: string = "",
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (folder) {
      formData.append("folder", folder);
    }

    const { data } = await api.post<UploadResponse>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return data;
  },

  /**
   * List files in the bucket or subfolder
   */
  listFiles: async (folder?: string): Promise<UploadListResponse> => {
    const params = folder ? { folder } : {};
    const { data } = await api.get<UploadListResponse>("/upload", { params });
    return data;
  },

  /**
   * Delete a file from the bucket
   */
  deleteFile: async (
    filename: string,
    folder?: string
  ): Promise<{ success: boolean; message: string }> => {
    const params = folder ? { folder } : {};
    const { data } = await api.delete(`/upload/${encodeURIComponent(filename)}`, {
      params,
    });
    return data;
  },

  /**
   * Resolve full asset URL for rendering in <img> or link
   */
  resolveUrl: (pathOrUrl: string): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("data:")) {
      return pathOrUrl;
    }
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "https://api.xonitspace.com").replace(/\/api\/v1\/?$/, "");
    const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${backendBase}${cleanPath}`;
  },
};
