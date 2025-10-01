// src/hooks/usePhotoPicker.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useState } from 'react';

export function usePhotoPicker() {
  const [preview, setPreview] = useState<string>();
  const [file, setFile] = useState<File>();

  const pick = async () => {
    const photo = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,  // this shows “Camera | Photos”
    });
    if (photo.webPath) {
      setPreview(photo.webPath);
      // convert to File if you need to upload it
      const blob = await fetch(photo.webPath).then(r => r.blob());
      setFile(new File([blob], 'photo.jpg', { type: blob.type }));
    }
  };

  return { preview, file, pick };
}
