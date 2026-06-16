import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Copy, Mail, Shield, Video, CalendarDays } from 'lucide-react';
import { API_BASE_URL, getLeadByEmail, postLead, watchdogScriptUrl } from '../lib/runtime.js';

const PROGRESS_KEY = 'getchurnshield:onboarding-progress';

function readSavedProgress() {
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function stageDone(lead, key) {
  return Boolean(lead?.onboardingProgress?.[key] || readSavedProgress()?.[key]);
}

function normalizeUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function registrationFromLead(source = {}) {
  return {
    leadName: source.leadName || '',
    leadUrl: source.leadUrl || '',
    leadEmail: source.leadEmail || '',
    mrr: source.mrr || '',
    churn: source.churn || '',
    strategy: source.strategy || 'diy',
    headache: source.headache || '',
  };
}

function normalizedRegistration(source = {}) {
  return {
    leadName: (source.leadName || '').trim(),
    leadUrl: normalizeUrl(source.leadUrl),
    leadEmail: (source.leadEmail || '').trim().toLowerCase(),
    mrr: source.mrr || '',
    churn: source.churn || '',
    strategy: source.strategy || 'diy',
    headache: (source.headache || '').trim(),
  };
}

function StatusTile({ icon: Icon, label, value, done, active, onClick }) {
  return (
    <button type="button" className={`customer-status-tile ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`} onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

export default function CustomerDashboard() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
  const saved = readSavedProgress();
  const initialEmail = params.get('email') || saved.lead?.leadEmail || saved.formData?.leadEmail || '';
  const [email, setEmail] = useState(initialEmail);
  const [lead, setLead] = useState(saved.lead || null);
  const [loading, setLoading] = useState(Boolean(initialEmail));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeModule, setActiveModule] = useState('registration');
  const [actionStatus, setActionStatus] = useState('');
  const [showCalendarTools, setShowCalendarTools] = useState(false);
  const [registrationDraft, setRegistrationDraft] = useState(registrationFromLead(saved.lead || saved.formData || {}));

  const refreshLead = async (targetEmail = email) => {
    if (!targetEmail) return null;
    const result = await getLeadByEmail(targetEmail);
    if (result?.lead) {
      setLead(result.lead);
      setRegistrationDraft(registrationFromLead(result.lead));
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readSavedProgress(), lead: result.lead, dashboardVisited: true }));
      return result.lead;
    }
    return null;
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (!email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      const result = await getLeadByEmail(email);
      if (!active) return;
      if (result?.lead) {
        setLead(result.lead);
        setRegistrationDraft(registrationFromLead(result.lead));
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...saved, lead: result.lead, dashboardVisited: true }));
        postLead({ ...result.lead, action: 'dashboard_visited' });
      } else {
        setError('We could not find a registration for that email yet.');
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [email]);

  const snippet = useMemo(() => {
    const url = watchdogScriptUrl();
    if (!url) return 'Set VITE_API_BASE_URL to your Worker URL to generate the SDK snippet.';
    return `<script src="${url}" data-api-key="${lead?.sdkToken || 'cs_live_pending'}"></script>`;
  }, [lead]);

  const nextStep = useMemo(() => {
    if (!lead) return 'Complete your registration to unlock your workspace.';
    if (!stageDone(lead, 'sdkGenerated')) return 'Generate and install your SDK snippet.';
    if (!stageDone(lead, 'docsEmailSent')) return 'Send the deployment pack to your inbox.';
    if (!stageDone(lead, 'calendarScheduled')) return 'Schedule your retention audit.';
    return 'You are ready for the implementation review.';
  }, [lead]);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const runCloudAction = async (action) => {
    if (!lead) return;
    setActionStatus('Saving to Cloudflare...');
    const result = await postLead({ ...lead, action });
    if (result?.lead) {
      setLead(result.lead);
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readSavedProgress(), lead: result.lead }));
    }
    if (action === 'generate_sdk') {
      setActionStatus(result?.lead?.sdkToken ? `SDK generated: ${result.lead.sdkToken}` : 'SDK request saved.');
    } else if (action === 'send_docs') {
      setActionStatus(result?.email?.sent ? 'Deployment email queued successfully.' : `Email not accepted yet: ${result?.email?.error || 'No provider details returned.'}`);
    } else if (action === 'open_calendar') {
      setShowCalendarTools(true);
      setActionStatus('Calendar opened. Mark it scheduled after you complete the booking.');
    } else if (action === 'calendar_scheduled') {
      setShowCalendarTools(false);
      setActionStatus('Calendar schedule status saved.');
    }
    await refreshLead(lead.leadEmail);
  };

  const registrationHasChanges = useMemo(() => {
    if (!lead) return false;
    return JSON.stringify(normalizedRegistration(registrationDraft)) !== JSON.stringify(normalizedRegistration(lead));
  }, [lead, registrationDraft]);

  const saveRegistrationUpdates = async (event) => {
    event.preventDefault();
    if (!registrationDraft.leadEmail) {
      setActionStatus('Add a registration email before saving.');
      return;
    }
    setActionStatus('Updating registration in Cloudflare...');
    const payload = {
      ...registrationDraft,
      leadUrl: normalizeUrl(registrationDraft.leadUrl),
      leadEmail: registrationDraft.leadEmail.trim(),
      action: 'update_registration',
    };
    const result = await postLead(payload);
    if (result?.lead) {
      setLead(result.lead);
      setEmail(result.lead.leadEmail);
      setRegistrationDraft(registrationFromLead(result.lead));
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readSavedProgress(), lead: result.lead, formData: payload }));
      setActionStatus('Registration updated and saved to Cloudflare.');
    } else {
      setActionStatus(result?.error || 'Registration update could not be saved yet.');
    }
  };

  const moduleDetails = {
    registration: {
      title: 'Registration',
      body: 'Your core company, email, MRR, churn, and onboarding strategy are stored in Cloudflare Redis and visible to the admin dashboard.',
      steps: [
        `Lead captured: ${stageDone(lead, 'leadCaptured') ? 'yes' : 'not yet'}`,
        `Diagnostics completed: ${stageDone(lead, 'diagnosticsCompleted') ? 'yes' : 'not yet'}`,
        `Registration completed: ${stageDone(lead, 'registrationCompleted') ? 'yes' : 'not yet'}`,
      ],
    },
    sdk: {
      title: 'SDK snippet',
      body: 'Generate the customer SDK token and copy the real script tag that points to the deployed Cloudflare Worker.',
      steps: [
        `Token: ${lead?.sdkToken || 'pending'}`,
        `Generated: ${stageDone(lead, 'sdkGenerated') ? 'yes' : 'not yet'}`,
      ],
    },
    email: {
      title: 'Deployment email',
      body: 'Send the setup pack and store delivery references on the registration record.',
      steps: [
        `Requested: ${stageDone(lead, 'docsEmailRequested') ? 'yes' : 'not yet'}`,
        `Sent: ${stageDone(lead, 'docsEmailSent') ? 'yes' : 'not yet'}`,
        ...(lead?.email?.deliveries || []).map((item) => `${item.type}: ${item.id}`),
      ],
    },
    calendar: {
      title: 'Audit call',
      body: 'Open the Calendly audit flow and save whether the customer has scheduled the retention implementation call.',
      steps: [
        `Calendar opened: ${stageDone(lead, 'calendarOpened') ? 'yes' : 'not yet'}`,
        `Scheduled: ${stageDone(lead, 'calendarScheduled') ? 'yes' : 'not yet'}`,
        `Scheduled at: ${lead?.calendar?.scheduledAt || 'pending'}`,
      ],
    },
  };

  return (
    <section className="section-container customer-dashboard-page animate-fade-in">
      <div className="customer-dashboard-hero">
        <div>
          <span className="hero-tag">Customer workspace</span>
          <h1>{lead?.leadName || 'Your'} ChurnShield setup</h1>
          <p>
            Live registration status, deployment materials, and onboarding progress for {lead?.leadUrl || 'your SaaS app'}.
          </p>
        </div>
        <div className="customer-dashboard-login">
          <label className="form-label">Registration email</label>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const next = new FormData(event.currentTarget).get('email')?.toString().trim();
              if (next) setEmail(next);
            }}
          >
            <input name="email" defaultValue={email} className="form-input" placeholder="founder@company.com" />
            <button className="cta-button" type="submit">Load</button>
          </form>
        </div>
      </div>

      {loading ? <div className="card customer-dashboard-card">Loading your registration...</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      {lead ? (
        <>
          <div className="customer-status-grid">
            <StatusTile icon={Shield} label="Registration" value={stageDone(lead, 'registrationCompleted') ? 'Complete' : 'In progress'} done={stageDone(lead, 'diagnosticsCompleted')} active={activeModule === 'registration'} onClick={() => setActiveModule('registration')} />
            <StatusTile icon={Video} label="SDK snippet" value={stageDone(lead, 'sdkGenerated') ? 'Generated' : 'Pending'} done={stageDone(lead, 'sdkGenerated')} active={activeModule === 'sdk'} onClick={() => setActiveModule('sdk')} />
            <StatusTile icon={Mail} label="Deployment email" value={stageDone(lead, 'docsEmailSent') ? 'Sent' : 'Pending'} done={stageDone(lead, 'docsEmailSent')} active={activeModule === 'email'} onClick={() => setActiveModule('email')} />
            <StatusTile icon={CalendarDays} label="Audit call" value={stageDone(lead, 'calendarScheduled') ? 'Scheduled' : 'Not scheduled'} done={stageDone(lead, 'calendarScheduled')} active={activeModule === 'calendar'} onClick={() => setActiveModule('calendar')} />
          </div>

          <div className="card customer-dashboard-card customer-module-panel">
            <div className="card-header-row">
              <h3>{moduleDetails[activeModule].title}</h3>
              <span className="muted-text">Cloudflare saved</span>
            </div>
            <p>{moduleDetails[activeModule].body}</p>
            <div className="customer-detail-list">
              {moduleDetails[activeModule].steps.map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
            <div className="customer-module-actions">
              {activeModule === 'registration' ? (
                <form className="customer-registration-form" onSubmit={saveRegistrationUpdates}>
                  <input className="form-input" value={registrationDraft.leadName} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, leadName: event.target.value }))} placeholder="Founder name" required />
                  <input className="form-input" value={registrationDraft.leadUrl} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, leadUrl: event.target.value }))} placeholder="app.com" required />
                  <input className="form-input" type="email" value={registrationDraft.leadEmail} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, leadEmail: event.target.value }))} placeholder="founder@company.com" required />
                  <select className="form-input" value={registrationDraft.mrr} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, mrr: event.target.value }))} required>
                    <option value="" disabled>MRR</option>
                    <option value="low">&lt;$10k</option>
                    <option value="mid">$10k - $100k</option>
                    <option value="high">$100k+</option>
                  </select>
                  <select className="form-input" value={registrationDraft.churn} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, churn: event.target.value }))} required>
                    <option value="" disabled>Churn</option>
                    <option value="none">Don't know / Not tracking</option>
                    <option value="low">&lt;2%</option>
                    <option value="mid">2% - 5%</option>
                    <option value="high">5%+</option>
                  </select>
                  <select className="form-input" value={registrationDraft.strategy} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, strategy: event.target.value }))} required>
                    <option value="diy">DIY / Self-service</option>
                    <option value="dfy">Concierge</option>
                  </select>
                  <input className="form-input customer-registration-form-wide" value={registrationDraft.headache} onChange={(event) => setRegistrationDraft((prev) => ({ ...prev, headache: event.target.value }))} placeholder="Biggest churn headache" required />
                  {registrationHasChanges ? (
                    <button className="cta-button customer-registration-form-wide" type="submit">Save registration updates</button>
                  ) : null}
                </form>
              ) : null}
              {activeModule === 'sdk' ? <button className="cta-button" onClick={() => runCloudAction('generate_sdk')}>Generate SDK</button> : null}
              {activeModule === 'email' ? <button className="cta-button" onClick={() => runCloudAction('send_docs')}>Send deployment email</button> : null}
              {activeModule === 'calendar' ? (
                <>
                  <button className="cta-button" onClick={() => runCloudAction('open_calendar')}>Open Calendly</button>
                  <button className="icon-text-button" onClick={() => runCloudAction('calendar_scheduled')}>Mark scheduled</button>
                </>
              ) : null}
              <button className="icon-text-button" onClick={() => refreshLead(lead.leadEmail)}>Refresh cloud data</button>
            </div>
            {showCalendarTools && activeModule === 'calendar' ? (
              <div className="calendar-action-box">
                <a href={`https://calendly.com/getchurnshield/30min?name=${encodeURIComponent(lead.leadName || '')}&email=${encodeURIComponent(lead.leadEmail || '')}`} target="_blank" rel="noopener noreferrer">
                  Continue booking in Calendly
                </a>
              </div>
            ) : null}
            {actionStatus ? <p className="muted-text">{actionStatus}</p> : null}
          </div>

          <div className="customer-dashboard-grid">
            <div className="card customer-dashboard-card">
              <div className="card-header-row">
                <h3>Next step</h3>
                <Clock size={18} />
              </div>
              <p>{nextStep}</p>
              <div className="customer-detail-list">
                <span><strong>Email:</strong> {lead.leadEmail}</span>
                <span><strong>App:</strong> {lead.leadUrl}</span>
                <span><strong>MRR:</strong> {lead.mrr || 'Not set'}</span>
                <span><strong>Churn:</strong> {lead.churn || 'Not set'}</span>
                <span><strong>Plan:</strong> {lead.strategy === 'dfy' ? 'Concierge' : 'DIY / Self-service'}</span>
              </div>
            </div>

            <div className="card customer-dashboard-card">
              <div className="card-header-row">
                <h3>SDK snippet</h3>
                <button className="icon-text-button" onClick={copySnippet}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="customer-code-block"><code>{snippet}</code></pre>
              <p className="muted-text">API base: {API_BASE_URL || 'Not configured'}</p>
            </div>
          </div>

          <div className="card customer-dashboard-card">
            <div className="card-header-row">
              <h3>Assistant email delivery</h3>
              <Mail size={18} />
            </div>
            {lead.email?.sent ? (
              <div className="delivery-list">
                {lead.email.deliveries?.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="delivery-item">
                    <span>{item.type.replace(/_/g, ' ')}</span>
                    <code>{item.id}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p>{lead.email?.error || 'No deployment email has been sent yet.'}</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
