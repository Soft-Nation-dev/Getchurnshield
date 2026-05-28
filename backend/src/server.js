// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =========================================================================
// ITEM 4 & 7: TRACKING SNIPPET ENTRY & LIVE DEBUGGER ENDPOINTS
// =========================================================================

// This endpoint is what the 1-line tracking snippet inside the client's app pings
app.post('/api/telemetry/ping', async (req, res) => {
    const { appUrl } = req.body; // Client script sends its window.location.origin
    
    if (!appUrl) return res.status(400).json({ error: "Missing origin parameter." });

    try {
        const cleanedDomain = appUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        // Locate lead matching that app domain filter
        const lead = await prisma.lead.findFirst({
            where: { appUrl: { contains: cleanedDomain } }
        });

        if (!lead) return res.status(404).json({ error: "Domain not registered under any account profile." });

        // Update tracking status maps to ACTIVE state instantly
        await prisma.lead.update({
            where: { id: lead.id },
            data: {
                trackingStatus: 'ACTIVE',
                lastSignalAt: new Date()
            }
        });

        return res.json({ success: true, status: "Signal handshake verified successfully." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Frontend Polling Endpoint: Checks if a customer's registered script is live
app.get('/api/leads/verify-script', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Missing identity profile email." });

    try {
        const lead = await prisma.lead.findUnique({ where: { email: String(email) } });
        if (!lead) return res.status(404).json({ error: "Lead profile layout not found." });

        return res.json({ trackingStatus: lead.trackingStatus });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// ITEM 1 & 6: BACKGROUND AUTOMATED DISPATCH WORKERS (Runs every 1 min)
// =========================================================================
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    try {
        // Item 1: Grab qualified targets who registered > 10 mins ago and haven't received setup packs
        const dispatchQueue = await prisma.lead.findMany({
            where: {
                status: 'QUALIFIED',
                setupPackSent: false,
                createdAt: { lt: tenMinutesAgo }
            }
        });

        for (const lead of dispatchQueue) {
            await resend.emails.send({
                from: 'GetChurnShield <onboarding@getchurnshield.io>',
                to: lead.email,
                subject: 'Your ChurnShield Custom Asynchronous Integration Pack Code',
                html: `<p>Hey ${lead.name}, here is your customized 1-line script snippet logic pack to target your platform bottleneck: "${lead.headache}"...</p>`
            });

            await prisma.lead.update({
                where: { id: lead.id },
                data: { setupPackSent: true, lastEmailSentAt: new Date() }
            });
            console.log(`[Item 1] Dispatched custom onboarding pack to ${lead.email}`);
        }

        // Item 6: Waitlist Nurture Engine (Checks timeline intervals for waitlisted entries)
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const waitlistQueue = await prisma.lead.findMany({
            where: {
                status: 'WAITLISTED',
                nurtureStep: 0,
                createdAt: { lt: threeDaysAgo }
            }
        });

        for (const lead of waitlistQueue) {
            await resend.emails.send({
                from: 'GetChurnShield <waitlist@getchurnshield.io>',
                to: lead.email,
                subject: 'SaaS Retention Secrets: How to Isolate Onboarding Micro-Friction Steps',
                html: `<p>Hey ${lead.name}, while you wait for our production team allocation space, here is our Day 3 engineering playbook framework...</p>`
            });

            await prisma.lead.update({
                where: { id: lead.id },
                data: { nurtureStep: 1, lastEmailSentAt: new Date() }
            });
            console.log(`[Item 6] Day 3 nurture playbook delivered to ${lead.email}`);
        }

    } catch (err) {
        console.error("Automation email worker pipeline encountered an error:", err);
    }
});

// =========================================================================
// ITEM 7: HEALTH SIGNAL CRON INTERACTION MONITOR (Runs once a day)
// =========================================================================
cron.schedule('0 0 * * *', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const droppedLeads = await prisma.lead.findMany({
            where: {
                trackingStatus: 'ACTIVE',
                lastSignalAt: { lt: sevenDaysAgo }
            }
        });

        for (const lead of droppedLeads) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { trackingStatus: 'DEAD_SIGNAL' }
            });

            // Trigger internal immediate emergency email alert notification
            await resend.emails.send({
                from: 'Watchdog Alerts <system@getchurnshield.io>',
                to: 'team@getchurnshield.io',
                subject: `🚨 CRITICAL CHURN ALARM: Tracking script disconnected on ${lead.appUrl}`,
                html: `<p>Account profile matching ${lead.name} (${lead.email}) stopped broadcast streams 7 days ago. UI structure refactor change suspected.</p>`
            });
            console.log(`[Item 7] Script health warning triggered for ${lead.appUrl}`);
        }
    } catch (err) {
        console.error("Health signal checker fault error:", err);
    }
});
// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =========================================================================
// ITEM 4 & 7: TRACKING SNIPPET ENTRY & LIVE DEBUGGER ENDPOINTS
// =========================================================================

// This endpoint is what the 1-line tracking snippet inside the client's app pings
app.post('/api/telemetry/ping', async (req, res) => {
    const { appUrl } = req.body; // Client script sends its window.location.origin
    
    if (!appUrl) return res.status(400).json({ error: "Missing origin parameter." });

    try {
        const cleanedDomain = appUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        // Locate lead matching that app domain filter
        const lead = await prisma.lead.findFirst({
            where: { appUrl: { contains: cleanedDomain } }
        });

        if (!lead) return res.status(404).json({ error: "Domain not registered under any account profile." });

        // Update tracking status maps to ACTIVE state instantly
        await prisma.lead.update({
            where: { id: lead.id },
            data: {
                trackingStatus: 'ACTIVE',
                lastSignalAt: new Date()
            }
        });

        return res.json({ success: true, status: "Signal handshake verified successfully." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Frontend Polling Endpoint: Checks if a customer's registered script is live
app.get('/api/leads/verify-script', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Missing identity profile email." });

    try {
        const lead = await prisma.lead.findUnique({ where: { email: String(email) } });
        if (!lead) return res.status(404).json({ error: "Lead profile layout not found." });

        return res.json({ trackingStatus: lead.trackingStatus });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// ITEMS 2 & 5: CRISP LIVE CHAT & TEAM NOTIFICATION ROUTER
// =========================================================================

// Endpoint called by your frontend when a high-touch user completes onboarding
app.post('/api/support/crisp-alert', async (req, res) => {
    const { email, name, mrr, churnRate, errorTriggered } = req.body;

    const crispIdentifier = process.env.CRISP_API_IDENTIFIER;
    const crispKey = process.env.CRISP_API_KEY;

    // Guard rail if Crisp keys aren't set up in .env yet
    if (crispIdentifier === "your_crisp_identifier" || !crispIdentifier) {
        console.log("Crisp credentials not configured yet. Simulation payload received:", req.body);
        return res.json({ success: true, message: "Simulation success. Configure .env credentials for live pipeline delivery." });
    }

    try {
        // Base64 encode the Crisp keys for basic authorization header profiles
        const authToken = Buffer.from(`${crispIdentifier}:${crispKey}`).toString('base64');
        
        let messageText = "";
        
        if (errorTriggered) {
            // Item 5: Human Intercept Alert Payload
            messageText = `⚠️ HUMAN INTERCEPT REQUESTED: ${name} (${email}) flagged an integration error state. High-touch account require manual takeover assistance. Current MRR: ${mrr}.`;
        } else {
            // Item 2: Premium Team Milestone Notification
            messageText = `🔥 NEW HIGH-TOUCH LEAD ONBOARDED: ${name} (${email}) has completed registration setup. Metrics: MRR ${mrr} | Current Churn: ${churnRate}. Cue custom video scheduling strategy.`;
        }

        // Send a post request to the Crisp Marketplace API messaging routing channel
        const crispResponse = await fetch('https://api.crisp.chat/v1/website/conversations', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json',
                'X-Crisp-Tier': 'plugin'
            },
            body: JSON.stringify({
                text: messageText,
                type: "text",
                from: "operator"
            })
        });

        if (!crispResponse.ok) {
            const errorDetails = await crispResponse.text();
            throw new Error(`Crisp API rejected payload transmission: ${errorDetails}`);
        }

        return res.json({ success: true, message: "Crisp communication handshake delivered successfully." });
    } catch (err) {
        console.error("Crisp integration hook failure:", err);
        return

app.listen(PORT, () => console.log(`🚀 Secure ChurnShield Engine active on port ${PORT}`));