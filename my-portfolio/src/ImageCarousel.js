import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ImageCarousel({ images = [] }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure images are loaded before showing carousel
    if (images.length > 0) {
      setIsReady(true);
    }
  }, [images]);

  if (!isReady || images.length === 0) {
    return null; // Don't render until images are ready
  }

  // Create array with duplicated images for seamless loop
  const carouselItems = [...images, ...images];
  
  // Calculate animation duration (approximately 3-4 pixels per second)
  const animationDuration = (carouselItems.length * 400) / 80; // 400px per item, 80px/sec speed
  const scrollDistance = images.length * 400; // Total distance to scroll (one full set)

  return (
    <section className="relative z-10 w-full py-16 overflow-hidden bg-black" style={{ transform: 'skewY(-1.5deg)' }}>
      <div className="max-w-7xl mx-auto px-6 mb-12" style={{ transform: 'skewY(1.5deg)' }}>
        <h2 className="text-3xl font-bold text-emerald-400">Featured Work</h2>
        <p className="text-gray-400 mt-2">A glimpse of recent design projects and campaigns</p>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden h-80">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 z-20 w-40 h-full bg-gradient-to-r from-black via-black to-transparent pointer-events-none" />
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 z-20 w-40 h-full bg-gradient-to-l from-black via-black to-transparent pointer-events-none" />

        {/* Carousel Track */}
        <motion.div
          className="flex gap-6 h-full"
          animate={{ x: -scrollDistance }}
          transition={{
            duration: animationDuration,
            repeat: Infinity,
            ease: 'linear',
            repeatType: 'loop',
          }}
          style={{ width: `${carouselItems.length * 400}px` }}
        >
          {carouselItems.map((src, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-96 h-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg"
            >
              <img
                src={src}
                alt={`Work ${(index % images.length) + 1}`}
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Indicators */}
      <div className="mt-8 flex justify-center gap-2" style={{ transform: 'skewY(1.5deg)' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full"
            style={{ width: i === 1 ? 24 : 8 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </div>
    </section>
  );
}
