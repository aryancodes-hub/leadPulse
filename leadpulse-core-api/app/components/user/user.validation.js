const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['executive', 'client']).optional().default('executive'),
    clientId: z.string().uuid('Invalid client ID').optional()
  }).refine(data => {
    // If they want to create a client, they MUST provide the business ID
    if (data.role === 'client' && !data.clientId) return false;
    return true;
  }, {
    message: "clientId is required when creating a client user",
    path: ["clientId"]
  })
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
});

const userParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userParamsSchema
};
