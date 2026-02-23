import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Typing effect
function useTyping(texts, speed = 100) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!reverse && subIndex < texts[index].length) setSubIndex(subIndex + 1);
      else if (reverse && subIndex > 0) setSubIndex(subIndex - 1);
      else {
        setReverse(!reverse);
        if (!reverse) setIndex((index + 1) % texts.length);
      }
    }, reverse ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [subIndex, reverse, texts, index, speed]);

  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(blinkInterval);
  }, []);

  return texts[index].substring(0, subIndex) + (blink ? "|" : " ");
}

export default function PortfolioNeo() {
  const typed = useTyping(["Designer.", "Developer.", "Tech Explorer.", "Visual Storyteller."], 80);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const projects = [
    {
      id: 1,
      title: "Beast Riders — AI Shorts",
      desc: "Cinematic YouTube series featuring AI-generated animals riding vehicles in unreal worlds.",
      img: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1000&q=60",
      tags: ["AI", "Video", "Cinematic"],
    },
    {
      id: 2,
      title: "Surkhet Soft — Social Campaign",
      desc: "Creative branding & digital motion design for 15+ brands across multiple branches.",
      img: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1000&q=60",
      tags: ["Design", "Social Media"],
    },
    {
      id: 3,
      title: "Aayush Portfolio",
      desc: "A futuristic, motion-driven personal site inspired by tech design and neon glow.",
      img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=60",
      tags: ["Web", "Design"],
    },
  ];

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-200">
      {/* Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto flex justify-between items-center p-6">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold">AN</div>
          <div>
            <h1 className="text-lg font-semibold">Aayush Niure</h1>
            <p className="text-xs text-gray-400">Creative Designer / Tech Explorer</p>
          </div>
        </motion.div>
        <nav className="flex items-center gap-5 text-sm">
          <a href="#works" className="hover:text-pink-400 transition">Works</a>
          <a href="#about" className="hover:text-pink-400 transition">About</a>
          <a href="#contact" className="hover:text-pink-400 transition">Contact</a>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-3 py-1 border rounded-md">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center md:text-left">
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <h1 className="text-5xl md:text-6xl font-extrabold">
            Hi, I’m <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Aayush</span>
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            I craft creative digital experiences as a <span className="font-mono text-pink-400">{typed}</span>
          </p>
        </motion.section>
      </main>
    </div>
  );
}