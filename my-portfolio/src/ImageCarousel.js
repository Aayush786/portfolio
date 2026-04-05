import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ImageCarousel({ images = [] }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (images.length > 0) {
      setIsReady(true);
    }
  }, [images]);

  if (!isReady || images.length === 0) {
    return null;
  }

  const carouselItems = [...images, ...images];
  const animationDuration = (carouselItems.length * 400) / 80;
  const scrollDistance = images.length * 400;

  return (
    <section className="relative z-10 w-full py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <h2 className="text-3xl font-bold text-emerald-400">Featured Work</h2>
        <p className="text-gray-400 mt-2">A glimpse of recent design projects and campaigns</p>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden h-80">
        <div className="absolute left-0 top-0 z-20 w-40 h-full bg-gradient-to-r from-slate-950/95 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-20 w-40 h-full bg-gradient-to-l from-slate-950/95 to-transparent pointer-events-none" />

        <motion.div
          className="flex gap-6 h-full px-6"
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
              className="relative flex-shrink-0 w-96 h-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl transition-transform duration-300 hover:scale-[1.03] hover:border-emerald-400"
            >
              <img
                src={src}
                alt={`Work ${(index % images.length) + 1}`}
                className="w-full h-full object-contain p-3 bg-slate-950"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mt-8 flex justify-center gap-2">
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
