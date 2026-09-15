const { z } = require('zod');

const createCampaignSchema = z.object({
  body: z.object({
    clientId: z.string().uuid(),
    leadListId: z.string().uuid(),
    sequenceId: z.string().uuid(),
    requiresNetNewLeads: z.boolean().optional(),
    name: z.string().min(1),
    type: z.enum(['email', 'call']),
    description: z.string().optional(),
    categoryTag: z.string().optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    dispatchStatus: z.enum(['not_sent', 'sending', 'sent']).optional(),
    segmentationFilters: z.any().optional(),
    excludeClosedLeads: z.boolean().optional(),
    pricingModel: z.enum(['flat_retainer', 'cost_per_lead']).optional(),
    retainerAmount: z.number().optional(),
    ratePerLead: z.number().optional(),
    budgetAlert90Sent: z.boolean().optional(),
    budgetAlert100Sent: z.boolean().optional(),
    requiresManagerApproval: z.boolean().optional(),
    subjectLine: z.string().optional(),
    senderName: z.string().optional(),
    replyToEmail: z.string().email().optional().or(z.literal('')),
    emailBodyHtml: z.string().optional(),
    bannerImageUrl: z.string().url().optional().or(z.literal('')),
    scheduleType: z.string().optional(),
    scheduledAt: z.string().datetime().optional()
  })
});

const updateCampaignSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['email', 'call']).optional(),
    requiresNetNewLeads: z.boolean().optional(),
    description: z.string().optional(),
    categoryTag: z.string().optional(),
    segmentationFilters: z.any().optional(),
    excludeClosedLeads: z.boolean().optional(),
    pricingModel: z.enum(['flat_retainer', 'cost_per_lead']).optional(),
    retainerAmount: z.number().optional(),
    ratePerLead: z.number().optional(),
    requiresManagerApproval: z.boolean().optional(),
    subjectLine: z.string().optional(),
    senderName: z.string().optional(),
    replyToEmail: z.string().email().optional().or(z.literal('')),
    emailBodyHtml: z.string().optional(),
    bannerImageUrl: z.string().url().optional().or(z.literal('')),
    scheduleType: z.string().optional(),
    scheduledAt: z.string().datetime().optional()
  }).refine(data => Object.keys(data).length > 0, { message: "At least one field required for update" })
});

const updateCampaignStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['draft', 'active', 'paused', 'completed'])
  })
});

const campaignParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

module.exports = { createCampaignSchema, updateCampaignSchema, updateCampaignStatusSchema, campaignParamsSchema };
