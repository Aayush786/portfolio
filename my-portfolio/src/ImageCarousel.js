import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ImageCarousel({ images = [] }) {
  const [duplicatedImages, setDuplicatedImages] = useState([]);
  const carouselRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    // Duplicate images for seamless loop
    if (images.length > 0) {
      setDuplicatedImages([...images, ...images]);
    }
  }, [images]);

  useEffect(() => {
    // Calculate scroll width after images are loaded
    if (carouselRef.current && duplicatedImages.length > 0) {
      const timeout = setTimeout(() => {
        const carousel = carouselRef.current?.querySelector('.carousel-track');
        if (carousel) {
          // Calculate width: each image is w-96 (384px) + gap-6 (24px) + padding
          const calculatedWidth = duplicatedImages.length * (384 + 24) + 24;
          setScrollWidth(calculatedWidth);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [duplicatedImages]);

  return (
    <section className="relative z-10 w-full py-20 overflow-hidden bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent" style={{ transform: 'skewY(-2deg)' }}>
      <div className="max-w-7xl mx-auto px-6 mb-8" style={{ transform: 'skewY(2deg)' }}>
        <h2 className="text-3xl font-bold text-emerald-400">Featured Work</h2>
        <p className="text-gray-400 mt-2">A glimpse of recent design projects and campaigns</p>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden" ref={carouselRef}>
        {/* Gradient masks for fade effect on edges */}
        <div className="absolute left-0 top-0 z-20 w-32 h-full bg-gradient-to-r from-gray-900 to-transparent dark:from-gray-900 dark:to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-20 w-32 h-full bg-gradient-to-l from-gray-900 to-transparent dark:from-gray-900 dark:to-transparent pointer-events-none" />

        {/* Scrolling Images - Only render when images exist */}
        {duplicatedImages.length > 0 && (
          <motion.div
            className="flex gap-6 px-6 carousel-slide carousel-track"
            animate={{ x: scrollWidth > 0 ? -scrollWidth / 2 : 0 }}
            transition={{
              duration: scrollWidth > 0 ? (scrollWidth / 2) / 100 : 60,
              repeat: Infinity,
              ease: 'linear',
              repeatType: 'loop',
            }}
          >
            {duplicatedImages.map((src, index) => (
              <motion.div
                key={index}
                className="relative flex-shrink-0 w-96 h-auto rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg hover:shadow-2xl transition-shadow duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {/* Image with actual aspect ratio - no cropping */}
                <img
                  src={src}
                  alt={`Project ${index + 1}`}
                  className="w-full h-auto object-contain p-0 carousel-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Hover overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Decorative pulsing indicators */}
      {duplicatedImages.length > 0 && (
        <div className="mt-10 flex justify-center gap-3" style={{ transform: 'skewY(2deg)' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full carousel-indicator"
              style={{ width: i === 1 ? 32 : 12 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
        </div>
      )}

      {/* Optional: Info text */}
      {duplicatedImages.length > 0 && (
        <div className="mt-8 text-center" style={{ transform: 'skewY(2deg)' }}>
          <p className="text-gray-400 text-sm">→ Scroll through to see more of my creative work →</p>
        </div>
      )}

      {/* Loading or empty state */}
      {duplicatedImages.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading carousel...</p>
        </div>
      )}
    </section>
  );
}
