const { z } = require('zod');

const addExecutiveSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    executiveUserId: z.string().uuid('Executive user ID is required')
  })
});

const removeExecutiveSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    execId: z.string().uuid()
  }),
  query: z.object({
    reassignToUserId: z.string().uuid().optional()
  }).optional()
});

const assignLeadsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    method: z.enum(['round_robin'])
  })
});

module.exports = { addExecutiveSchema, removeExecutiveSchema, assignLeadsSchema };
