const { z } = require('zod');

const campaignSummarySchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

const exportSchema = z.object({
  query: z.object({ campaignId: z.string().uuid().optional() })
});

module.exports = { campaignSummarySchema, exportSchema };
