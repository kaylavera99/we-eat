import React, { useEffect, useRef, useState } from "react";
import { IonImg } from "@ionic/react";

const LazyImage: React.FC<{
  src: string;
  alt?: string;
  style?: React.CSSProperties;
}> = ({ src, alt, style }) => {
  const [isInView, setIsInView] = useState(false);
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
        rootMargin: "50px",
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

  return (
    <IonImg
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      style={style}
    />
  );
};

export default LazyImage;
