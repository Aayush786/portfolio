/*
PortfolioNeo.jsx
Futuristic tech-designer themed React + Tailwind portfolio for Aayush Niure
Enhanced with animations, glassmorphism, neon gradients, 3D-style hero, and interactive background.
*/

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import './App.css';

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

// Custom cursor that follows the mouse and highlights over interactive elements
function Cursor() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function isInteractive(node) {
      return node && node.closest && node.closest('a,button,input,textarea,select,[role="button"],[data-cursor-hover]');
    }

    function onMove(e) {
      const x = e.clientX;
      const y = e.clientY;
      // position via left/top so CSS translate(-50%,-50%) keeps it centered
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      const node = document.elementFromPoint(x, y);
      if (isInteractive(node)) el.classList.add('cursor--hover');
      else el.classList.remove('cursor--hover');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseenter', onMove);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseenter', onMove);
    };
  }, []);

  return <div ref={ref} className="custom-cursor" aria-hidden="true" />;
}

// Antigravity floating particle field (canvas)
function FloatingField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpi = window.devicePixelRatio || 1;

    function resize() {
      const w = Math.max(window.innerWidth, canvas.clientWidth || 0);
      const h = Math.max(window.innerHeight, canvas.clientHeight || 0);
      canvas.width = Math.floor(w * dpi);
      canvas.height = Math.floor(h * dpi);
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }

    resize();
    let W = canvas.width;
    let H = canvas.height;

    let particles = [];
    function populateParticles() {
      particles.length = 0;
      const area = (canvas.width / dpi) * (canvas.height / dpi);
      // denser but very small particles
      const COUNT = Math.max(100, Math.floor(area / 6000));
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.02,
          vy: -(0.01 + Math.random() * 0.03),
          size: 0.3 + Math.random() * 0.6,
          alpha: 0.08 + Math.random() * 0.18,
        });
      }
    }

    populateParticles();

    let mouse = { x: -9999, y: -9999 };
    function onMove(e) {
      mouse.x = e.clientX * dpi;
      mouse.y = e.clientY * dpi;
    }

    window.addEventListener('mousemove', onMove);

    let raf = null;
    function step() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        // gentle upward acceleration (antigravity) — very subtle
        p.vy -= 0.00035;
        // apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // wrap horizontally
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;

        // recycle when too far above
        if (p.y < -40) {
          p.y = H + Math.random() * 40;
          p.vy = -(0.2 + Math.random() * 0.8);
          p.x = Math.random() * W;
        }

        // mouse repulsion (makes objects dodge cursor)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const R = 60 * dpi;
        if (dist < R) {
          const force = (1 - dist / R) * 0.45;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        // draw glow particle
        ctx.beginPath();
        const radius = Math.max(4, p.size * 4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        g.addColorStop(0, `rgba(16,185,129,${Math.max(0.12, p.alpha)})`);
        g.addColorStop(0.5, `rgba(50,205,150,${Math.max(0.06, p.alpha * 0.5)})`);
        g.addColorStop(1, 'rgba(16,24,32,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
      }
      raf = requestAnimationFrame(step);
    }

    // handle resize dynamically
    const onResize = () => {
      dpi = window.devicePixelRatio || 1;
      resize();
      W = canvas.width;
      H = canvas.height;
      populateParticles();
    };

    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="floating-canvas" aria-hidden="true" />;
}

export default function App() {
  const typed = useTyping(["Graphic Designer.", "Video Editor.", "Social Media Marketer.", "Creative Thinker."], 80);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Auto-assign pop-on-hover to buttons and button-like anchors
  useEffect(() => {
    function addPopClasses() {
      try {
        document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(el => el.classList.add('pop-on-hover'));
        document.querySelectorAll('a').forEach(el => {
          if (el.classList.contains('px-6') && el.classList.contains('py-3')) el.classList.add('pop-on-hover');
          if (el.classList.contains('rounded-full')) el.classList.add('pop-on-hover');
          if (el.getAttribute('role') === 'button') el.classList.add('pop-on-hover');
        });
      } catch (e) {
        // ignore in non-browser environments
      }
    }
    // small delay to ensure elements mount
    const t = setTimeout(addPopClasses, 50);
    return () => clearTimeout(t);
  }, []);

  const projects = [
    {
      id: 1,
      title: "Mates International",
      desc: "Creative graphic designer handling branding, digital campaigns, and promotional visuals.",
      img: "https://i.postimg.cc/qq5GD5sq/mates.png",
      tags: ["Graphic Design", "Branding", "Marketing"],
    },
    {
      id: 2,
      title: "Theme Nepal",
      desc: "Short-term project focusing on brand-focused designs and impactful ad visuals.",
      img: "https://i.postimg.cc/VvVFZVqN/themenepal.png",
      tags: ["Graphic Design", "8+ Brands"],
    },
    {
      id: 3,
      title: "Surkhet Soft",
      desc: "Designed creative campaigns and motion visuals for 15+ partner brands.",
      img: "https://i.postimg.cc/pr6Bc6fT/surkhet.png",
      tags: ["Graphic Design", "15+ Brands",],
    },
    {
      id: 4,
      title: "Yohoweb.com",
      desc: "Crafted brand visuals and website graphic elements for client portfolios.",
      img: "https://i.postimg.cc/fyrvqrcR/yoho.png",
      tags: ["Logo Design", "Graphic Design"],
    },
  ];

  const education = [
    {
      title: "Bachelor’s in Computer Engineering",
      school: "International School of Management and Technology (ISMT), Chitwan",
      year: "Ongoing",
    },
    {
      title: "+2 in Computer Science",
      school: "Oxford College of Engineering and Management, Gaindakot",
      year: "Completed 2022",
    },
  ];

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-200">
      <Cursor />
      <FloatingField />
      <header className="relative z-10 max-w-7xl mx-auto flex justify-between items-center p-6">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center font-bold">AN</div>
          <div>
            <h1 className="text-lg font-semibold">Aayush Niure</h1>
            <p className="text-xs text-gray-400">Freelancer / Graphic Designer / Video Editor</p>
          </div>
        </motion.div>
        <nav className="flex items-center gap-5 text-sm">
          <a href="#works" className="hover:text-emerald-400">Works</a>
          <a href="#about" className="hover:text-emerald-400">About</a>
          <a href="#education" className="hover:text-emerald-400">Education</a>
          <a href="#contact" className="hover:text-emerald-400">Contact</a>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-3 py-1 border rounded-md">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center md:text-left pop-on-hover">
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <h1 className="text-5xl md:text-6xl font-extrabold">
            Hi, I’m <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">Aayush</span>
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            A creative mind crafting designs, videos, and campaigns as a <span className="font-mono text-emerald-400">{typed}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <motion.a
              href="#works"
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.03)' }}
              transition={{ duration: 0.25 }}
              className="px-6 py-3 bg-emerald-500 text-white rounded-full shadow"
            >
              View My Work
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.03)' }}
              transition={{ duration: 0.25 }}
              className="px-6 py-3 border border-indigo-400 rounded-full"
            >
              Hire Me
            </motion.a>
          </div>
        </motion.section>
      </main>

      {/* ABOUT */}
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-6 py-16 pop-on-hover">
        <h2 className="text-3xl font-bold mb-8 text-emerald-400">About Me</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="leading-relaxed">
              I’m a Nepal-based <span className="text-indigo-400">Graphic Designer, Video Editor,</span> and <span className="text-indigo-400">Social Media Marketer</span> with experience in educational and tech-based industries. I blend visuals, motion, and strategy to build creative brand identities.
            </p>
            <p className="mt-3 text-gray-400 text-sm">
              I’ve worked with multiple creative teams and helped brands visually communicate their stories through design and content.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skill title="Graphic Design" level={95} />
            <Skill title="Video Editing" level={90} />
            <Skill title="Social Media" level={88} />
            <Skill title="Motion Graphics" level={85} />
          </div>
        </div>
      </section>
{/* EDUCATION (Neon Timeline) */}
<section id="education" className="relative z-10 max-w-6xl mx-auto px-6 py-20 pop-on-hover">
  <h2 className="text-3xl font-bold mb-12 text-indigo-400 text-center">Education</h2>

  <div className="relative border-l-2 border-indigo-500/30 pl-8 space-y-12">
    {education.map((edu, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.05)" }}
        transition={{ duration: 0.3 }}
        className="relative bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-lg"
      >
        {/* Glowing dot */}
        <motion.div
          className="absolute -left-5 top-6 w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 shadow-lg"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        <h3 className="text-xl font-semibold text-emerald-400">{edu.title}</h3>
        <p className="text-gray-300 text-sm mt-1">{edu.school}</p>
        <p className="text-gray-500 text-xs mt-2 italic">{edu.year}</p>
      </motion.div>
    ))}

    {/* vertical glowing line accent */}
    <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-emerald-400 to-transparent blur-md" />
  </div>
</section>

      {/* WORKS */}
      <section id="works" className="relative z-10 max-w-7xl mx-auto px-6 py-20 pop-on-hover">
        <h2 className="text-3xl font-bold text-indigo-400 mb-10">Experience & Projects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <motion.div
              whileHover={{ scale: 1.05 }}
              key={p.id}
              className="relative group bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-lg"
            >
              <img src={p.img} alt={p.title} className="h-48 w-full object-cover" />

              {/* Hover actions for Mates International (FB + Web) */}
              {p.id === 1 && (
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <a
                    href="https://www.facebook.com/chitwanmates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-black/50 text-white rounded-md text-sm backdrop-blur-sm hover:bg-emerald-500/90"
                  >
                    FB
                  </a>
                  <a
                    href="https://matesedu.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-black/50 text-white rounded-md text-sm backdrop-blur-sm hover:bg-indigo-500/80"
                  >
                    Web
                  </a>
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-semibold text-emerald-400">{p.title}</h3>
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

      {/* CONTACT */}
      <section id="contact" className="relative z-10 max-w-6xl mx-auto px-6 py-20 pop-on-hover">
        <h2 className="text-3xl font-bold mb-6 text-emerald-400">Let’s Connect</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <form className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10">
            <input className="w-full mb-4 p-3 bg-transparent border-b border-emerald-400 text-sm" placeholder="Your Name" />
            <input className="w-full mb-4 p-3 bg-transparent border-b border-emerald-400 text-sm" placeholder="Your Email" />
            <textarea rows="4" className="w-full mb-4 p-3 bg-transparent border-b border-emerald-400 text-sm" placeholder="Your Message"></textarea>
            <motion.button
              whileHover={{ scale: 1.035, backgroundColor: 'rgba(255,255,255,0.03)' }}
              transition={{ duration: 0.25 }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full shadow"
            >
              Send Message
            </motion.button>
          </form>
          <div className="flex flex-col justify-center">
            <p className="text-gray-400 mb-3">Want to collaborate or chat about design, motion, or marketing?</p>
            <a href="mailto:aayushniure48@gmail.com" className="text-lg text-emerald-400 underline">aayushniure48@gmail.com</a>
            <div className="mt-4 flex gap-4">
              <a href="https://www.linkedin.com/in/aayush-niure-b71415267" className="hover:text-indigo-400">LinkedIn</a>
              <a href="#" className="hover:text-indigo-400">Instagram</a>
              <a href="#" className="hover:text-indigo-400">YouTube</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-500 text-sm">© {new Date().getFullYear()} Aayush Niure — Designed with React & Motion ⚡</footer>
    </div>
  );
}

function Skill({ title, level }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.03)' }}
      transition={{ duration: 0.25 }}
      className="bg-white/5 p-4 rounded-xl border border-white/10 text-center"
    >
      <h4 className="font-semibold text-indigo-300 text-sm mb-2">{title}</h4>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div style={{ width: `${level}%` }} className="h-full bg-gradient-to-r from-indigo-400 to-emerald-500"></div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{level}%</p>
    </motion.div>
  );
}
