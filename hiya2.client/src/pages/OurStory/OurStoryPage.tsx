import React from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { ScrollReveal } from '../../components/common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../utils/navigation';
import './OurStoryPage.css';

interface OurStoryPageProps {
  onNavigateHome?: () => void;
}

export const OurStoryPage: React.FC<OurStoryPageProps> = () => {
  return (
    <div className="hiyaghar-story-page-wrapper">
      <Header />
      <main className="hiyaghar-story-main">
        {/* HERO HEADER */}
        <section className="hiyaghar-story-hero">
          <div className="hiyaghar-story-hero-bg" />
          <div className="hiyaghar-story-hero-container">
            <ScrollReveal variant="fade-up">
              <span className="hiyaghar-story-hero-eyebrow">OUR HERITAGE & PASSION</span>
              <h1 className="hiyaghar-story-hero-title">Some Goodness Has A Story.</h1>
              <p className="hiyaghar-story-hero-subtitle">
                At Hiya, we believe in bringing authentic tradition and pure natural ingredients into everyday homes.
                Every flavor is handcrafted with care, keeping age-old recipes alive.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* DETAILED CONTENT SECTIONS */}
        <div className="hiyaghar-story-container">
          {/* Section 1: The Beginning */}
          <div className="hiyaghar-story-block">
            <ScrollReveal variant="fade-right" className="hiyaghar-story-image-wrap">
              <img
                src="/image/jamunbottole_clean.webp"
                alt="Hiya traditional preparation"
              />
              <div className="hiyaghar-story-image-badge">
                <span>✦ Authentic Craftsmanship</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-left" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">HOW IT STARTED</span>
              <h2 className="hiyaghar-story-heading">Rooted in Home & Heart</h2>
              <p className="hiyaghar-story-para">
                Hiya began with a simple belief: the finest post-meal mouth fresheners and natural wellness products
                are born right at home. In a world full of artificial additives and shortcuts, we chose the slower,
                authentic path.
              </p>
              <p className="hiyaghar-story-para">
                From roasting seeds at just the right temperatures to blending natural dry fruits, spices, and gulkand,
                every single item carries the nostalgic warmth of Indian hospitality.
              </p>
            </ScrollReveal>
          </div>

          {/* Section 2: Purity & Care */}
          <div className="hiyaghar-story-block reversed">
            <ScrollReveal variant="fade-left" className="hiyaghar-story-image-wrap">
              <img
                src="/image/hiya_mukhwas_auth_lifestyle.webp"
                alt="Finest Natural Ingredients"
              />
              <div className="hiyaghar-story-image-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>100% Tobacco-Free & Pure</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-right" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">OUR PROMISE</span>
              <h2 className="hiyaghar-story-heading">Clean Ingredients, Zero Compromises</h2>
              <p className="hiyaghar-story-para">
                Every blend is 100% tobacco-free, preservative-conscious, and made with natural digestive botanicals
                like Jamun seeds, Amla, Betel leaves, Fennel, Cardamom, and organic herbs.
              </p>
              <p className="hiyaghar-story-para">
                We craft in hygienic batches to preserve freshness, aroma, and real crunch so every bite feels like
                a comforting family recipe.
              </p>
            </ScrollReveal>
          </div>

          {/* Core Pillars / Values Section */}
          <ScrollReveal variant="fade-up" className="hiyaghar-story-values-section">
            <div className="hiyaghar-story-values-header">
              <span className="hiyaghar-story-tag">WHAT GUIDES US</span>
              <h2>Our Three Guiding Pillars</h2>
              <p>Everything we create at Hiya is shaped by these enduring principles.</p>
            </div>

            <div className="hiyaghar-story-values-grid">
              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <h3>1. Pure & Natural</h3>
                <p>No harmful artificial shortcuts. Only traditional spices, real seeds, and herbal extracts you know and trust.</p>
              </div>

              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3>2. Handcrafted Care</h3>
                <p>Created in small, carefully monitored batches with the highest hygiene and packaging standards.</p>
              </div>

              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <h3>3. Joy of Sharing</h3>
                <p>Designed to be shared with family, loved ones, and guests after every joyful meal and celebration.</p>
              </div>
            </div>
          </ScrollReveal>

          {/* CTA Box */}
          <ScrollReveal variant="scale-up" className="hiyaghar-story-cta-box">
            <h2>Taste The Tradition Today</h2>
            <p>
              Experience our curated assortment of artisanal Mukhwas, wholesome Tea Masalas, and festive Gift Hampers.
            </p>
            <div className="hiyaghar-story-cta-btns">
              <button
                type="button"
                className="hiyaghar-story-btn-primary"
                onClick={() => navigateTo('/mukhwas')}
              >
                Explore Mukhwas Collection →
              </button>
              <button
                type="button"
                className="hiyaghar-story-btn-secondary"
                onClick={() => navigateTo('/customize-combo')}
              >
                Build Custom Combo Box
              </button>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};
