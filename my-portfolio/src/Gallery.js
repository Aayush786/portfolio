import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Gallery({ projects = [], onBack, matesImages = [], themeImages = [] }) {
  const [showThemeAll, setShowThemeAll] = useState(false);
  const [showMatesAll, setShowMatesAll] = useState(false);
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-sm text-gray-300 hover:text-emerald-400">← Back</button>
        <h2 className="text-3xl font-bold text-indigo-400">Gallery</h2>
        <div />
      </div>

      {matesImages.length > 0 && (
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-emerald-400 mb-4">Mates International — Graphic Design</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(showMatesAll ? matesImages : matesImages.slice(0, 10)).map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <img src={src} alt={`Mates ${i+1}`} width="1000" height="1000" className="w-full h-auto object-cover" />
              </motion.div>
            ))}
          </div>
          {matesImages.length > 10 && (
            <div className="mt-6 text-center">
              <motion.button
                onClick={() => setShowMatesAll((s) => !s)}
                whileHover={{ scale: 1.03 }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md"
              >
                {showMatesAll ? 'Show less' : `View more (${matesImages.length - 10})`}
              </motion.button>
            </div>
          )}
        </section>
      )}

      {themeImages.length > 0 && (
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-indigo-400 mb-4">Theme Nepal — Graphic Design</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(showThemeAll ? themeImages : themeImages.slice(0, 10)).map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <img src={src} alt={`Theme ${i+1}`} width="1000" height="1000" className="w-full h-auto object-cover" />
              </motion.div>
            ))}
          </div>
          {themeImages.length > 10 && (
            <div className="mt-6 text-center">
              <motion.button
                onClick={() => setShowThemeAll((s) => !s)}
                whileHover={{ scale: 1.03 }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md"
              >
                {showThemeAll ? 'Show less' : `View more (${themeImages.length - 10})`}
              </motion.button>
            </div>
          )}
        </section>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {projects.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ scale: 1.03 }}
            className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-lg"
          >
            <img src={p.img} alt={p.title} className="h-44 w-full object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-emerald-400">{p.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{p.desc}</p>
              <div className="mt-4 flex gap-2">
                {p.id === 1 && (
                  <>
                    <a href="https://www.facebook.com/chitwanmates" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/50 text-white rounded-md text-sm">FB</a>
                    <a href="https://matesedu.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/50 text-white rounded-md text-sm">Web</a>
                  </>
                )}
                {p.id === 2 && (
                  <a href="https://themenepal.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/50 text-white rounded-md text-sm">Web</a>
                )}
                {p.id === 3 && (
                  <a href="https://surkhetsoft.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/50 text-white rounded-md text-sm">Web</a>
                )}
                {p.id === 4 && (
                  <a href="https://yohoweb.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/50 text-white rounded-md text-sm">Web</a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
