import React, { useState } from 'react';

export default function LazyImage({ src, alt, className = '', imgClassName = '', ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-800/20 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-500 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
