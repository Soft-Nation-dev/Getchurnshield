import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Shield, X } from 'lucide-react';
import { postLead, watchdogScriptUrl } from '../lib/runtime.js';

const PROGRESS_KEY = 'getchurnshield:onboarding-progress';

function readSavedProgress() {
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgressPatch(patch) {
  const next = { ...readSavedProgress(), ...patch, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  return next;
}

function formatMrr(value) {
  if (value === 'low') return '<$10k';
  if (value === 'mid') return '$10k-$100k';
  if (value === 'high') return '$100k+';
  return 'Not selected';
}

function formatChurn(value) {
  if (value === 'none') return 'Unknown';
  if (value === 'low') return '<2%';
  if (value === 'mid') return '2%-5%';
  if (value === 'high') return '5%+';
  return 'Not selected';
}

function CalendlyEmbed({ lead, onScheduled }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    const onMessage = (event) => {
      if (event.origin !== 'https://calendly.com') return;
      if (event.data?.event === 'calendly.event_scheduled') onScheduled?.(event.data);
    };
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, [onScheduled]);

  const params = new URLSearchParams({
    hide_event_type_details: '1',
    hide_gdpr_banner: '1',
  });
  if (lead?.leadName) params.set('name', lead.leadName);
  if (lead?.leadEmail) params.set('email', lead.leadEmail);

  return (
    <div
      className="calendly-inline-widget"
      data-url={`https://calendly.com/getchurnshield/30min?${params.toString()}`}
      style={{ minWidth: '320px', height: '480px' }}
    />
  );
}

export default function OnboardingModal({ isOpen, onClose, initialLeadData, onComplete }) {
  const savedProgress = readSavedProgress();
  const [step, setStep] = useState(savedProgress.diagnosticsCompleted ? 2 : 1);
  const [formData, setFormData] = useState({
    leadName: '',
    leadUrl: '',
    leadEmail: '',
    mrr: '',
    churn: '',
    strategy: 'diy',
    headache: '',
    ...savedProgress.formData,
    ...initialLeadData,
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeOptions, setActiveOptions] = useState([]);
  const [showCalendly, setShowCalendly] = useState(false);
  const [leadRecord, setLeadRecord] = useState(savedProgress.lead || null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const chatStreamRef = useRef(null);

  useEffect(() => {
    if (initialLeadData) {
      setFormData((prev) => {
        const next = { ...prev, ...initialLeadData };
        saveProgressPatch({ formData: next });
        return next;
      });
    }
  }, [initialLeadData]);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (isOpen && savedProgress.diagnosticsCompleted && chatMessages.length === 0) {
      startAssistant(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addChatMessage = (sender, text) => {
    setChatMessages((prev) => [
      ...prev,
      { sender, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      saveProgressPatch({ formData: next });
      return next;
    });
  };

  const syncLead = async (action = '') => {
    const result = await postLead({
      leadName: formData.leadName,
      leadUrl: formData.leadUrl,
      leadEmail: formData.leadEmail,
      mrr: formData.mrr,
      churn: formData.churn,
      strategy: formData.strategy,
      headache: formData.headache,
      action,
    });
    if (result?.lead) {
      setLeadRecord(result.lead);
      saveProgressPatch({ lead: result.lead, email: result.email, formData });
    }
    return result;
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setStep(2);
    saveProgressPatch({ formData, diagnosticsCompleted: true, currentStep: 2 });
    startAssistant(false);
    await syncLead();
  };

  const startAssistant = (resume = false) => {
    setIsTyping(true);
    setChatMessages([]);
    setActiveOptions([]);

    setTimeout(() => {
      addChatMessage(
        'assistant',
        resume
          ? `Welcome back, ${formData.leadName || 'there'}. I restored your saved onboarding progress for ${formData.leadUrl || 'your SaaS app'}.`
          : `Hey ${formData.leadName || 'there'}. I saved your registration for ${formData.leadUrl || 'your SaaS app'}.`
      );
      setTimeout(() => {
        addChatMessage(
          'assistant',
          `Registration profile\n\nMRR level: ${formatMrr(formData.mrr)}\nCurrent churn: ${formatChurn(formData.churn)}\nStrategy: ${formData.strategy === 'diy' ? 'Self-Service Video Hub' : 'Concierge Done-for-You'}\nCore headache: "${formData.headache || 'Not provided'}"`
        );
        setTimeout(() => {
          const friction = formData.churn === 'high' ? '32%' : formData.churn === 'mid' ? '24%' : '15%';
          addChatMessage(
            'assistant',
            `Diagnostics are saved. Your estimated friction band is ~${friction}. Next, generate the SDK snippet, send the deployment email, or schedule the retention audit.`
          );
          setIsTyping(false);
          setActiveOptions([
            { id: 'get-code', text: 'Generate SDK snippet' },
            { id: 'schedule-call', text: 'Schedule retention audit' },
            { id: 'send-email', text: 'Send deployment email' },
          ]);
        }, 750);
      }, 750);
    }, 500);
  };

  const handleOptionClick = async (optionId, optionText) => {
    addChatMessage('user', optionText);
    setActiveOptions([]);
    setIsTyping(true);
    setIsSavingAction(true);

    if (optionId === 'get-code') {
      const result = await syncLead('generate_sdk');
      const nextLead = result?.lead || leadRecord;
      saveProgressPatch({ sdkGenerated: true, lead: nextLead });
      const scriptUrl = watchdogScriptUrl();
      const token = nextLead?.sdkToken || 'cs_live_pending';
      const snippet = scriptUrl
        ? `<script src="${scriptUrl}" data-api-key="${token}"></script>`
        : '<!-- Set VITE_API_BASE_URL to your deployed Worker URL to generate this script URL. -->';
      addChatMessage('assistant', `SDK snippet generated and saved to your registration.\n\n\`\`\`html\n${snippet}\n\`\`\``);
    }

    if (optionId === 'send-email') {
      const result = await syncLead('send_docs');
      saveProgressPatch({
        docsEmailRequested: true,
        docsEmailSent: Boolean(result?.email?.sent),
        email: result?.email,
        lead: result?.lead,
      });
      const deliveries = result?.email?.deliveries?.map((item) => item.id).filter(Boolean).join('\n') || 'No provider delivery ID returned.';
      addChatMessage(
        'assistant',
        result?.email?.sent
          ? `Deployment email sent through Brevo.\n\nDelivery references:\n${deliveries}`
          : `The request is saved, but Brevo did not accept the email yet.\n\n${result?.email?.error || 'No provider details returned.'}`
      );
    }

    if (optionId === 'schedule-call') {
      await syncLead('open_calendar');
      saveProgressPatch({ calendarOpened: true });
      addChatMessage('assistant', 'Opening Calendly with your registration details prefilled. When Calendly confirms a booking, I will save that status.');
      setShowCalendly(true);
      setIsTyping(false);
      setIsSavingAction(false);
      return;
    }

    setIsTyping(false);
    setIsSavingAction(false);
    setActiveOptions([
      { id: 'schedule-call', text: 'Schedule call' },
      { id: 'get-code', text: 'View SDK code' },
      { id: 'send-email', text: 'Send email docs' },
    ]);
  };

  const handleCalendarScheduled = async () => {
    const result = await postLead({ ...formData, action: 'calendar_scheduled', calendarScheduledAt: new Date().toISOString() });
    if (result?.lead) setLeadRecord(result.lead);
    saveProgressPatch({ lead: result?.lead, calendarScheduled: true });
    addChatMessage('assistant', 'Calendar booking detected and saved to your customer dashboard.');
  };

  const handleFinish = async () => {
    const result = await syncLead('finish_registration');
    const nextLead = result?.lead || leadRecord || { ...formData, leadEmail: formData.leadEmail };
    saveProgressPatch({ lead: nextLead, registrationCompleted: true });
    onComplete?.(nextLead);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-soft)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Shield size={18} className="animate-pulse" style={{ color: 'var(--accent-glow)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>Onboarding Diagnostic</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {step === 1 ? 'Step 1 of 2: Application Parameters' : 'Step 2 of 2: Registration Workspace'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label">Company Monthly Recurring Revenue (MRR)</label>
                <select name="mrr" value={formData.mrr} onChange={handleChange} required className="form-input" style={{ background: '#1c122e', border: '1px solid var(--border)' }}>
                  <option value="" disabled>Select MRR Scale</option>
                  <option value="low">&lt;$10k</option>
                  <option value="mid">$10k - $100k</option>
                  <option value="high">$100k+</option>
                </select>
              </div>

              <div>
                <label className="form-label">Current Monthly Churn %</label>
                <select name="churn" value={formData.churn} onChange={handleChange} required className="form-input" style={{ background: '#1c122e', border: '1px solid var(--border)' }}>
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
                  {[
                    ['diy', 'DIY Onboarding (Free Hub)', 'Your team uploads self-produced videos to our layout tools at no cost.'],
                    ['dfy', 'Concierge Production ($2,000 Setup)', 'Our agency writes scripts, records walkthroughs, and deploys.'],
                  ].map(([value, title, body]) => (
                    <label
                      key={value}
                      style={{
                        border: formData.strategy === value ? '1px solid var(--accent-glow)' : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer',
                        background: formData.strategy === value ? 'rgba(124, 58, 237, 0.08)' : 'rgba(0,0,0,0.15)',
                      }}
                    >
                      <input type="radio" name="strategy" value={value} checked={formData.strategy === value} onChange={handleChange} style={{ marginTop: '3px' }} />
                      <div style={{ fontSize: '0.85rem' }}>
                        <strong style={{ display: 'block', color: value === 'dfy' ? 'var(--accent-glow)' : 'var(--ink)' }}>{title}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>{body}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Biggest Churn Headache right now</label>
                <input type="text" name="headache" value={formData.headache} onChange={handleChange} placeholder="e.g. dropoffs during configuration synchronization step" required className="form-input" style={{ background: '#1c122e' }} />
              </div>

              <button type="submit" className="cta-button" style={{ width: '100%' }}>
                Continue Setup
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {(formData.mrr === 'high' || formData.mrr === 'mid' || formData.churn === 'high') && (
                <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '12px', padding: '14px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-glow)' }}>
                    <Cpu size={16} />
                    <span style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>High-touch integration routing active</span>
                  </div>
                  <p style={{ color: 'var(--ink)' }}>Because your app has meaningful volume or churn risk, the dashboard will prioritize call scheduling, SDK setup, and deployment email status.</p>
                </div>
              )}

              <div className="modal-chat-window" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '380px' }}>
                <div style={{ background: '#140a22', padding: '12px 16px', borderRadius: '16px 16px 0 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--ink)' }}>Setup Assistant V2</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {leadRecord?.sdkToken || 'Registration active'}
                  </span>
                </div>

                {showCalendly ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                    <div style={{ background: '#f4f0ff', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e5ff' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 'bold' }}>Schedule 30min kick-off call</span>
                      <button onClick={() => setShowCalendly(false)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>Back to Chat</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <CalendlyEmbed lead={formData} onScheduled={handleCalendarScheduled} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div ref={chatStreamRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {chatMessages.map((msg, index) => (
                        <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ background: msg.sender === 'user' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)', border: msg.sender === 'user' ? 'none' : '1px solid var(--border)', color: 'var(--ink)', borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'pre-line' }}>
                            {msg.text}
                          </div>
                          <span style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px' }}>{msg.timestamp}</span>
                        </div>
                      ))}
                      {isTyping && <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', color: 'var(--muted)' }}>Working...</div>}
                    </div>

                    {activeOptions.length > 0 && (
                      <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(167, 139, 250, 0.1)' }}>
                        {activeOptions.map((opt) => (
                          <button key={opt.id} onClick={() => handleOptionClick(opt.id, opt.text)} className="option-pill" disabled={isSavingAction} style={{ background: opt.id === 'schedule-call' ? 'var(--accent)' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', color: 'var(--ink)', fontSize: '0.75rem', fontWeight: '600' }}>
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-action-row" style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} className="cta-button" style={{ background: 'transparent', border: '1px solid var(--border)', flex: 1, boxShadow: 'none' }}>
                  Edit Registration
                </button>
                <button onClick={handleFinish} className="cta-button" style={{ flex: 1 }} disabled={isSavingAction}>
                  Finish & Open Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
