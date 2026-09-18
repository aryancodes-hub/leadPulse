const { sequelize, LeadEngagement, ClientLead, LeadListMembership, Campaign } = require("leadpulse-data-model");

class TrackingService {
    async trackUnsubscribe(token) {
        const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
        if (!engagement) return false;

        await sequelize.transaction(async (t) => {
            // 1. Log the click
            await engagement.increment("clickCount", { by: 1, transaction: t });
            if (!engagement.clickedAt) await engagement.update({ clickedAt: new Date() }, { transaction: t });

            // 2. Mark as unsubscribed
            if (!engagement.unsubscribedAt) await engagement.update({ unsubscribedAt: new Date() }, { transaction: t });
            await ClientLead.update({ isUnsubscribed: true }, { where: { id: engagement.clientLeadId }, transaction: t });
        });

        return true;
    }

    async trackConversion(token) {
        const engagement = await LeadEngagement.findOne({
            where: { trackingToken: token },
            include: [{ model: Campaign, as: "campaign" }] // Need this to find the leadListId
        });
        
        if (!engagement) return false;

        await sequelize.transaction(async (t) => {
            // 1. Log the click
            await engagement.increment("clickCount", { by: 1, transaction: t });
            if (!engagement.clickedAt) await engagement.update({ clickedAt: new Date() }, { transaction: t });

            // 2. Mark as converted
            if (!engagement.convertedAt) await engagement.update({ convertedAt: new Date() }, { transaction: t });
            
            // 3. Update the list membership
            if (engagement.campaign && engagement.campaign.leadListId) {
                await LeadListMembership.update(
                    { status: "Converted" },
                    { 
                        where: { clientLeadId: engagement.clientLeadId, leadListId: engagement.campaign.leadListId }, 
                        transaction: t 
                    }
                );
            }
        });

        return true;
    }
}

module.exports = new TrackingService();