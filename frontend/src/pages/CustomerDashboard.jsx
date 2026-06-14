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

function StatusTile({ icon: Icon, label, value, done }) {
  return (
    <div className={`customer-status-tile ${done ? 'is-done' : ''}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
            <StatusTile icon={Shield} label="Registration" value={stageDone(lead, 'registrationCompleted') ? 'Complete' : 'In progress'} done={stageDone(lead, 'diagnosticsCompleted')} />
            <StatusTile icon={Video} label="SDK snippet" value={stageDone(lead, 'sdkGenerated') ? 'Generated' : 'Pending'} done={stageDone(lead, 'sdkGenerated')} />
            <StatusTile icon={Mail} label="Deployment email" value={stageDone(lead, 'docsEmailSent') ? 'Sent' : 'Pending'} done={stageDone(lead, 'docsEmailSent')} />
            <StatusTile icon={CalendarDays} label="Audit call" value={stageDone(lead, 'calendarScheduled') ? 'Scheduled' : 'Not scheduled'} done={stageDone(lead, 'calendarScheduled')} />
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
