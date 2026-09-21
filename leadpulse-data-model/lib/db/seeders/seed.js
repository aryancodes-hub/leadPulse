require('dotenv').config(); 
const bcrypt = require('bcryptjs');
const { 
  sequelize, Client, User, ClientManager, LeadList, MasterContact, ClientLead, LeadListMembership,
  Sequence, Campaign, CampaignLead, CallRemark, LeadEngagement
} = require('../../../index.js');

async function runUnifiedSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected. Starting Full Unified Seed...");

    await sequelize.sync({ force: true });
    console.log("Database synced and reset.");

    await sequelize.transaction(async (t) => {
      const passwordHash = await bcrypt.hash("Password123!", 12);
      
      console.log("1. Seeding Identity & Workspace...");
      const client = await Client.create({
        name: "Acme Corp", contactPerson: "Wile E. Coyote", contactEmail: "wile@acme.com", isActive: true
      }, { transaction: t });

      const cm = await User.create({
        role: 'campaign_manager', fullName: "Alice Manager", email: "manager@leadpulse.com", passwordHash, isActive: true
      }, { transaction: t });

      await ClientManager.create({ clientId: client.id, userId: cm.id }, { transaction: t });

      const clientUser = await User.create({
        role: 'client', clientId: client.id, managerId: cm.id, fullName: "Wile E. Coyote", email: "client@acme.com", passwordHash, isActive: true
      }, { transaction: t });

      const exec = await User.create({
        role: 'executive', managerId: cm.id, fullName: "Bob Executive", email: "executive@leadpulse.com", passwordHash, isActive: true
      }, { transaction: t });

      console.log("2. Seeding Lead Lists & Contacts...");
      const q3List = await LeadList.create({ clientId: client.id, name: "Q3 Call Targets", importedByUserId: cm.id }, { transaction: t });
      
      const memberships = [];
      for (let i = 1; i <= 9; i++) {
        const master = await MasterContact.create({
          email: `freshlead${i}@example.com`, firstName: `Fresh`, lastName: `Lead${i}`, phone: `555-010${i}`, company: `Acme Inc ${i}`
        }, { transaction: t });

        const clientLead = await ClientLead.create({ clientId: client.id, masterContactId: master.id, source: 'Manual Seed' }, { transaction: t });

        const member = await LeadListMembership.create({ leadListId: q3List.id, clientLeadId: clientLead.id, status: 'Pending' }, { transaction: t });
        memberships.push(member);
      }

      console.log("3. Seeding Sequences & Campaigns...");
      const sequence = await Sequence.create({
        clientId: client.id, leadListId: q3List.id, name: "Enterprise Acquisition Sequence #1", description: "Multi-touch cadence combining cold email drips and executive calls."
      }, { transaction: t });

      const emailCampaign = await Campaign.create({
        clientId: client.id, leadListId: q3List.id, sequenceId: sequence.id, createdByUserId: cm.id, name: "Nurture Cadence #1 - Cold Email", type: "email", status: "active", scheduleType: "Daily Automated Cadence", description: "Targeted outreach focusing on pipeline enhancement."
      }, { transaction: t });

      const callCampaign = await Campaign.create({
        clientId: client.id, leadListId: q3List.id, sequenceId: sequence.id, createdByUserId: cm.id, name: "Executive Follow-up #1 - Direct Dial", type: "call", status: "active", scheduleType: "Mon-Thu 9am-12pm calling block"
      }, { transaction: t });

      console.log("4. Simulating Campaign Activity & Conversions...");
      for (let i = 0; i < memberships.length; i++) {
        const m = memberships[i];

        // Emails
        await CampaignLead.create({ campaignId: emailCampaign.id, clientLeadId: m.clientLeadId, status: 'completed' }, { transaction: t });
        await LeadEngagement.create({ 
          campaignId: emailCampaign.id, 
          clientLeadId: m.clientLeadId, // Fixed field name
          trackingToken: `track_${emailCampaign.id}_${m.clientLeadId}`, // Required field
          openCount: (i % 2 === 0) ? 2 : 0, 
          clickCount: (i % 3 === 0) ? 1 : 0 
        }, { transaction: t });

        // Calls
        await CampaignLead.create({ campaignId: callCampaign.id, clientLeadId: m.clientLeadId, assignedExecutiveId: exec.id, status: 'completed' }, { transaction: t });

        const isConverted = (i === 1 || i === 4); 
        await CallRemark.create({ 
          campaignId: callCampaign.id, 
          clientLeadId: m.clientLeadId, // Fixed field name
          executiveUserId: exec.id, 
          callOutcome: isConverted ? 'Converted' : 'Not_Answered', // Strict DB enum compliance
          callDurationMinutes: isConverted ? 5 : 1 // Fixed field name
        }, { transaction: t });

        if (isConverted) {
            await m.update({ status: 'Converted' }, { transaction: t });
        }
      }

    });
    
    console.log("\n=============================================");
    console.log("✨ FULL UNIFIED SEED SUCCESSFUL ✨");
    console.log("Login Credentials (Password for all: Password123!):");
    console.log("Manager:   manager@leadpulse.com");
    console.log("Executive: executive@leadpulse.com");
    console.log("Client:    client@acme.com");
    console.log("=============================================\n");
    process.exit(0);
  } catch(e) {
    console.error("Seed failed:", e);
    process.exit(1);
  }
}
runUnifiedSeed();