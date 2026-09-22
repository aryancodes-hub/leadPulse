const { z } = require('zod');

const queueParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

const skipLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    leadId: z.string().uuid()
  })
});

const createCallRemarkSchema = z.object({
  body: z.object({
    campaignId: z.string().uuid(),
    clientLeadId: z.string().uuid(),
    callOutcome: z.enum(["Answered", "Not Answered", "Busy", "Wrong Number", "Left Voicemail", "Callback Requested", "Not Interested", "Converted"]),
    callDurationMinutes: z.number().int().optional(),
    notes: z.string().max(1000).optional(),
    followUpDate: z.string().datetime().optional(),
    leadStatusUpdate: z.enum(["New", "Contacted", "Qualified", "Converted", "Dead"]).optional()
  })
});

const confirmRemarkSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    conversionConfirmed: z.boolean()
  })
});

module.exports = { queueParamsSchema, skipLeadSchema, createCallRemarkSchema, confirmRemarkSchema };
