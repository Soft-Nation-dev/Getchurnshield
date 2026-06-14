import React, { useState } from 'react';
import { Shield, Sparkles, Check, Info, DollarSign, Calculator, HelpCircle } from 'lucide-react';

export default function Pricing() {
  // MAU Tier selection index (0: 0-1,000, 1: 1,001-5,000, 2: 5,001-10,000, 3: 10,000+)
  const [mauIndex, setMauIndex] = useState(0);

  const tiers = [
    { label: '0 – 1,000 MAU', value: '1k', retention: '$99', acquisition: '$149', combined: '$199' },
    { label: '1,001 – 5,000 MAU', value: '5k', retention: '$249', acquisition: '$349', combined: '$499' },
    { label: '5,001 – 10,000 MAU', value: '10k', retention: '$449', acquisition: '$599', combined: '$899' },
    { label: '10,000+ MAU (Enterprise)', value: 'enterprise', retention: 'Custom', acquisition: 'Custom', combined: 'Custom' }
  ];

  const currentTier = tiers[mauIndex];

  return (
    <div className="section-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Title Header */}
      <div className="page-hero compact-hero" style={{ textAlign: 'center', margin: '40px auto 60px', maxWidth: '800px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--border)',
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--accent-glow)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px'
        }}>
          Pricing Strategy
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          Flexible Plans Tailored to Your SaaS Velocity
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted)' }}>
          Align your development resources with actual user retention metrics. Slide the calculator to discover your plan rate.
        </p>
      </div>

      {/* MAU Tier Calculator */}
      <div className="card pricing-calculator" style={{
        maxWidth: '720px',
        margin: '0 auto 60px',
        padding: '30px',
        textAlign: 'center',
        background: 'rgba(20, 10, 34, 0.6)',
        borderColor: 'rgba(167, 139, 250, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', color: 'var(--accent-glow)' }}>
          <Calculator size={22} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Workspace Scale Calculator</h3>
        </div>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '30px' }}>
          Select the monthly active user base (MAU) of your platform to sync price tiers.
        </p>

        {/* Custom Interactive Slider Track */}
        <div style={{ padding: '0 20px', marginBottom: '40px' }}>
          <input 
            type="range" 
            min="0" 
            max="3" 
            value={mauIndex} 
            onChange={(e) => setMauIndex(parseInt(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: 'var(--accent)'
            }}
          />
          <div className="mau-labels" style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '16px',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: 'var(--muted)'
          }}>
            <span style={{ color: mauIndex === 0 ? 'var(--accent-glow)' : 'var(--muted)', transition: 'color 0.2s' }}>0–1k MAU</span>
            <span style={{ color: mauIndex === 1 ? 'var(--accent-glow)' : 'var(--muted)', transition: 'color 0.2s' }}>1k–5k MAU</span>
            <span style={{ color: mauIndex === 2 ? 'var(--accent-glow)' : 'var(--muted)', transition: 'color 0.2s' }}>5k–10k MAU</span>
            <span style={{ color: mauIndex === 3 ? 'var(--accent-glow)' : 'var(--muted)', transition: 'color 0.2s' }}>10k+ MAU</span>
          </div>
        </div>

        {/* Selected Tier Announcement */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'inline-block'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            Selected Configuration Tier
          </span>
          <strong style={{ fontSize: '1.4rem', color: '#fff' }}>
            {currentTier.label}
          </strong>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="responsive-card-grid pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        
        {/* Card 1: Retention Only */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700', uppercase: 'true', letterSpacing: '0.04em' }}>
              TELEMETRY CORE
            </span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '4px' }}>Retention Only</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
              Ideal for resolving path hesitation and configuration bottlenecks.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span className="price-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{currentTier.retention}</span>
            {currentTier.retention !== 'Custom' && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/mo</span>}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', flex: '1', marginBottom: '30px' }}>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Real-Time Watchdog Telemetry</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Shadow DOM Hotspot Overlays</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Basic Drop-off Dashboard</span>
            </li>
          </ul>

          <button className="cta-button" style={{ background: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }}>
            Select Retention Tier
          </button>
        </div>

        {/* Card 2: Acquisition Only */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700', uppercase: 'true', letterSpacing: '0.04em' }}>
              GROWTH CORE
            </span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '4px' }}>Acquisition Only</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
              Focused on optimizing sign-up rates and initial account activation.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span className="price-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{currentTier.acquisition}</span>
            {currentTier.acquisition !== 'Custom' && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/mo</span>}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', flex: '1', marginBottom: '30px' }}>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Sign-up Flow Optimizations</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Hotspot Prompt Telemetry</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Funnel Analytics Panel</span>
            </li>
          </ul>

          <button className="cta-button" style={{ background: 'transparent', border: '1px solid var(--border)', boxShadow: 'none' }}>
            Select Acquisition Tier
          </button>
        </div>

        {/* Card 3: Combined (Retention + Acquisition) */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderColor: 'var(--accent-glow)',
          background: 'rgba(124, 58, 237, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Tag */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            padding: '2px 10px',
            borderRadius: '999px',
            letterSpacing: '0.04em'
          }}>
            RECOMMENDED
          </div>

          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-glow)', fontWeight: '700', uppercase: 'true', letterSpacing: '0.04em' }}>
              FULL RETENTION ENGINE
            </span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '4px' }}>Retention + Acquisition</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
              Complete behavioral watchdog integration with end-to-end telemetry.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
            <span className="price-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{currentTier.combined}</span>
            {currentTier.combined !== 'Custom' && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/mo</span>}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', flex: '1', marginBottom: '30px' }}>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span><strong>All Watchdog Telemetry Snips</strong></span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span><strong>Complete Funnel & Hotspot Prompts</strong></span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Priority Support Routing</span>
            </li>
            <li style={{ display: 'flex', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--accent-glow)' }} />
              <span>Full Analytics Suite</span>
            </li>
          </ul>

          <button className="cta-button">
            Get Complete Access
          </button>
        </div>

      </div>

      {/* Performance Split Info Card */}
      <div className="card performance-card" style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(20, 10, 34, 0.8) 100%)',
        borderColor: 'rgba(167, 139, 250, 0.3)',
        textAlign: 'center',
        padding: '30px',
        maxWidth: '820px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent-glow)',
          marginBottom: '20px'
        }}>
          <DollarSign size={24} />
        </div>
        
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
          Align Costs to Verified Revenue Saved
        </h3>
        
        <p style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '16px', maxWidth: '680px', margin: '0 auto 16px' }}>
          We don't charge you flat monthly fees just to host tooltips. Under the ChurnShield performance contract, we take a <strong>20% performance fee of recovered user LTV</strong>.
        </p>

        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '640px', margin: '0 auto' }}>
          A user is counted as "recovered" if they successfully log back into the workspace within 7 days of seeing a retention hotspot. LTV is calculated conservatively as MRR × 12, capped at 6 months of value. Clawbacks apply if users churn within 30 days.
        </p>
      </div>

    </div>
  );
}
