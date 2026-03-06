import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
    generateArchitectPlan
} from './services/orchestrator.js';

dotenv.config();

const app = express();
const PORT = 3002;

// Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',') :
    ['https://jservo.com', 'https://www.jservo.com', 'http://localhost:5173'];

app.use(
    cors({
        origin: function(origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1 && !allowedOrigins.includes('*')) {
                var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
    })
);
app.use(express.json());

// Handle Chrome DevTools CSP issues
app.use((req, res, next) => {
    // Add basic CSP
    const connectSrc =
        process.env.NODE_ENV === 'production' ?
        "'self' https://openrouter.ai" :
        "'self' http://localhost:3001 https://openrouter.ai";

    res.setHeader('Content-Security-Policy', `default-src 'self'; connect-src ${connectSrc};`);

    // Suppress DevTools JSON request 404s
    if (req.url.match(/\/.well-known\/appspecific\/com.chrome.devtools.json/)) {
        return res.status(200).json({});
    }

    next();
});

// Main Endpoint
app.post('/api/architect', async (req, res) => {
    try {
        req.setTimeout(120000);
        res.setTimeout(120000, () => {
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'The AI architecture engine took too long to respond. Please try again.',
                });
            }
        });

        const plan = await generateArchitectPlan(req.body);

        return res.status(200).json(plan);
    } catch (error) {
        console.error('Error generating architect plan:', error);
        return res.status(500).json({
            error: 'Failed to generate architect plan. Please try again later.',
        });
    }
});

// Compliance Audit Endpoint
app.post('/api/compliance', async (req, res) => {
    try {
        req.setTimeout(60000);
        res.setTimeout(60000, () => {
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'The compliance audit took too long to respond. Please try again.',
                });
            }
        });
        const {
            generateComplianceAudit
        } = await import('./services/orchestrator.js');
        const audit = await generateComplianceAudit(req.body);
        return res.status(200).json(audit);
    } catch (error) {
        console.error('Error running compliance audit:', error);
        return res.status(500).json({
            error: 'Failed to run compliance audit. Please try again later.',
        });
    }
});

// Developer Prompt Endpoint
app.post('/api/developer-prompt', async (req, res) => {
    try {
        req.setTimeout(60000);
        res.setTimeout(60000, () => {
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'The developer prompt generation took too long to respond. Please try again.',
                });
            }
        });
        const {
            generateDeveloperPrompt
        } = await import('./services/orchestrator.js');
        const promptData = await generateDeveloperPrompt(req.body);
        return res.status(200).json(promptData);
    } catch (error) {
        console.error('Error generating developer prompt:', error);
        return res.status(500).json({
            error: 'Failed to generate developer prompt. Please try again later.',
        });
    }
});

// Start Server (Local only)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`J. Servo Architect Server running on port ${PORT}`);
    });
}

export default app;