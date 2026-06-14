import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Code, Check, Copy, ArrowRight, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { assetUrl } from '../lib/runtime.js';

export default function Sandbox() {
  const [activeStep, setActiveStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [eventLogs, setEventLogs] = useState([]);

  const terminalEndRef = useRef(null);

  const steps = [
    {
      number: 1,
      title: 'Step 1: Initialization',
      subtitle: 'Load the asynchronous V2 SDK.',
      code: `<!-- Insert this into your root index.html head -->
<script>
  window.ChurnShield = window.ChurnShield || [];
  ChurnShield.push(['init', 'live_token_77a']);
  (function() {
    var cs = document.createElement('script');
    cs.type = 'text/javascript';
    cs.async = true;
    cs.src = 'https://cdn.getchurnshield.io/sdk/v2.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(cs, s);
  })();
</script>`,
      fileName: 'index.html'
    },
    {
      number: 2,
      title: 'Step 2: Identify Session',
      subtitle: 'Sync user workspace context.',
      code: `// Trigger upon user login or session load
window.ChurnShield.push(['identify', 'usr_8829x', {
  company: 'Softnation SaaS Corp',
  plan: 'Growth Enterprise',
  email: 'founder@softnation.com',
  mrr: 12500
}]);`,
      fileName: 'authContext.js'
    },
    {
      number: 3,
      title: 'Step 3: Monitor Watchdog',
      subtitle: 'Initialize live page watchdogs.',
      code: `// Start behavioral monitoring on complex paths
window.ChurnShield.push(['watchdog', 'onboarding_database_sync', {
  selector: '#db-sync-container',
  rageClicks: true,
  hesitationTimeoutMs: 30000,
  assetUrl: '${assetUrl('recording.mp4')}'
}]);`,
      fileName: 'watchdogConfig.js'
    }
  ];

  const currentStep = steps[activeStep - 1];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentStep.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startTelemetrySimulator = () => {
    if (isRunning) return;
    setIsRunning(true);
    setEventLogs([]);

    const events = [
      { text: '📡 Initializing ChurnShield SDK...', delay: 0 },
      { text: '🔑 Validating workspace token (live_token_77a)... Verified.', delay: 2000 },
      { text: '👤 User identified: usr_8829x (Softnation SaaS Corp)', delay: 4000 },
      { text: '🕵️ Watchdog monitor mounted: onboarding_database_sync', delay: 5000 },
      { text: '👁️ Observing active route: /dashboard/settings/database-connection', delay: 5500 },
      { text: '⚠️ rage_click detected: 5 taps on #btn-sync-database in 2.1s', delay: 6000 },
      { text: '⚠️ path_hesitation warning: User inactive for 32s during sync routine', delay: 7000 },
      { text: '🚀 Threshold exceeded: Injecting Shadow DOM onboarding tooltip wrapper...', delay: 7500 },
      { text: '🎬 Video widget active: Playing database walkthrough video preview...', delay: 8000 },
      { text: '💚 User resolved path hesitation. Telemetry signal: SUCCESS.', delay: 9000 },
      { text: '🏆 Churn Saved verified: User LTV ($12,500) preserved.', delay: 10000 }
    ];

    events.forEach((ev) => {
      setTimeout(() => {
        setEventLogs(prev => [...prev, { text: ev.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
      }, ev.delay);
    });

    setTimeout(() => {
      setIsRunning(false);
    }, events[events.length - 1].delay + 500);
  };

  // Auto scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventLogs]);

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
          Sandbox Workspace
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          Developer Telemetry Sandbox
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted)' }}>
          Deploy the GetChurnShield low-latency runtime script in minutes. Track, identify, and mount behavioral watchdogs.
        </p>
      </div>

      {/* Main Sandbox Panel */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '8px',
        boxShadow: 'var(--shadow)',
        marginBottom: '60px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '8px' }}>
          
          {/* Left Navigation Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
            {steps.map((st) => {
              const active = activeStep === st.number;
              return (
                <div
                  key={st.number}
                  onClick={() => setActiveStep(st.number)}
                  style={{
                    cursor: 'pointer',
                    padding: '20px',
                    borderRadius: '16px',
                    background: active ? 'var(--accent-soft)' : 'rgba(0,0,0,0.15)',
                    border: active ? '1px solid var(--accent-glow)' : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: active ? 'var(--accent-glow)' : 'var(--muted)',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {st.title}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: active ? 'var(--ink)' : 'var(--muted)', margin: 0 }}>
                    {st.subtitle}
                  </p>
                </div>
              );
            })}

            <div style={{
              marginTop: 'auto',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--accent-glow)', fontWeight: '700', marginBottom: '6px' }}>
                <AlertCircle size={16} />
                <span>Sandbox Sandbox SDK V2</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                This is a mock implementation of the real ChurnShield snippet. You can simulate the event triggers using the live log console.
              </p>
            </div>
          </div>

          {/* Right Code Block Viewer */}
          <div style={{
            background: '#090512',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(167, 139, 250, 0.1)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{currentStep.fileName}</span>
              </div>
              
              <button 
                onClick={handleCopy}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: 'var(--ink)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <pre style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.8rem',
              lineHeight: '1.6',
              color: 'rgba(167, 139, 250, 0.95)',
              overflowX: 'auto',
              flex: 1,
              whiteSpace: 'pre-wrap'
            }}>
              <code>{currentStep.code}</code>
            </pre>
          </div>

        </div>
      </div>

      {/* Watchdog Simulation Output console */}
      <section style={{ borderTop: '1px solid rgba(167, 139, 250, 0.1)', paddingTop: '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-glow)', marginBottom: '16px' }}>
              <Terminal size={20} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Live watchdogs in action</h2>
            </div>
            
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Test how the ChurnShield engine reacts to user frustration. When you launch the simulator, the Watchdog Agent monitors interactive telemetry vectors (such as mouse route hesitation and button clicks).
            </p>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '30px' }}>
              Once thresholds are crossed, the script dynamically encapsulates the layout frame and injects a helpful overlay to prevent drop-off—saving the account without triggering code exceptions.
            </p>

            <button 
              onClick={startTelemetrySimulator}
              disabled={isRunning}
              className="cta-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                fontSize: '0.9rem',
                opacity: isRunning ? 0.6 : 1,
                cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isRunning ? <RefreshCw className="animate-pulse" size={16} /> : <Play size={16} style={{ fill: '#fff' }} />}
              <span>{isRunning ? 'Simulator Running...' : 'Launch Watchdog Simulator'}</span>
            </button>
          </div>

          {/* Terminal Box */}
          <div className="card" style={{
            background: '#090512',
            borderColor: 'rgba(167, 139, 250, 0.25)',
            boxShadow: 'var(--shadow)',
            padding: '20px',
            fontFamily: 'var(--mono)',
            fontSize: '0.8rem',
            height: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '10px',
              marginBottom: '12px',
              color: 'var(--muted)',
              fontSize: '0.7rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRunning ? 'var(--success)' : 'var(--muted)' }} />
              <span>LIVE_TELEMETRY_WATCHDOG_SHELL</span>
              <span style={{ marginLeft: 'auto' }}>offline-safe simulator</span>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--ink)'
            }}>
              {eventLogs.length === 0 && !isRunning && (
                <div style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '80px' }}>
                  // Press "Launch Watchdog Simulator" to capture streams.
                </div>
              )}

              {eventLogs.map((log, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '8px',
                  color: log.text.includes('SUCCESS') ? 'var(--success)' : log.text.includes('LTV') ? 'var(--success)' : log.text.includes('warning') ? 'var(--warning)' : log.text.includes('detected') ? 'var(--danger)' : 'rgba(167, 139, 250, 0.9)'
                }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
