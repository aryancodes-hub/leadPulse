const Handlebars = require("handlebars");

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

    /**
     * Converts LeadPulse's {{variable}} syntax to SendGrid's -variable- syntax.
     */
    prepareSendGridTemplate(html) {
        let template = html || "";

        template = template.replace(/\{\{\s*first_name\s*\}\}/g, "-first_name-");
        template = template.replace(/\{\{\s*last_name\s*\}\}/g, "-last_name-");
        template = template.replace(/\{\{\s*company\s*\}\}/g, "-company-");
        template = template.replace(/\{\{\s*campaign_name\s*\}\}/g, "-campaign_name-");
        template = template.replace(/\{\{\s*unsubscribe_link\s*\}\}/g, "-unsubscribe_link-");

        // Inject tracking pixel variable
        const trackingPixel = '<img src="{{tracking_pixel_url}}" width="1" height="1" alt="" />';
        return template + trackingPixel;
    }
}

module.exports = new TemplateService();
