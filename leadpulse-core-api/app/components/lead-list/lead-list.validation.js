const { z } = require('zod');

// For multipart/form-data, all fields come in as strings.
const uploadListSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'List name is required'),
    clientId: z.string().uuid('Valid client ID is required')
  })
});

const listParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid list ID')
  })
});

const importStatusParamsSchema = z.object({
  params: z.object({
    jobId: z.string().uuid('Invalid job ID')
  })
});

module.exports = {
  uploadListSchema,
  listParamsSchema,
  importStatusParamsSchema
};
