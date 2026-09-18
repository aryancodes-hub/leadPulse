const express = require("express");
const trackingService = require("../services/tracking.service");
const { summaryLogger, failureLogger } = require("../utils/logger");

const router = express.Router();

// The HTML template we will show the user so their browser doesn't stay blank
const generateHtmlResponse = (title, message) => `
    <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background-color: #f9fafb; color: #111827; }
                .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
                h2 { margin-top: 0; color: #2563eb; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>${title}</h2>
                <p>${message}</p>
            </div>
        </body>
    </html>
`;

router.get("/unsubscribe", async (req, res) => {
    try {
        const token = req.query.token;
        if (token) {
            await trackingService.trackUnsubscribe(token);
            summaryLogger.info("Link clicked: Unsubscribe", { trackingToken: token });
        }
        
        // Return a polite visual page
        const html = generateHtmlResponse("Unsubscribed", "You have been successfully removed from this mailing list. You can safely close this window.");
        res.status(200).send(html);
    } catch (error) {
        failureLogger.error("Unsubscribe tracking error", { error: error.message });
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

router.get("/convert", async (req, res) => {
    try {
        const token = req.query.token;
        if (token) {
            await trackingService.trackConversion(token);
            summaryLogger.info("Link clicked: Conversion", { trackingToken: token });
        }
        
        // Return a polite visual page
        const html = generateHtmlResponse("Success!", "Thank you for confirming. Your status has been updated. You can safely close this window.");
        res.status(200).send(html);
    } catch (error) {
        failureLogger.error("Conversion tracking error", { error: error.message });
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

module.exports = router;