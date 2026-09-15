const { z } = require('zod');

const execPerformanceSchema = z.object({
  query: z.object({ executiveUserId: z.string().uuid().optional() })
});

const clientPortalSchema = z.object({
  query: z.object({ clientId: z.string().uuid().optional() })
});

module.exports = { execPerformanceSchema, clientPortalSchema };
