const validateJsonContentType = require("./validate-json-content-type");
const validatePaginationQuery = require("./validate-pagination-query");
const validateRequest = require("./validate-request");
const authenticate = require("./authenticate");
const authorizeRole = require('./authorize-role');
const { uploadListSchema, listParamsSchema, importStatusParamsSchema } = require("../components/lead-list/lead-list.validation");
const { updateComplianceSchema, clientLeadParamsSchema } = require("../components/client-lead/client-lead.validation");

const { createSequenceSchema, sequenceParamsSchema } = require("../components/sequence/sequence.validation");
const { createCampaignSchema, updateCampaignSchema, updateCampaignStatusSchema, campaignParamsSchema } = require("../components/campaign/campaign.validation");

const { addExecutiveSchema, removeExecutiveSchema, assignLeadsSchema } = require("../components/team-execution/team-execution.validation");

const { queueParamsSchema, skipLeadSchema, createCallRemarkSchema, confirmRemarkSchema } = require("../components/call-queue/call-queue.validation");

const { dispatchEmailSchema, jobStatusSchema, trackOpenSchema, trackClickSchema, trackUnsubscribeSchema } = require("../components/email-operations/email-operations.validation");

const { execPerformanceSchema, clientPortalSchema } = require("../components/dashboard/dashboard.validation");
const { campaignSummarySchema, exportSchema } = require("../components/report/report.validation");
const { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } = require("../components/auth/auth.validation");
const { createClientSchema, updateClientSchema, clientParamsSchema } = require("../components/client/client.validation");
const { createUserSchema, updateUserSchema, userParamsSchema } = require("../components/user/user.validation");

module.exports = {
    validateJsonContentType,
    validatePaginationQuery,
    authenticate,
    
    // Role Authorization
    requireCampaignManager: authorizeRole('campaign_manager'),
    requireClient: authorizeRole('client'),
    requireExecutive: authorizeRole('executive'),
    
    // Auth Validations
    validateAuthLogin: validateRequest(loginSchema),
    validateAuthRegister: validateRequest(registerSchema),
    validateAuthForgotPassword: validateRequest(forgotPasswordSchema),
    validateAuthResetPassword: validateRequest(resetPasswordSchema),
    
    // Client Validations
    validateClientCreate: validateRequest(createClientSchema),
    validateClientUpdate: validateRequest(updateClientSchema),
    validateClientParams: validateRequest(clientParamsSchema),
    
    // User Validations
    validateUserCreate: validateRequest(createUserSchema),
    validateUserUpdate: validateRequest(updateUserSchema),
    validateUserParams: validateRequest(userParamsSchema),
    
    // Lead List Validations
    uploadCsv: require('./upload').single('file'),
    validateLeadListUpload: validateRequest(uploadListSchema),
    validateLeadListParams: validateRequest(listParamsSchema),
    validateImportStatusParams: validateRequest(importStatusParamsSchema),
    
    // Client Lead Validations
    validateComplianceUpdate: validateRequest(updateComplianceSchema),
    validateClientLeadParams: validateRequest(clientLeadParamsSchema),

    // Sequence Validations
    validateSequenceCreate: validateRequest(createSequenceSchema),
    validateSequenceParams: validateRequest(sequenceParamsSchema),

    // Campaign Validations
    validateCampaignCreate: validateRequest(createCampaignSchema),
    validateCampaignUpdate: validateRequest(updateCampaignSchema),
    validateCampaignStatus: validateRequest(updateCampaignStatusSchema),
    validateCampaignParams: validateRequest(campaignParamsSchema),

    // Team Execution Validations
    validateAddExecutive: validateRequest(addExecutiveSchema),
    validateRemoveExecutive: validateRequest(removeExecutiveSchema),
    validateAssignLeads: validateRequest(assignLeadsSchema),

    // Call Queue Validations
    validateQueueParams: validateRequest(queueParamsSchema),
    validateSkipLead: validateRequest(skipLeadSchema),
    validateCreateCallRemark: validateRequest(createCallRemarkSchema),
    validateConfirmRemark: validateRequest(confirmRemarkSchema),

    // Email Operations Validations
    validateDispatchEmail: validateRequest(dispatchEmailSchema),
    validateJobStatus: validateRequest(jobStatusSchema),
    validateTrackOpen: validateRequest(trackOpenSchema),
    validateTrackClick: validateRequest(trackClickSchema),
    validateTrackUnsubscribe: validateRequest(trackUnsubscribeSchema),

    // Dashboard Validations
    validateExecPerformance: validateRequest(execPerformanceSchema),
    validateClientPortal: validateRequest(clientPortalSchema),

    // Report Validations
    validateCampaignSummary: validateRequest(campaignSummarySchema),
    validateExport: validateRequest(exportSchema)
};
