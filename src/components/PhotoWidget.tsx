import React, { useState, useEffect } from 'react';

interface PhotoWidgetProps {
  photoUrl: string | null;
  onClick?: () => void;
  className?: string;
  alt?: string;
}

export const PhotoWidget: React.FC<PhotoWidgetProps> = ({
  photoUrl,
  onClick,
  className = '',
  alt = 'Family photo preview'
}) => {
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle photo changes with smooth crossfade
  useEffect(() => {
    if (photoUrl && photoUrl !== currentPhoto) {
      setIsTransitioning(true);
      
      // Start fade out
      setTimeout(() => {
        setCurrentPhoto(photoUrl);
        setIsTransitioning(false);
      }, 250); // Half of the transition duration
    }
  }, [photoUrl, currentPhoto]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {currentPhoto ? (
        <>
          {/* Background blur image */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${currentPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px)',
              transform: 'scale(1.1)', // Slightly larger to avoid blur edges
            }}
          />
          
          {/* Main image with object-contain */}
          <img
            src={currentPhoto}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              zIndex: 1,
            }}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </>
      ) : (
        <div className="w-full h-full bg-gray-light/30 flex items-center justify-center">
          <div className="text-8xl">📸</div>
        </div>
      )}
    </div>
  );
};
