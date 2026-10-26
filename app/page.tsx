"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import MouseGlow from "@/app/components/MouseGlow";
import FloatingElements from "@/app/components/FloatingElements";
import ScrollReveal from "@/app/components/ScrollReveal";

const photos = [
  {
    src: "/photos/photo-1.jpg",
    title: "Cerita kecil kita",
    note: "Tempat buat foto favorit kalian nanti."
  },
  {
    src: "/photos/photo-2.jpg",
    title: "Hari yang manis",
    note: "Ganti foto ini dengan momen kalian."
  },
  {
    src: "/photos/photo-3.jpg",
    title: "Selalu ada alasan",
    note: "Buat senyum walau dari layar kecil."
  },
  {
    src: "/photos/photo-4.jpg",
    title: "RoboLove",
    note: "Kotak kecil yang nyimpen banyak rasa."
  }
];
function SafeImage({ 
  src, 
  alt, 
  className, 
  fallbackClass = "", 
  fallbackText = "Foto belum ditemukan" 
}: {
  src: string;
  alt: string;
  className: string;
  fallbackClass?: string;
  fallbackText?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} ${fallbackClass} photo-fallback`}>
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`${className} real-photo`}>
      <img 
        src={src} 
        alt={alt} 
        onError={() => setError(true)} 
      />
    </div>
  );
}

export default function HomePage() {
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    // Check if the device has pointer/hover capability
    const hoverMediaQuery = window.matchMedia("(hover: hover)");
    setHasHover(hoverMediaQuery.matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates: center is (0,0), range is [-0.5, 0.5]
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallaxOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  return (
    <main className="landing-page">
      {/* Dreamy Ambient Follower and Floaters */}
      <MouseGlow />
      
      <section 
        className="hero"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <FloatingElements />
        
        {/* Soft background blobs with subtle mouse parallax */}
        <div 
          className="blob blob-one" 
          style={{
            transform: `translate3d(${parallaxOffset.x * -40}px, ${parallaxOffset.y * -40}px, 0)`,
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
          }}
        />
        <div 
          className="blob blob-two" 
          style={{
            transform: `translate3d(${parallaxOffset.x * -25}px, ${parallaxOffset.y * -25}px, 0)`,
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
          }}
        />

        {/* Floating elements with tiered scroll/mouse parallax offsets */}
        <div 
          className="floating-heart heart-a float-slow"
          style={{
            transform: `translate3d(${parallaxOffset.x * 35}px, ${parallaxOffset.y * 35}px, 0) rotate(-18deg)`,
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
          }}
        >♡</div>
        <div 
          className="floating-heart heart-b float-medium"
          style={{
            transform: `translate3d(${parallaxOffset.x * 20}px, ${parallaxOffset.y * 20}px, 0) rotate(16deg)`,
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
          }}
        >✦</div>
        <div 
          className="floating-heart heart-c float-sway"
          style={{
            transform: `translate3d(${parallaxOffset.x * 45}px, ${parallaxOffset.y * 45}px, 0) rotate(-10deg)`,
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.2, 1)",
          }}
        >♡</div>

        <nav className="nav">
          <div className="brand">
            <span className="brand-dot" />
            RoboLove
          </div>
          <a href="#login-section" className="nav-link">Masuk</a>
        </nav>

        <div className="hero-content">
          <ScrollReveal delay={100} className="hero-copy">
            <p className="eyebrow">A little screen, a lot of feelings</p>
            <h1>Tempat kecil buat nyimpen foto, pesan, dan hal-hal manis kalian.</h1>
            <p className="hero-text">
              Website ini dibuat sebagai pintu masuk untuk mengatur RoboLove:
              mulai dari pesan di layar, tema, brightness, sampai mode tampilan.
            </p>

            <div className="hero-actions">
              <a href="#gallery" className="primary-btn">Lihat cerita</a>
              <a href="#login-section" className="ghost-btn">Ke login</a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={280} className="polaroid-stack" aria-label="Galeri foto">
            <div 
              className="polaroid polaroid-back"
              style={{
                transform: `translate3d(${parallaxOffset.x * 12}px, ${parallaxOffset.y * 12}px, 0) rotate(-8deg)`,
                transition: "transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)",
              }}
            >
              <SafeImage 
                src="/photos/photo-2.jpg"
                alt="little memories"
                className="photo-placeholder"
                fallbackClass="soft-2"
                fallbackText="Foto belum ditemukan"
              />
              <p>little memories</p>
            </div>
            <div 
              className="polaroid polaroid-front"
              style={{
                transform: `translate3d(${parallaxOffset.x * 18}px, ${parallaxOffset.y * 18}px, 0) rotate(5deg)`,
                transition: "transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)",
              }}
            >
              <SafeImage 
                src="/photos/photo-1.jpg"
                alt="our tiny universe"
                className="photo-placeholder"
                fallbackClass="soft-1"
                fallbackText="Foto belum ditemukan"
              />
              <p>our tiny universe</p>
            </div>
          </ScrollReveal>
        </div>

        <div className="scroll-hint">
          <span>Scroll pelan</span>
          <div className="mouse" />
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <ScrollReveal>
          <div className="section-heading">
            <p className="eyebrow">Moment wall</p>
            <h2>Nanti bagian ini bisa kamu isi foto-foto kalian.</h2>
            <p>
              Biar nggak terasa kaku seperti template coding, aku buat tampilannya
              seperti scrapbook kecil dengan elemen lembut, stiker, dan kartu foto.
            </p>
          </div>
        </ScrollReveal>

        <div className="photo-grid">
          {photos.map((photo, index) => (
            <ScrollReveal delay={index * 120} key={photo.title}>
              <article className="memory-card">
                <SafeImage 
                  src={photo.src}
                  alt={photo.title}
                  className="memory-photo"
                  fallbackClass={`memory-${(index % 4) + 1}`}
                  fallbackText="Foto belum ditemukan"
                />
                <div>
                  <h3>{photo.title}</h3>
                  <p>{photo.note}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="letter-section">
        <ScrollReveal>
          <div className="letter-card">
            <span className="tape tape-left" />
            <span className="tape tape-right" />
            <p className="eyebrow">Private corner</p>
            <h2>Kalau sudah siap, masuk ke ruang kontrol RoboLove.</h2>
            <p>
              Admin bisa mengatur semua fitur termasuk update firmware. User tetap
              bisa mengirim pesan, mengganti tema, mengatur mode, dan mengubah
              tampilan layar RoboLove.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section id="login-section" className="login-cta">
        <ScrollReveal>
          <div className="login-cta-card">
            <div>
              <p className="eyebrow">RoboLove dashboard</p>
              <h2>Masuk ke dashboard</h2>
              <p>
                Gunakan akun admin untuk kamu, dan akun user untuk pacar kamu.
              </p>
            </div>
            <Link href="/login" className="primary-btn">Buka Login</Link>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
