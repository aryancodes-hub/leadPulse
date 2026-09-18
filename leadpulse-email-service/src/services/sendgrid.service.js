const sgMail = require("@sendgrid/mail");
const { failureLogger } = require("../utils/logger");

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class SendGridService {
    /**
     * Dispatches a single HTTP request to SendGrid for up to 1000 personalizations (recipients).
     */
    async sendBatch(campaign, validRecipients, htmlContent) {
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error("SENDGRID_API_KEY is not configured");
        }

        const personalizations = validRecipients.map((recipient) => {
            const trackingPixelUrl = this.buildTrackingUrl(recipient.trackingToken);
            const unsubscribeUrl = this.buildUnsubscribeUrl(recipient.trackingToken);

            return {
                to: [
                    {
                        email: recipient.contact.email,
                        name: [recipient.contact.firstName, recipient.contact.lastName].filter(Boolean).join(" ")
                    }
                ],
                substitutions: {
                    "-first_name-": recipient.contact.firstName || "",
                    "-last_name-": recipient.contact.lastName || "",
                    "-company-": recipient.contact.company || "",
                    "-campaign_name-": campaign.name || "",
                    "-unsubscribe_link-": unsubscribeUrl,
                    "-tracking_pixel_url-": trackingPixelUrl
                },
                custom_args: {
                    campaign_id: String(campaign.id),
                    client_lead_id: String(recipient.lead.clientLeadId),
                    tracking_token: recipient.trackingToken
                }
            };
        });

        const message = {
            personalizations,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: campaign.senderName || "LeadPulse"
            },
            subject: campaign.subjectLine || "Update from LeadPulse",
            content: [
                {
                    type: "text/html",
                    value: htmlContent
                }
            ]
        };

        if (campaign.replyToEmail) {
            message.replyTo = { email: campaign.replyToEmail };
        }

        try {
            await sgMail.send(message);
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
