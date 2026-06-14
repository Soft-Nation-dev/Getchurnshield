import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Terminal, Send, Check, Play, Cpu, Phone } from 'lucide-react';
import { postLead, watchdogScriptUrl } from '../lib/runtime.js';

function CalendlyEmbed() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  return (
    <div 
      className="calendly-inline-widget" 
      data-url="https://calendly.com/getchurnshield/30min?hide_event_type_details=1&hide_gdpr_banner=1" 
      style={{ minWidth: '320px', height: '480px' }} 
    />
  );
}

export default function OnboardingModal({ isOpen, onClose, initialLeadData }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mrr: '',
    churn: '',
    strategy: 'diy',
    headache: '',
    ...initialLeadData
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [activeOptions, setActiveOptions] = useState([]);
  const [showCalendly, setShowCalendly] = useState(false);

  const chatStreamRef = useRef(null);

  // Sync initial lead data if provided (e.g. from the home page CTA form)
  useEffect(() => {
    if (initialLeadData) {
      setFormData(prev => ({ ...prev, ...initialLeadData }));
    }
  }, [initialLeadData]);

  // Scroll to bottom of chatbot stream when messages change
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setStep(2);
    startChatSimulation();

    await postLead({
      leadName: formData.leadName,
      leadUrl: formData.leadUrl,
      leadEmail: formData.leadEmail,
      mrr: formData.mrr,
      churn: formData.churn,
      strategy: formData.strategy,
      headache: formData.headache,
    });
  };

  // Chat Simulation sequence
  const startChatSimulation = () => {
    setIsTyping(true);
    setChatMessages([]);
    setChatStep(0);

    setTimeout(() => {
      addChatMessage('assistant', `👋 Hey ${formData.leadName || 'there'}! I'm the ChurnShield Setup Operator. I've successfully registered your app: ${formData.leadUrl || 'your SaaS app'}.`);
      setIsTyping(true);

      setTimeout(() => {
        addChatMessage('assistant', `Analyzing onboarding telemetry diagnostics... 🩺\n\n• MRR level: ${formData.mrr === 'low' ? '<$10k' : formData.mrr === 'mid' ? '$10k-$100k' : '$100k+'}\n• Current Churn: ${formData.churn === 'none' ? 'Unknown' : formData.churn === 'low' ? '<2%' : formData.churn === 'mid' ? '2%-5%' : '5%+'}\n• Strategy: ${formData.strategy === 'diy' ? 'Self-Service Video Hub' : 'Concierge Done-for-You'}\n• Core Headache: "${formData.headache}"`);
        setIsTyping(true);

        setTimeout(() => {
          const bottleneckRate = formData.churn === 'high' ? '32%' : formData.churn === 'mid' ? '24%' : '15%';
          addChatMessage('assistant', `Diagnostics report completed! We've identified a potential drop-off rate of ~${bottleneckRate} during your active setup flow. To fix this, we recommend initializing the low-latency watchdog snippet.`);
          setIsTyping(false);
          setChatStep(1);
          setActiveOptions([
            { id: 'get-code', text: '💻 Generate SDK Snippet' },
            { id: 'schedule-call', text: '📞 Schedule retention audit' },
            { id: 'send-email', text: '✉️ Send documentation to developer' }
          ]);
        }, 1200);
      }, 1500);
    }, 800);
  };

  const addChatMessage = (sender, text) => {
    setChatMessages(prev => [...prev, { sender, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };

  const handleOptionClick = (optionId, optionText) => {
    addChatMessage('user', optionText);
    setActiveOptions([]);
    setIsTyping(true);

    setTimeout(() => {
      if (optionId === 'get-code') {
        const clientToken = `cs_live_${formData.leadName ? formData.leadName.toLowerCase().replace(/\s+/g, '_') : 'client'}_${Math.random().toString(36).substring(2, 8)}`;
        const scriptUrl = watchdogScriptUrl();
        const snippet = scriptUrl
          ? `<script src="${scriptUrl}" data-api-key="${clientToken}"></script>`
          : '<!-- Set VITE_API_BASE_URL to your deployed Worker URL to generate this script URL. -->';
        addChatMessage('assistant', `Here is your watchdog telemetry script custom-configured for your domain. Copy and paste this snippet into your root index.html file:\n\n\`\`\`html\n${snippet}\n\`\`\`\n\nYou can also find detailed layout instructions in the Sandbox tab!`);
      } else if (optionId === 'schedule-call') {
        addChatMessage('assistant', `Loading Calendly schedule operator... 📅`);
        setTimeout(() => {
          setShowCalendly(true);
          setIsTyping(false);
        }, 800);
        return;
      } else if (optionId === 'send-email') {
        addChatMessage('assistant', `Perfect! A deployment pack containing the Shadow DOM sandbox code and tracking checklist has been sent to ${formData.leadEmail || 'your email'} using Resend API.`);
        
        // Re-post to ensure email triggers
        postLead({
          leadName: formData.leadName,
          leadUrl: formData.leadUrl,
          leadEmail: formData.leadEmail,
          mrr: formData.mrr,
          churn: formData.churn,
          strategy: formData.strategy,
          headache: formData.headache,
        });
      } else if (optionId === 'restart') {
        setShowCalendly(false);
        startChatSimulation();
        return;
      }

      setIsTyping(false);
      setActiveOptions([
        { id: 'schedule-call', text: '📞 Schedule call' },
        { id: 'get-code', text: '💻 View SDK code' },
        { id: 'send-email', text: '✉️ Send email docs' },
        { id: 'restart', text: '🔄 Restart setup guide' }
      ]);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-soft)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Shield size={18} className="animate-pulse" style={{ color: 'var(--accent-glow)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Onboarding Diagnostic</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {step === 1 ? 'Step 1 of 2: Application Parameters' : 'Step 2 of 2: Telemetry Compilation'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {step === 1 ? (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label">Company Monthly Recurring Revenue (MRR)</label>
                <select 
                  name="mrr" 
                  value={formData.mrr} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                  style={{ background: '#1c122e', border: '1px solid var(--border)' }}
                >
                  <option value="" disabled>Select MRR Scale</option>
                  <option value="low">&lt;$10k</option>
                  <option value="mid">$10k - $100k</option>
                  <option value="high">$100k+</option>
                </select>
              </div>

              <div>
                <label className="form-label">Current Monthly Churn %</label>
                <select 
                  name="churn" 
                  value={formData.churn} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                  style={{ background: '#1c122e', border: '1px solid var(--border)' }}
                >
                  <option value="" disabled>Select Current Churn</option>
                  <option value="none">Don't know / Not tracking</option>
                  <option value="low">&lt;2%</option>
                  <option value="mid">2% - 5%</option>
                  <option value="high">5%+</option>
                </select>
              </div>

              <div>
                <label className="form-label">Onboarding Video Strategy</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <label 
                    style={{ 
                      border: formData.strategy === 'diy' ? '1px solid var(--accent-glow)' : '1px solid var(--border)', 
                      borderRadius: '12px', 
                      padding: '12px', 
                      display: 'flex', 
                      gap: '12px', 
                      cursor: 'pointer',
                      background: formData.strategy === 'diy' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="strategy" 
                      value="diy" 
                      checked={formData.strategy === 'diy'}
                      onChange={handleChange}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong style={{ display: 'block', color: 'var(--ink)' }}>DIY Onboarding (Free Hub)</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                        Your team uploads self-produced videos to our layout tools at no cost.
                      </span>
                    </div>
                  </label>

                  <label 
                    style={{ 
                      border: formData.strategy === 'dfy' ? '1px solid var(--accent-glow)' : '1px solid var(--border)', 
                      borderRadius: '12px', 
                      padding: '12px', 
                      display: 'flex', 
                      gap: '12px', 
                      cursor: 'pointer',
                      background: formData.strategy === 'dfy' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="strategy" 
                      value="dfy" 
                      checked={formData.strategy === 'dfy'}
                      onChange={handleChange}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong style={{ display: 'block', color: 'var(--accent-glow)' }}>Concierge Production ($2,000 Setup)</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                        Our agency writes script, shoots high-conversion demo video, and deploys.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Biggest Churn Headache right now</label>
                <input 
                  type="text" 
                  name="headache" 
                  value={formData.headache} 
                  onChange={handleChange} 
                  placeholder="e.g. dropoffs during configuration synchronization step" 
                  required 
                  className="form-input" 
                  style={{ background: '#1c122e' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="cta-button" style={{ width: '100%' }}>
                  Continue Setup
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              
              {/* Dynamic Warning Alert for Mid/High MRR or High Churn */}
              {(formData.mrr === 'high' || formData.mrr === 'mid' || formData.churn === 'high') && (
                <div style={{
                  background: 'rgba(124, 58, 237, 0.12)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-glow)' }}>
                    <Cpu size={16} />
                    <span style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      High-Touch Integration Routing Active
                    </span>
                  </div>
                  <p style={{ color: 'var(--ink)' }}>
                    Hi {formData.leadName || 'Founder'}, because your app manages high volume or experiences critical churn parameters, our engineers can assist you with your integration script setup. We can schedule a screen-share session to optimize your Shadow DOM sandbox overlay.
                  </p>
                </div>
              )}

              {/* Chatbot Window */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '380px'
              }}>
                {/* Chatbot Header */}
                <div style={{
                  background: '#140a22',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 0 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--ink)' }}>Setup Assistant V2</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    Async Pack Compiled
                  </span>
                </div>

                {/* Conditional Chat vs Calendly Embed */}
                {showCalendly ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                    <div style={{ background: '#f4f0ff', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e5ff' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 'bold' }}>Schedule 30min kick-off call</span>
                      <button 
                        onClick={() => {
                          setShowCalendly(false);
                          setActiveOptions([
                            { id: 'schedule-call', text: '📞 Schedule call' },
                            { id: 'get-code', text: '💻 View SDK code' },
                            { id: 'send-email', text: '✉️ Send email docs' }
                          ]);
                        }}
                        style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Back to Chat
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <CalendlyEmbed />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Message Stream */}
                    <div 
                      ref={chatStreamRef}
                      style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index}
                          style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <div style={{
                            background: msg.sender === 'user' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                            border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                            color: 'var(--ink)',
                            borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            padding: '10px 14px',
                            fontSize: '0.8rem',
                            whiteSpace: 'pre-line'
                          }}>
                            {msg.text}
                          </div>
                          <span style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>
                            {msg.timestamp}
                          </span>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--muted)' }} />
                          <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--muted)', animationDelay: '0.2s' }} />
                          <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--muted)', animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>

                    {/* Options List */}
                    {activeOptions.length > 0 && (
                      <div style={{
                        padding: '8px 12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        borderTop: '1px solid rgba(167, 139, 250, 0.1)'
                      }}>
                        {activeOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleOptionClick(opt.id, opt.text)}
                            style={{
                              background: opt.id === 'schedule-call' ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              color: 'var(--ink)',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            className="option-pill"
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setStep(1)} 
                  className="cta-button" 
                  style={{ background: 'transparent', border: '1px solid var(--border)', flex: 1, boxShadow: 'none' }}
                >
                  Back
                </button>
                <button onClick={onClose} className="cta-button" style={{ flex: 1 }}>
                  Finish Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
