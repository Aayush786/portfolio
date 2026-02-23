/*
PortfolioNeo.jsx
Futuristic tech-designer themed React + Tailwind portfolio for Aayush Niure
Enhanced with animations, glassmorphism, neon gradients, 3D-style hero, and interactive background.
*/

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Typing effect hook
function useTyping(texts, speed = 100, pause = 1500) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!reverse && subIndex < texts[index].length) {
        setSubIndex(subIndex + 1);
      } else if (reverse && subIndex > 0) {
        setSubIndex(subIndex - 1);
      } else {
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
  const [modalProject, setModalProject] = useState(null);

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
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.15),transparent_40%)] animate-pulse"></div>

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

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center md:text-left">
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <h1 className="text-5xl md:text-6xl font-extrabold">
            Hi, I’m <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Aayush</span>
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            I craft creative digital experiences as a <span className="font-mono text-pink-400">{typed}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <a href="#works" className="px-6 py-3 bg-pink-500 text-white rounded-full shadow hover:shadow-pink-400/50 transition">View My Work</a>
            <a href="#contact" className="px-6 py-3 border border-indigo-400 rounded-full hover:bg-indigo-500/20 transition">Hire Me</a>
          </div>
        </motion.section>

        {/* Floating tech ring */}
        <div className="absolute top-10 right-10 w-60 h-60 border border-indigo-500/30 rounded-full blur-lg animate-spin-slow" />
      </main>

      {/* ABOUT SECTION */}
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-8 text-pink-400">About Me</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <p className="leading-relaxed">
              I’m a Nepal-based creative passionate about blending <span className="text-indigo-400">design, code, and motion</span> to tell stories that connect people and technology.
            </p>
            <p className="mt-3 text-gray-400 text-sm">
              From leading social campaigns to building clean digital interfaces — I’m all about creating things that feel alive.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skill title="UI Design" level={95} />
            <Skill title="Frontend Dev" level={90} />
            <Skill title="Motion Graphics" level={85} />
            <Skill title="Social Strategy" level={88} />
          </div>
        </div>
      </section>

      {/* WORK SECTION */}
      <section id="works" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-indigo-400 mb-10">Featured Projects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <motion.div whileHover={{ scale: 1.05 }} key={p.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-lg">
              <img src={p.img} alt={p.title} className="h-48 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-pink-400">{p.title}</h3>
                <p className="text-sm text-gray-400 mt-2">{p.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {p.tags.map((t) => (
                    <span key={t} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-6 text-pink-400">Let’s Connect</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <form className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10">
            <input className="w-full mb-4 p-3 bg-transparent border-b border-pink-400 text-sm" placeholder="Your Name" />
            <input className="w-full mb-4 p-3 bg-transparent border-b border-pink-400 text-sm" placeholder="Your Email" />
            <textarea rows="4" className="w-full mb-4 p-3 bg-transparent border-b border-pink-400 text-sm" placeholder="Your Message"></textarea>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full shadow hover:scale-105 transition">Send Message</button>
          </form>
          <div className="flex flex-col justify-center">
            <p className="text-gray-400 mb-3">Want to collaborate or chat about design, tech, or motion?</p>
            <a href="mailto:hello@aayushniure.com" className="text-lg text-pink-400 underline">hello@aayushniure.com</a>
            <div className="mt-4 flex gap-4">
              <a href="#" className="hover:text-indigo-400">Instagram</a>
              <a href="#" className="hover:text-indigo-400">YouTube</a>
              <a href="#" className="hover:text-indigo-400">Dribbble</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-gray-500 text-sm relative z-10">© {new Date().getFullYear()} Aayush Niure — Built with React & Motion ✨</footer>
    </div>
  );
}

function Skill({ title, level }) {
  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
      <h4 className="font-semibold text-indigo-300 text-sm mb-2">{title}</h4>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div style={{ width: `${level}%` }} className="h-full bg-gradient-to-r from-indigo-400 to-pink-500"></div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{level}%</p>
    </div>
  );
}
