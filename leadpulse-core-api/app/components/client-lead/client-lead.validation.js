const { z } = require('zod');

const updateComplianceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID')
  }),
  body: z.object({
    isDnc: z.boolean().optional(),
    isUnsubscribed: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field (isDnc or isUnsubscribed) must be provided"
  })
});

const clientLeadParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID')
  })
});

module.exports = {
  updateComplianceSchema,
  clientLeadParamsSchema
};
