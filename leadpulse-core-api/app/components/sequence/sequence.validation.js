const { z } = require('zod');

const createSequenceSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Valid client ID is required'),
    leadListId: z.string().uuid('Valid lead list ID is required'),
    name: z.string().min(1, 'Sequence name is required'),
    description: z.string().optional()
  })
});

const sequenceParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid sequence ID')
  })
});

module.exports = { createSequenceSchema, sequenceParamsSchema };
