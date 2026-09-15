const { z } = require('zod');

const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Client name is required and must be at least 2 characters'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Valid contact email is required for the client portal login'),
    password: z.string().min(8, 'Portal login password must be at least 8 characters'),
    managerId: z.string().uuid('Valid manager UUID is required')
  })
});

const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client ID')
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email().optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
});

const clientParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client ID')
  })
});

module.exports = {
  createClientSchema,
  updateClientSchema,
  clientParamsSchema
};
