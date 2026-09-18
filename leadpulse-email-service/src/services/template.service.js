const Handlebars = require("handlebars");
const TRACKING_BASE_URL = process.env.TRACKING_BASE_URL || "http://localhost:4000";
class TemplateService {
    /**
     * Compiles the Handlebars template to validate syntax.
     * Only needs to be run ONCE per campaign job.
     */
    validateTemplate(html) {
        if (!html) {
            throw new Error("Campaign email body is empty");
        }
        // Throws an error if Handlebars syntax is invalid
        Handlebars.compile(html);
    }

   



    prepareSendGridTemplate(html) {
        // // 1. Swap the user's {{tags}} into SendGrid's -tags-
        let parsedHtml = html
        //     .replace(/\{\{first_name\}\}/g, "-first_name-")
        //     .replace(/\{\{last_name\}\}/g, "-last_name-")
        //     .replace(/\{\{company\}\}/g, "-company-")
        //     .replace(/\{\{campaign_name\}\}/g, "-campaign_name-");

        // 2. Automatically inject the MVP tracking buttons at the bottom of the email
        const trackingFooter = `
            <br><br>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 25px 0 15px 0;">
            <div style="text-align: center; font-size: 12px; font-family: Helvetica, Arial, sans-serif;">
                <a href="${TRACKING_BASE_URL}/api/v1/track/convert?token={{tracking_token}}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 15px;">
                   Confirm Conerted
                </a>
                <a href="${TRACKING_BASE_URL}/api/v1/track/unsubscribe?token={{tracking_token}}" 
                   style="display: inline-block; padding: 10px 20px; color: #6b7280; text-decoration: underline;">
                   Unsubscribe
                </a>
            </div>
        `;

        // Glue them together!
        return parsedHtml + trackingFooter;
    }
}

module.exports = new TemplateService();
