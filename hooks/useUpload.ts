import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadService, UploadResponse } from "../services/upload.service";

export function useUploadFilesList(folder?: string) {
  return useQuery({
    queryKey: ["uploads", folder || "root"],
    queryFn: () => uploadService.listFiles(folder),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folder,
      onProgress,
    }: {
      file: File;
      folder?: string;
      onProgress?: (progress: number) => void;
    }): Promise<UploadResponse> => {
      return uploadService.uploadFile(file, folder, onProgress);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["uploads", variables.folder || "root"],
      });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filename,
      folder,
    }: {
      filename: string;
      folder?: string;
    }) => {
      return uploadService.deleteFile(filename, folder);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["uploads", variables.folder || "root"],
      });
    },
  });
}
