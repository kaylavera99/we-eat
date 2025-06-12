import { useState, useCallback } from "react";
import { compressImage } from "../services/storageService";

export function useImageUpload(initialUrl?:string) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl || "");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      if (!selected) {
        setFile(null);
        setPreviewUrl(initialUrl || "");
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
    [initialUrl]
  );

  return { file, previewUrl, handleFileChange };
}
