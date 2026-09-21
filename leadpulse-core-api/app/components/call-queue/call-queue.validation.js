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
    callOutcome: z.enum(["Answered", "Not_Answered", "Busy", "Wrong_Number", "Left_Voicemail", "Callback_Requested", "Not_Interested", "Converted"]),
    callDurationMinutes: z.number().int().optional(),
    notes: z.string().max(1000).optional(),
    followUpDate: z.string().datetime().optional(),
    // Reverted back to match the CallRemark DB table perfectly:
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