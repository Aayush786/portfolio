import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ImageCarousel({ images = [] }) {
  const [duplicatedImages, setDuplicatedImages] = useState([]);

  useEffect(() => {
    // Duplicate images for seamless loop
    setDuplicatedImages([...images, ...images]);
  }, [images]);

  return (
    <section className="relative z-10 w-full py-20 overflow-hidden bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent" style={{ transform: 'skewY(-2deg)' }}>
      <div className="max-w-7xl mx-auto px-6 mb-8" style={{ transform: 'skewY(2deg)' }}>
        <h2 className="text-3xl font-bold text-emerald-400">Featured Work</h2>
        <p className="text-gray-400 mt-2">A glimpse of recent design projects and campaigns</p>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden">
        {/* Gradient masks for fade effect on edges */}
        <div className="absolute left-0 top-0 z-20 w-32 h-full bg-gradient-to-r from-gray-900 to-transparent dark:from-gray-900 dark:to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-20 w-32 h-full bg-gradient-to-l from-gray-900 to-transparent dark:from-gray-900 dark:to-transparent pointer-events-none" />

        {/* Scrolling Images */}
        <motion.div
          className="flex gap-6 px-6 carousel-slide"
          animate={{ x: [0, -2048] }}
          transition={{
            duration: duplicatedImages.length > 0 ? 50 : 25,
            repeat: Infinity,
            ease: 'linear',
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
              <motion.img
                src={src}
                alt={`Project ${index + 1}`}
                className="w-full h-auto object-contain p-0 carousel-image"
                loading="lazy"
              />

              {/* Hover overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Decorative pulsing indicators */}
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

      {/* Optional: Info text */}
      <div className="mt-8 text-center" style={{ transform: 'skewY(2deg)' }}>
        <p className="text-gray-400 text-sm">→ Scroll through to see more of my creative work →</p>
      </div>
    </section>
  );
}
