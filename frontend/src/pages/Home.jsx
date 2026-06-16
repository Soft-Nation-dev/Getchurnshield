import React, { useState } from 'react';
import { Shield, Play, Check, X, Sparkles, Zap, AlertTriangle, ArrowRight, Activity, Terminal, ShieldAlert } from 'lucide-react';
import { assetUrl, postLead } from '../lib/runtime.js';

export default function Home({ onOpenModal }) {
  const [formData, setFormData] = useState({
    leadName: '',
    leadUrl: '',
    leadEmail: ''
  });

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onOpenModal(formData);

    await postLead({
      leadName: formData.leadName,
      leadUrl: formData.leadUrl,
      leadEmail: formData.leadEmail,
    });
  };

  return (
    <div className="section-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Hero Header Section */}
      <section className="page-hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '40px auto 80px', maxWidth: '960px' }}>
        
        {/* Banner */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--border)',
          borderRadius: '999px',
          padding: '8px 20px',
          fontSize: '0.8rem',
          fontWeight: '600',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)'
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent-glow)' }} />
          <span style={{ color: 'var(--ink)' }}> Built to Drop Your SaaS Churn by 30%+</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #fff 40%, var(--accent-glow) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.04em'
        }}>
         
            Building the Autonomous Growth Engine for SaaS.

        </h1>

        {/* Hero Description */}
        <p style={{
          fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
          maxWidth: '820px',
          marginBottom: '40px',
          lineHeight: '1.6',
          color: 'var(--muted)'
        }}>
          We don’t just sell another dashboard. We architect your entire user growth lifecycle from automated customer acquisition to hyper-personalized onboarding and long-term retention. Get a single, high-fidelity command center that manages your full funnel,
          so you can focus on building your product while we secure your revenue.
        </p>


        {/* Urgent Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: '16px',
          padding: '12px 28px',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: 'var(--warning)',
          maxWidth: '460px',
          width: '100%',
          marginBottom: '32px',
          boxShadow: '0 4px 15px rgba(251, 191, 36, 0.05)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', animation: 'pulse 1.5s infinite' }} />
          <span>June Intake: Only 3 of 10 Enterprise Slots Left</span>
        </div>

        {/* Lead Lock Form */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '520px', zIndex: '10' }}>
          <form onSubmit={handleSubmit} className="card lead-lock-card" style={{ padding: '24px', textAlign: 'left' }}>
            <div className="lead-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">Founder / Product Lead</label>
                <input
                  type="text"
                  name="leadName"
                  value={formData.leadName}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Company App URL</label>
                <input
                  type="url"
                  name="leadUrl"
                  value={formData.leadUrl}
                  onChange={handleInputChange}
                  placeholder="https://app.com"
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <input
                type="email"
                name="leadEmail"
                value={formData.leadEmail}
                onChange={handleInputChange}
                placeholder="Enter your business email"
                required
                className="form-input"
              />
              <button type="submit" className="cta-button" style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}>
                Lock In Churn Audit
              </button>
            </div>
          </form>

          <div className="trust-row" style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} style={{ color: 'var(--success)' }} />
              ​Full-Funnel Growth OS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} style={{ color: 'var(--success)' }} />
              Scalable Tiered Pricing
            </span>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="hero-video-shell" style={{
          marginTop: '60px',
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '12px',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!isVideoPlaying ? (
              <>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle, rgba(12, 6, 20, 0.4) 0%, rgba(12, 6, 20, 0.85) 100%)',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
                  </div>
                  
                  <div style={{ alignSelf: 'center', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: '#fff' }}>See ChurnShield In Real-Time Operation</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '400px' }}>
                      Watch exactly how our behavioral watchdog isolates, renders, and solves platform drop-offs on autopilot.
                    </p>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>
                    getchurnshield.io/explainer.mp4
                  </div>
                </div>

                <button
                  className="video-play-button"
                  onClick={() => setIsVideoPlaying(true)}
                  style={{
                    position: 'relative',
                    zIndex: 3,
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(124, 58, 237, 0.6)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: '4px solid #fff'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Play size={32} style={{ fill: '#fff', marginLeft: '6px' }} />
                </button>
              </>
            ) : (
              <video 
                src={assetUrl('recording.mp4')} 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>

      </section>

      {/* Comparison Grid Section */}
      <section style={{ margin: '120px 0', borderTop: '1px solid rgba(167, 139, 250, 0.1)', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-elevated)',
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
            Growth OS Comparison
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
            Move From Empty Toolkits To An Operating System For Retention
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
            Most onboarding tools still leave your team writing scripts, fixing broken guides, and refreshing content manually. ChurnShield gives you a managed growth layer built for acquisition, activation, and long-term retention.
          </p>
        </div>

        <div className="card comparison-matrix" style={{
          padding: 0,
          overflow: 'hidden',
          borderColor: 'rgba(167, 139, 250, 0.25)',
          background: 'rgba(255,255,255,0.025)'
        }}>
          <div className="comparison-matrix-header">
            <div>
              <X size={18} style={{ color: 'var(--danger)' }} />
              <span>Empty SaaS Toolkits</span>
            </div>
            <div>
              <Check size={18} style={{ color: 'var(--success)' }} />
              <span>ChurnShield Growth OS</span>
            </div>
          </div>

          {[
            [
              ['Manual Funnel Building', 'You must write scripts, record, and manually build layouts.'],
              ['Architected Growth', 'Full-funnel setup from acquisition to long-term retention.']
            ],
            [
              ['Fragile Integrations', 'Guides break every time your engineers ship updates.'],
              ['Adaptive Infrastructure', 'Continuous monitoring with instant updates when your UI shifts.']
            ],
            [
              ['Manual Content Updates', 'Constant effort required to keep onboarding current.'],
              ['Total Content Control', 'Swap videos and update hotspots instantly via your custom dashboard.']
            ],
            [
              ['Flat Monthly Fees', 'You pay for tools you still have to manage yourself.'],
              ['Scalable Tiered Licensing', 'Value-aligned pricing that grows with your MAU.']
            ],
            [
              ['Generic UX', 'Bloated modals that clash with your native brand styling.'],
              ['Invisible Native UX', 'Shadow DOM delivery that feels like part of your core code.']
            ]
          ].map(([empty, shield]) => (
            <div className="comparison-matrix-row" key={empty[0]}>
              <div>
                <strong>{empty[0]}:</strong>
                <span>{empty[1]}</span>
              </div>
              <div>
                <strong>{shield[0]}:</strong>
                <span>{shield[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure Features Section */}
      <section style={{ margin: '80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Complete Operational Onboarding Infrastructure</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            We combine a real-time behavioral watchdog snippet script with an automated, premium asset delivery pipeline.
          </p>
        </div>

        <div className="responsive-card-grid feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.12)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-glow)',
              marginBottom: '16px'
            }}>
              <Activity size={20} />
            </div>
            <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Real-Time Watchdog</h4>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              Our low-latency asynchronous engine monitors live interaction frames and flags anomalies, rage clicks, and path hesitation instantly.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.12)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-glow)',
              marginBottom: '16px'
            }}>
              <Play size={20} style={{ marginLeft: '2px' }} />
            </div>
            <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Automated AI Video Engine</h4>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              We script, build, and deploy hyper-targeted UI micro-videos onto friction routes. Dynamic updates are triggered when UI shifts.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.12)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-glow)',
              marginBottom: '16px'
            }}>
              <Terminal size={20} />
            </div>
            <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Sandbox Isolation</h4>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              Built using isolated Shadow DOM containers, meaning our tooltips and custom video modals insert smoothly without interfering with your code styling.
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{
              background: 'rgba(124, 58, 237, 0.12)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-glow)',
              marginBottom: '16px'
            }}>
              <Shield size={20} />
            </div>
            <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>Metrics Dashboard</h4>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              Our system tracks activation benchmarks, links user saves directly to your platform LTV calculations, and keeps performance reporting fully transparent.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
