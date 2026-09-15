const { z } = require('zod');

const dispatchEmailSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

const jobStatusSchema = z.object({
  params: z.object({ jobId: z.string().uuid() })
});

const trackOpenSchema = z.object({
  query: z.object({ token: z.string().min(1) })
});

const trackClickSchema = z.object({
  query: z.object({ 
    token: z.string().min(1),
    url: z.string().url()
  })
});

const trackUnsubscribeSchema = z.object({
  query: z.object({ token: z.string().min(1) })
});

module.exports = { 
  dispatchEmailSchema, 
  jobStatusSchema, 
  trackOpenSchema, 
  trackClickSchema, 
  trackUnsubscribeSchema 
};
