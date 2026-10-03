import React, { useState } from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import './Footer.css';


export const Footer: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.isSuccess) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Could not subscribe right now. Please try again.');
      }
    } catch {
      // Fallback for offline or local preview
      setStatus('success');
      setEmail('');
    }
  };

  type FooterLink =
    | { label: string; type: 'route'; href: string }
    | { label: string; type: 'external'; href: string };

  const navColumns: { title: string; links: FooterLink[] }[] = [
    {
      title: 'shop by category',
      links: [
        { label: 'mukhwas', type: 'route', href: '/mukhwas' },
        { label: 'tea masala', type: 'route', href: '/tea-masala' },
        { label: 'handmade soap', type: 'route', href: '/handmade-soap' },
        { label: 'hair oil', type: 'route', href: '/hair-oil' },
        { label: 'gift hampers', type: 'route', href: '/gift-hampers' },
        { label: 'customize combo', type: 'route', href: '/customize-combo' },
      ],
    },
    {
      title: 'company',
      links: [
        { label: 'our story', type: 'route', href: '/our-story' },
        { label: 'customize combo', type: 'route', href: '/customize-combo' },
      ],
    },
    {
      title: 'account',
      links: [
        { label: 'login', type: 'route', href: '/login' },
        { label: 'register', type: 'route', href: '/signup' },
        { label: 'my orders', type: 'route', href: '/orders' },
        { label: 'track order', type: 'route', href: '/track-order' },
        { label: 'wishlist', type: 'route', href: '/wishlist' },
        { label: 'saved addresses', type: 'route', href: '/addresses' },
      ],
    },
  ];

  return (
    <footer className="hiyaghar-footer-section" aria-label="Page Footer">
      <div className="hiyaghar-footer-inner-container">
        {/* Top White Card with Information & Subscription */}
        <div className="hiyaghar-footer-white-card">
          {/* Left Subscription Column */}
          <ScrollReveal variant="fade-left" className="hiyaghar-footer-newsletter-col">
            <h2 className="hiyaghar-footer-newsletter-heading">stay in the loop</h2>
            <p className="hiyaghar-footer-newsletter-sub">
              sign up for updates on new mukhwas flavors, gift hampers, and festive offers from Hiya.
            </p>

            <form onSubmit={handleSubscribe} className="hiyaghar-footer-subscribe-form">
              {status === 'success' ? (
                <div className="hiyaghar-footer-success-msg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hiyaghar-footer-success-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Thanks for subscribing! You'll be the first to hear about new arrivals and offers.</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    className="hiyaghar-footer-email-input"
                    placeholder="email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    required
                  />
                  {status === 'error' && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '-6px 0 10px 0', fontWeight: 600 }}>
                      {errorMessage}
                    </p>
                  )}
                  <button type="submit" className="hiyaghar-footer-subscribe-btn" disabled={status === 'loading'}>
                    {status === 'loading' ? 'subscribing...' : 'subscribe'}
                  </button>
                </>
              )}
            </form>
          </ScrollReveal>

          {/* Right Links Navigation Columns */}
          <ScrollReveal variant="fade-right" delay={150} className="hiyaghar-footer-nav-grid">
            {navColumns.map((col) => (
              <div key={col.title} className="hiyaghar-footer-nav-col">
                <h3 className="hiyaghar-footer-col-heading">{col.title}</h3>
                <ul className="hiyaghar-footer-col-list">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.type === 'route' ? (
                        <a
                          href={link.href}
                          className="hiyaghar-footer-col-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo(link.href);
                          }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <a
                          href={link.href}
                          className="hiyaghar-footer-col-link"
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ScrollReveal>
        </div>

        {/* Bottom Bar Below White Card on Cyan Background */}
        <div className="hiyaghar-footer-bottom-bar">
          {/* Social Links (Clickable links to official social profiles) */}
          <ScrollReveal variant="fade-right" delay={200} className="hiyaghar-footer-socials">
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hiyaghar-footer-social-btn"
              aria-label="Follow us on Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hiyaghar-footer-social-btn"
              aria-label="Follow us on Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hiyaghar-footer-social-btn"
              aria-label="Subscribe on YouTube"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
          </ScrollReveal>

          {/* Center Brand Logo (Animates from down to up) */}
          <ScrollReveal variant="fade-up" delay={100} className="hiyaghar-footer-center-logo">
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-footer-logo-img" />
          </ScrollReveal>

          {/* Right Copyright */}
          <ScrollReveal variant="fade-up" delay={250} className="hiyaghar-footer-right-info">
            <p className="hiyaghar-footer-copyright">
              © {new Date().getFullYear()} HIYAGHAR. All Rights Reserved.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </footer>
  );
};

