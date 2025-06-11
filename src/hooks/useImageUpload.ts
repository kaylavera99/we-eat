import { useState, useCallback } from "react";
import { compressImage } from "../services/storageService";

export function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      if (!selected) {
        setFile(null);
        setPreviewUrl(null);
        return;
      }

      let compressedFile: File;
      try {
        compressedFile = await compressImage(selected);
      } catch {
        compressedFile = selected;
      }

      setFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    },
    []
  );

  return { file, previewUrl, handleFileChange };
}
