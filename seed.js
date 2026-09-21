require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, Client, User, ClientManager, LeadList, MasterContact, 
  ClientLead, LeadListMembership, Sequence, Campaign, CampaignExecutive, CampaignLead
} = require('./leadpulse-data-model');

async function runSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    await sequelize.transaction(async (t) => {
      // 0. CLEAR EXISTING DATA
      console.log("Wiping old data to ensure a clean seed...");
      await sequelize.query(
        'TRUNCATE TABLE users, clients, master_contacts, lead_lists, sequences, campaigns CASCADE;', 
        { transaction: t }
      );
      console.log(" ✔ Old data wiped successfully");

      const passwordHash = await bcrypt.hash("Password123!", 12);
      console.log("Seeding New Executive Setup...");

      // 1. Client (TCS)
      const client = await Client.create({
        name: "TCS", contactPerson: "TCS Contact", contactEmail: "contact@tcs.com", isActive: true
      }, { transaction: t });
      console.log(` ✔ Client profile created: TCS`);

      // 1.5 Client Portal User (so TCS can log in)
      await User.create({
        role: 'client', 
        clientId: client.id, // <-- This is the crucial link!
        fullName: "TCS Admin", 
        email: "contact@tcs.com", 
        passwordHash, 
        isActive: true
      }, { transaction: t });
      console.log(` ✔ Client User created: contact@tcs.com`);

      // 2. Campaign Manager
      const cm = await User.create({
        role: 'campaign_manager', fullName: "Super Manager", email: "manager@leadpulse.com", passwordHash, isActive: true
      }, { transaction: t });
      console.log(` ✔ Campaign Manager created: manager@leadpulse.com`);

      await ClientManager.create({ clientId: client.id, userId: cm.id }, { transaction: t });

      // 3. Executives (babel, abby, cain, shane)
      const execBabel = await User.create({ role: 'executive', managerId: cm.id, fullName: "Babel", email: "babel@leadpulse.com", passwordHash, isActive: true }, { transaction: t });
      const execAbby = await User.create({ role: 'executive', managerId: cm.id, fullName: "Abby", email: "abby@leadpulse.com", passwordHash, isActive: true }, { transaction: t });
      const execCain = await User.create({ role: 'executive', managerId: cm.id, fullName: "Cain", email: "cain@leadpulse.com", passwordHash, isActive: true }, { transaction: t });
      const execShane = await User.create({ role: 'executive', managerId: cm.id, fullName: "Shane", email: "shane@leadpulse.com", passwordHash, isActive: true }, { transaction: t });
      console.log(` ✔ 4 Executives created`);

      // 4. Lead List & Leads
      const list = await LeadList.create({
        clientId: client.id, name: "TCS Prospects", importedByUserId: cm.id
      }, { transaction: t });

      const clientLeads = [];
      for (let i = 1; i <= 20; i++) {
        const master = await MasterContact.create({
          email: `tcs.prospect${i}@example.com`, firstName: `Prospect`, lastName: `${i}`,
          phone: `555-01${i.toString().padStart(2, '0')}`, company: `Company ${i}`
        }, { transaction: t });

        const clientLead = await ClientLead.create({
          clientId: client.id, masterContactId: master.id, source: 'Manual Seed'
        }, { transaction: t });
        
        clientLeads.push(clientLead);
        await LeadListMembership.create({ leadListId: list.id, clientLeadId: clientLead.id, status: 'Pending' }, { transaction: t });
      }
      console.log(` ✔ 20 Leads created`);

      // 5. Sequence
      const sequence = await Sequence.create({
        clientId: client.id, name: "TCS Outreach Sequence", description: "Main sequence for TCS", leadListId: list.id
      }, { transaction: t });
      console.log(` ✔ Sequence created`);

      // 6. Campaigns (2 call, 1 email)
      const callCampaign1 = await Campaign.create({
        clientId: client.id, leadListId: list.id, sequenceId: sequence.id, createdByUserId: cm.id,
        name: "Call Campaign Shared (Babel & Cain)", type: "call", status: "active"
      }, { transaction: t });

      const callCampaign2 = await Campaign.create({
        clientId: client.id, leadListId: list.id, sequenceId: sequence.id, createdByUserId: cm.id,
        name: "Call Campaign Solo (Abby)", type: "call", status: "active"
      }, { transaction: t });

      const emailCampaign = await Campaign.create({
        clientId: client.id, leadListId: list.id, sequenceId: sequence.id, createdByUserId: cm.id,
        name: "Email Campaign (Shane)", type: "email", status: "active"
      }, { transaction: t });
      console.log(` ✔ 3 Campaigns created`);

      // Assign executives
      await CampaignExecutive.create({ campaignId: callCampaign1.id, executiveUserId: execBabel.id }, { transaction: t });
      await CampaignExecutive.create({ campaignId: callCampaign1.id, executiveUserId: execCain.id }, { transaction: t });
      await CampaignExecutive.create({ campaignId: callCampaign2.id, executiveUserId: execAbby.id }, { transaction: t });
      await CampaignExecutive.create({ campaignId: emailCampaign.id, executiveUserId: execShane.id }, { transaction: t });

      // Assign Leads to Campaigns
      // Campaign 1 (Shared): Leads 1-10 (Babel gets 1-5, Cain gets 6-10)
      for (let i = 0; i < 5; i++) {
        await CampaignLead.create({ campaignId: callCampaign1.id, clientLeadId: clientLeads[i].id, assignedExecutiveId: execBabel.id, status: 'pending' }, { transaction: t });
      }
      for (let i = 5; i < 10; i++) {
        await CampaignLead.create({ campaignId: callCampaign1.id, clientLeadId: clientLeads[i].id, assignedExecutiveId: execCain.id, status: 'pending' }, { transaction: t });
      }
      // Campaign 2 (Solo): Leads 11-15 (Abby gets all)
      for (let i = 10; i < 15; i++) {
        await CampaignLead.create({ campaignId: callCampaign2.id, clientLeadId: clientLeads[i].id, assignedExecutiveId: execAbby.id, status: 'pending' }, { transaction: t });
      }
      // Campaign 3 (Email): Leads 16-20
      for (let i = 15; i < 20; i++) {
        await CampaignLead.create({ campaignId: emailCampaign.id, clientLeadId: clientLeads[i].id, assignedExecutiveId: execShane.id, status: 'pending' }, { transaction: t });
      }
      console.log(` ✔ Leads distributed among campaigns & executives`);
    });

    console.log("=============================================");
    console.log("✨ SEED SUCCESSFUL ✨");
    console.log("Login Credentials (Password: Password123!):");
    console.log("manager@leadpulse.com (Manager)");
    console.log("contact@tcs.com (Client)");
    console.log("babel@leadpulse.com | cain@leadpulse.com | abby@leadpulse.com | shane@leadpulse.com");
    console.log("=============================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

runSeed();