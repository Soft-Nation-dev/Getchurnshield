import React, { useState, useEffect, useRef } from 'react';
import { Video, Sparkles, Wand2, Terminal, Play, Cpu, Check, Layers, AlertCircle, ArrowRight } from 'lucide-react';
import { assetUrl } from '../lib/runtime.js';

export default function OnboardingVideo() {
  const [activeStrategy, setActiveStrategy] = useState('diy');
  const [uiVersion, setUiVersion] = useState('v1.0');
  
  // AI Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [simStep, setSimStep] = useState(0);
  const [videoSource, setVideoSource] = useState(assetUrl('recording.mp4'));
  const [simulationComplete, setSimulationComplete] = useState(false);

  const videoRef = useRef(null);
  const terminalRef = useRef(null);

  const strategies = {
    diy: {
      title: 'Self-Service Onboarding',
      badge: 'Included Free',
      description: 'Our dashboard provides a dedicated "Video Hub" where you can upload and manage your own onboarding videos at no extra cost. This is ideal for teams who already have internal product demos ready to go.',
      benefits: [
        'Zero added monthly overhead',
        'Direct drag-and-drop dashboard uploader',
        'Custom hosting and delivery included',
        'Hotspot layout telemetry maps directly to uploads'
      ]
    },
    concierge: {
      title: 'The "Concierge" Production Service',
      badge: '$2,000 / Setup',
      description: "Don't want the stress of scriptwriting, recording, and editing? We offer a professional, Done-for-You service. We will produce a high-conversion, professional onboarding video tailored specifically to your app's sign-up flow, saving you time and ensuring maximum engagement.",
      benefits: [
        'Full professional copy and script writing',
        'High-definition screen recordings by studio specialists',
        'Seamless voiceovers and visual highlights',
        'Guaranteed onboarding activation lift'
      ]
    },
    ai: {
      title: 'AI-Automated Video Refresh',
      badge: 'Coming Soon — $150 / Gen',
      description: 'Keeping your onboarding content updated when your app UI changes has never been easier. No need to re-hire production agencies or scriptwriters every time you deploy a layout update.',
      benefits: [
        'On-Demand Updates: AI Agent scans your new UI & regenerates perfect sync videos',
        'Cost-Effective Scalability: Flat $150 generation rate instead of agency fees',
        'Unmatched Convenience: Lightweight, fast system that prevents user confusion',
        'Keep tutorials perfectly aligned with code versions'
      ]
    }
  };

  const startAiSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationComplete(false);
    setSimulationLogs([]);
    setSimStep(0);

    const logs = [
      { text: 'Initializing Watchdog AI Refresh Engine...', time: 0 },
      { text: `Locating target application viewport (Version: ${uiVersion === 'v1.0' ? 'v1.1' : 'v2.0'})...`, time: 800 },
      { text: 'Scanning DOM tree structures for navigational changes...', time: 1800 },
      { text: 'Detected 3 UI updates: [Billing Toggle, Sidebar Navigation, API Scope Selectors].', time: 3000 },
      { text: 'Regenerating video script prompts and timing offsets...', time: 4200 },
      { text: 'Synthesizing voice narrative using Neural_Voice_F3 stream...', time: 5500 },
      { text: 'Compiling perfect-sync UI walkthrough frame sequences...', time: 7000 },
      { text: '⚡ Video successfully generated in 1080p (Duration: 42s).', time: 8500 },
      { text: 'Syncing new video token with Shadow DOM hotspots.', time: 9200 },
      { text: 'COMPILATION COMPLETE. Generation Cost: $150.00 (Billed to Workspace).', time: 10000 }
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setSimulationLogs(prev => [...prev, log.text]);
        setSimStep(i + 1);
        if (i === logs.length - 1) {
          setIsSimulating(false);
          setSimulationComplete(true);
          // Auto play the simulated video
          if (videoRef.current) {
            videoRef.current.play();
          }
        }
      }, log.time);
    });
  };

  // Scroll simulation logs to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [simulationLogs]);

  return (
    <div className="section-container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Page Header */}
      <div style={{ textAlign: 'center', margin: '40px auto 60px', maxWidth: '800px' }}>
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
          Video Hub
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          GetChurnShield Onboarding Video Solutions
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted)' }}>
          We believe that onboarding is the heartbeat of your SaaS business. Choose a strategy designed to scale with your product growth.
        </p>
      </div>

      {/* Main Layout: Strategy Selection + Video Player */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', marginBottom: '80px', alignItems: 'start' }}>
        
        {/* Left Side: Strategy Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {Object.entries(strategies).map(([key, data]) => {
            const isSelected = activeStrategy === key;
            return (
              <div 
                key={key}
                onClick={() => setActiveStrategy(key)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '24px',
                  background: isSelected ? 'rgba(124, 58, 237, 0.05)' : 'var(--card)',
                  borderColor: isSelected ? 'var(--accent-glow)' : 'var(--border)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  boxShadow: isSelected ? '0 10px 30px rgba(124, 58, 237, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: isSelected ? 'var(--accent-glow)' : 'var(--ink)' }}>
                    {data.title}
                  </h3>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '999px'
                  }}>
                    {data.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', lineHeight: '1.5', color: isSelected ? 'var(--ink)' : 'var(--muted)' }}>
                  {data.description}
                </p>
              </div>
            );
          })}

        </div>

        {/* Right Side: Showcase Player Panel */}
        <div className="card" style={{ padding: '24px', position: 'sticky', top: '130px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} style={{ color: 'var(--accent-glow)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--ink)' }}>
                {strategies[activeStrategy].title} Preview
              </span>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
              active_telemetry_stream
            </div>
          </div>

          {/* Video Container */}
          <div style={{
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            border: '1px solid var(--border)',
            marginBottom: '24px',
            position: 'relative'
          }}>
            <video 
              ref={videoRef}
              src={videoSource}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Strategic Action Points */}
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--ink)' }}>Strategy Benefits:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {strategies[activeStrategy].benefits.map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: '0.8rem' }}>
                  <Check size={14} style={{ color: 'var(--success)', marginTop: '3px', shrink: 0 }} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* AI Refresh Engine Simulation Playground */}
      <section style={{ borderTop: '1px solid rgba(167, 139, 250, 0.1)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto 40px', textAlign: 'center' }}>
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
            marginBottom: '16px'
          }}>
            <Sparkles size={14} />
            <span>Interactive Module Playground</span>
          </div>
          
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
            Simulate the AI-Automated Video Refresh
          </h2>
          
          <p style={{ fontSize: '0.95rem' }}>
            When your code changes or your engineers push a new interface layout, trigger our AI Agent to scan your updated interface and compile a synced onboarding walkthrough. Try it live below:
          </p>
        </div>

        <div className="card" style={{
          maxWidth: '920px',
          margin: '0 auto',
          background: 'rgba(20, 10, 34, 0.4)',
          borderColor: 'rgba(167, 139, 250, 0.2)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
            
            {/* Left Controller Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label">Simulate UI Update Version</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {['v1.1 (Billing Update)', 'v2.0 (Redesign)'].map((ver) => {
                    const active = (ver.startsWith('v1.1') && uiVersion === 'v1.1') || (ver.startsWith('v2.0') && uiVersion === 'v2.0') || (uiVersion === 'v1.0' && ver.startsWith('v1.1'));
                    return (
                      <button
                        key={ver}
                        onClick={() => {
                          setUiVersion(ver.split(' ')[0]);
                          setSimulationComplete(false);
                          setSimulationLogs([]);
                        }}
                        disabled={isSimulating}
                        style={{
                          flex: 1,
                          background: active ? 'var(--accent-soft)' : 'rgba(0,0,0,0.15)',
                          border: active ? '1px solid var(--accent-glow)' : '1px solid var(--border)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '10px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          opacity: isSimulating ? 0.5 : 1
                        }}
                      >
                        {ver}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="form-label">Generation Fee Details</span>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '700' }}>
                    <span>Trigger AI Refresh</span>
                    <span style={{ color: 'var(--success)' }}>$150.00 flat</span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Saves time and money. Our AI scans your workspace routes, generates matching audio overlays, edits screen movements, and pushes changes instantly.
                  </p>
                </div>
              </div>

              <button 
                onClick={startAiSimulation}
                disabled={isSimulating}
                className="cta-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px',
                  background: isSimulating ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
                  border: isSimulating ? '1px solid var(--border)' : 'none',
                  cursor: isSimulating ? 'not-allowed' : 'pointer'
                }}
              >
                <Wand2 size={16} />
                <span>{isSimulating ? 'Scanning UI & Compiling...' : '⚡ Trigger AI Watchdog Scan'}</span>
              </button>
            </div>

            {/* Right Terminal Console Output */}
            <div style={{
              background: '#0a0512',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '20px',
              fontFamily: 'var(--mono)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              height: '280px'
            }}>
              
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: '10px',
                marginBottom: '10px',
                color: 'var(--muted)',
                fontSize: '0.7rem'
              }}>
                <Terminal size={14} style={{ color: 'var(--accent-glow)' }} />
                <span>AI_REFRESH_ENGINE_TERMINAL</span>
                <span style={{ marginLeft: 'auto' }}>online</span>
              </div>

              {/* Log Stream */}
              <div 
                ref={terminalRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  color: 'rgba(167, 139, 250, 0.85)'
                }}
              >
                {simulationLogs.length === 0 && !isSimulating && (
                  <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '60px' }}>
                    // Click the scan button to boot UI sync routine.
                  </div>
                )}

                {simulationLogs.map((log, index) => (
                  <div key={index} style={{
                    color: log.startsWith('⚡') ? 'var(--success)' : log.startsWith('COMPILATION') ? '#fff' : 'rgba(167, 139, 250, 0.95)',
                    fontWeight: log.startsWith('COMPILATION') ? '700' : 'normal'
                  }}>
                    &gt; {log}
                  </div>
                ))}

                {isSimulating && (
                  <div className="animate-pulse" style={{ color: 'var(--warning)' }}>
                    &gt; Working...
                  </div>
                )}
              </div>

              {/* Success Banner */}
              {simulationComplete && (
                <div style={{
                  marginTop: '10px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: 'var(--success)'
                }}>
                  <Check size={14} />
                  <span>Success: AI walk-through video refreshed! Play preview above.</span>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
