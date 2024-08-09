import React, { useEffect, useRef, useState } from 'react';
import { IonImg } from '@ionic/react';

const LazyImage: React.FC<{ src: string, alt?: string, style?: React.CSSProperties }> = ({ src, alt, style }) => {
  const [isInView, setIsInView] = useState(false);
  const [fetchedSrc, setFetchedSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLIonImgElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current as unknown as Element);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current as unknown as Element);
      }
    };
  }, []);

  useEffect(() => {
    const fetchImage = async () => {
      if (isInView && src) {
        try {
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setFetchedSrc(imageUrl);
        } catch (error) {
          console.error('Image fetch failed:', error);
          setFetchedSrc(src); // Fallback to original image if fetch fails
        }
      }
    };

    fetchImage();
  }, [isInView, src]);

  return (
    <IonImg
      ref={imgRef}
      src={fetchedSrc}
      alt={alt}
      style={style}
    />
  );
};

export default LazyImage;
