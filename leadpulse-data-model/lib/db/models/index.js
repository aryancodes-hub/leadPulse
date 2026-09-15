const User = require("./user");
const Client = require("./client");
const ClientManager = require("./clientManager");
const Sequence = require("./sequence");
const MasterContact = require("./masterContact");
const ClientLead = require("./clientLead");
const LeadList = require("./leadList");
const LeadListMembership = require("./leadListMembership");
const Campaign = require("./campaign");
const CampaignExecutive = require("./campaignExecutive");
const CampaignLead = require("./campaignLead");
const LeadEngagement = require("./leadEngagement");
const CallRemark = require("./callRemark");
const ImportJob = require("./importJob");
const EmailProcessingJob = require("./emailProcessingJob");

function initModels(sequelize) {
  const models = {
    User: User.initModel(sequelize),
    Client: Client.initModel(sequelize),
    ClientManager: ClientManager.initModel(sequelize),
    Sequence: Sequence.initModel(sequelize),
    MasterContact: MasterContact.initModel(sequelize),
    ClientLead: ClientLead.initModel(sequelize),
    LeadList: LeadList.initModel(sequelize),
    LeadListMembership: LeadListMembership.initModel(sequelize),
    Campaign: Campaign.initModel(sequelize),
    CampaignExecutive: CampaignExecutive.initModel(sequelize),
    CampaignLead: CampaignLead.initModel(sequelize),
    LeadEngagement: LeadEngagement.initModel(sequelize),
    CallRemark: CallRemark.initModel(sequelize),
    ImportJob: ImportJob.initModel(sequelize),
    EmailProcessingJob: EmailProcessingJob.initModel(sequelize)
  };

  Object.keys(models).forEach((modelName) => {
    if (typeof models[modelName].associate === "function") {
      models[modelName].associate(models);
    }
  });

  return models;
}

module.exports = {
  initModels,
  User,
  Client,
  ClientManager,
  Sequence,
  MasterContact,
  ClientLead,
  LeadList,
  LeadListMembership,
  Campaign,
  CampaignExecutive,
  CampaignLead,
  LeadEngagement,
  CallRemark,
  ImportJob,
  EmailProcessingJob
};
