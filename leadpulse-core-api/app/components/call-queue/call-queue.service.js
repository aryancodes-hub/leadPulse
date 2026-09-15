const { CampaignLead, CallRemark, ClientLead, LeadListMembership, MasterContact, sequelize } = require('leadpulse-data-model');
const { NotFoundError, BadRequestError } = require('../../lib/error');

class CallQueueService {
  async getNextLead(executiveId, campaignId) {
    const nextLead = await CampaignLead.findOne({
      where: { campaignId, assignedExecutiveId: executiveId, status: 'pending' },
      include: [{ 
        model: ClientLead, as: 'clientLead', 
        include: [{ model: MasterContact, as: 'masterContact' }] 
      }],
      order: [['assignedAt', 'ASC']]
    });

    if (!nextLead) return null;
    
    await nextLead.update({ status: 'in_progress', statusUpdatedAt: new Date() });
    return nextLead;
  }

  async skipLead(executiveId, campaignId, leadId) {
    const lead = await CampaignLead.findOne({
      where: { campaignId, clientLeadId: leadId, assignedExecutiveId: executiveId, status: 'in_progress' }
    });
    if (!lead) throw new NotFoundError("Lead not found or not in progress by this executive");
    
    await lead.update({ status: 'skipped', statusUpdatedAt: new Date() });
    return lead;
  }

  async createCallRemark(executiveId, data) {
    const { campaignId, clientLeadId, callOutcome, leadStatusUpdate } = data;
    
    return await sequelize.transaction(async (t) => {
      const remark = await CallRemark.create({
        ...data,
        executiveUserId: executiveId,
        isManualEntryByManager: false
      }, { transaction: t });

      // Update CampaignLead status based on outcome
      let newQueueStatus = 'called';
      if (callOutcome === 'Converted') newQueueStatus = 'completed';
      if (['Busy', 'Not_Answered'].includes(callOutcome)) newQueueStatus = 'pending'; // Put back in queue? Simple logic for MVP. Let's just set to 'called' for now, they can be re-queued later.
      
      await CampaignLead.update(
        { status: newQueueStatus, statusUpdatedAt: new Date() },
        { where: { campaignId, clientLeadId }, transaction: t }
      );

      // If status update requested, update LeadListMembership status too
      if (leadStatusUpdate) {
        await LeadListMembership.update(
          { status: leadStatusUpdate },
          { where: { clientLeadId }, transaction: t }
        );
      }

      return remark;
    });
  }

  async getCallRemarks(campaignId, pagination) {
    const { limit, offset } = pagination;
    const { count, rows } = await CallRemark.findAndCountAll({
      where: { campaignId },
      limit, offset,
      order: [['createdAt', 'DESC']]
    });
    return { remarks: rows, total: count };
  }

  async confirmConversion(managerId, remarkId, conversionConfirmed) {
    const remark = await CallRemark.findByPk(remarkId);
    if (!remark) throw new NotFoundError("Call remark not found");
    
    await remark.update({
      conversionConfirmed,
      confirmedByUserId: managerId,
      confirmedAt: new Date()
    });
    return remark;
  }
}
module.exports = CallQueueService;
