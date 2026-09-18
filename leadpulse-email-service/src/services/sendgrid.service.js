const sgMail = require("@sendgrid/mail");

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class SendGridService {
    /**
     * Dispatches an array of fully rendered emails to SendGrid
     */
    async sendBatch(campaign, validRecipients, templateHtml) {
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error("SENDGRID_API_KEY is not configured");
        }

        // Map the batch into an array of completely finished, distinct emails
        const messages = validRecipients.map((recipient) => {
            // Generate the URLs
            const trackingPixelUrl = this.buildTrackingUrl(recipient.trackingToken);
            const unsubscribeUrl = this.buildUnsubscribeUrl(recipient.trackingToken);

            // Extract names safely
            const firstName = recipient.contact.firstName || "";
            const lastName = recipient.contact.lastName || "";
            const company = recipient.contact.company || "";
            const campaignName = campaign.name || "";

            // 1. Node.js Mail Merge: Replace all {{tags}} with the actual lead data
            let personalizedHtml = templateHtml
                .replace(/\{\{first_name\}\}/gi, firstName)
                .replace(/\{\{last_name\}\}/gi, lastName)
                .replace(/\{\{company\}\}/gi, company)
                .replace(/\{\{campaign_name\}\}/gi, campaignName)
                .replace(/\{\{unsubscribe_link\}\}/gi, unsubscribeUrl)
                .replace(/\{\{tracking_pixel_url\}\}/gi, trackingPixelUrl)
                .replace(/\{\{tracking_token\}\}/gi, recipient.trackingToken);

            // 2. Build the individual SendGrid message object
            const message = {
                to: {
                    email: recipient.contact.email,
                    name: [firstName, lastName].filter(Boolean).join(" ")
                },
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL,
                    name: campaign.senderName || "LeadPulse"
                },
                subject: campaign.subjectLine || "Update from LeadPulse",
                html: personalizedHtml,
                
                // This ensures the webhook knows exactly who this is!
                customArgs: {
                    campaign_id: String(campaign.id),
                    client_lead_id: String(recipient.lead.clientLeadId),
                    tracking_token: recipient.trackingToken
                }
            };

            // Add Reply-To if it exists
            if (campaign.replyToEmail) {
                message.replyTo = { email: campaign.replyToEmail };
            }

            return message;
        });

        // 3. SendGrid's SDK allows us to pass an array of messages to send them all at once!
        try {
            await sgMail.send(messages);
        } catch (error) {
            const detail = error.response && error.response.body
                ? JSON.stringify(error.response.body)
                : error.message;
            throw new Error(`SendGrid API Error: ${detail}`);
        }
    }

    buildTrackingUrl(trackingToken) {
        const baseUrl = process.env.TRACKING_BASE_URL || process.env.API_BASE_URL || "http://localhost:3000";
        return `${baseUrl}/api/v1/track/open?token=${trackingToken}`;
    }

    buildUnsubscribeUrl(trackingToken) {
        const baseUrl = process.env.TRACKING_BASE_URL || process.env.API_BASE_URL || "http://localhost:3000";
        return `${baseUrl}/api/v1/track/unsubscribe?token=${trackingToken}`;
    }
}

module.exports = new SendGridService();