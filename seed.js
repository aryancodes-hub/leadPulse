require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, 
  Client, 
  User, 
  ClientManager, 
  LeadList, 
  MasterContact, 
  ClientLead, 
  LeadListMembership,
  Sequence,
  Campaign,
  CampaignExecutive,
  CampaignLead,
  LeadEngagement,
  CallRemark,
  ImportJob,
  EmailProcessingJob,
  RawWebhook
} = require('./leadpulse-data-model');

// Helper to generate dates over the last 30 days
const getRandomDate = (daysAgoStart, daysAgoEnd) => {
  const date = new Date();
  const diff = daysAgoStart - daysAgoEnd;
  const daysAgo = daysAgoEnd + Math.random() * diff;
  date.setDate(date.getDate() - daysAgo);
  return date;
};

async function runSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected. Starting massive holistic seed...");
    
    await sequelize.transaction(async (t) => {
      const passwordHash = await bcrypt.hash("Password123!", 12);
      
      // ==========================================
      // 1. IDENTITY & WORKSPACE
      // ==========================================
      console.log("1. Seeding Identity (Manager, 10 Executives, 4 Clients)...");
      
      const cm = await User.create({
        role: 'campaign_manager',
        fullName: "Alice Manager",
        email: "manager@leadpulse.com",
        passwordHash,
        isActive: true
      }, { transaction: t });

      const executives = [];
      for (let i = 1; i <= 10; i++) {
        const exec = await User.create({
          role: 'executive',
          managerId: cm.id,
          fullName: `Executive 00${i}`,
          email: `exec${i}@leadpulse.com`,
          passwordHash,
          isActive: true
        }, { transaction: t });
        executives.push(exec);
      }

      const clientData = [
        { name: "TechCorp", email: "client1@techcorp.com", contact: "John Tech" },
        { name: "HealthPlus", email: "client2@healthplus.com", contact: "Sarah Health" },
        { name: "FinancePro", email: "client3@financepro.com", contact: "Mike Finance" },
        { name: "EduTech", email: "client4@edutech.com", contact: "Emma Edu" }
      ];

      const clients = [];
      for (const cd of clientData) {
        const client = await Client.create({
          name: cd.name,
          contactPerson: cd.contact,
          contactEmail: cd.email,
          isActive: true
        }, { transaction: t });
        clients.push(client);

        await ClientManager.create({ clientId: client.id, userId: cm.id }, { transaction: t });

        await User.create({
          role: 'client',
          clientId: client.id,
          managerId: cm.id,
          fullName: cd.contact,
          email: cd.email,
          passwordHash,
          isActive: true
        }, { transaction: t });
      }

      // ==========================================
      // 2. IMPORT JOBS, LEAD LISTS & SEQUENCES
      // ==========================================
      console.log("2. Seeding Import Jobs, Lead Lists, Contacts, and Sequences...");
      const leadLists = [];
      const sequences = [];

      let leadCounter = 1;
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        
        for (let j = 1; j <= 2; j++) {
          const listName = `${client.name} - Q${j} Prospect List`;
          
          const list = await LeadList.create({
            clientId: client.id,
            name: listName,
            importedByUserId: cm.id,
            createdAt: getRandomDate(30, 25)
          }, { transaction: t });
          leadLists.push(list);

          // Import Job simulating background worker
          await ImportJob.create({
            clientId: client.id,
            leadListId: list.id,
            uploadedByUserId: cm.id,
            s3SourceFileKey: `imports/${client.id}/file${j}.csv`,
            status: "Completed",
            totalRows: 15,
            processedRows: 15,
            successfulRows: 15,
            failedRows: 0,
            progressPercentage: 100,
            createdAt: list.createdAt
          }, { transaction: t });

          for (let k = 1; k <= 15; k++) {
            const master = await MasterContact.create({
              email: `contact${leadCounter}@company${leadCounter}.com`,
              firstName: `Lead${leadCounter}`,
              lastName: `Smith`,
              phone: `555-01${leadCounter.toString().padStart(3, '0')}`,
              company: `Company ${leadCounter}`
            }, { transaction: t });

            const clientLead = await ClientLead.create({
              clientId: client.id,
              masterContactId: master.id,
              source: 'CSV Import'
            }, { transaction: t });

            // 50% Converted globally (High conversion setup)
            const isConverted = Math.random() > 0.5;
            
            await LeadListMembership.create({
              leadListId: list.id,
              clientLeadId: clientLead.id,
              status: isConverted ? 'Converted' : 'Pending'
            }, { transaction: t });
            
            leadCounter++;
          }
        }

        // Sequences
        const seq1 = await Sequence.create({
          clientId: client.id,
          leadListId: leadLists[leadLists.length - 2].id, // bind to first list
          name: `${client.name} - Cold Email Outreach`,
          description: "High conversion email sequence"
        }, { transaction: t });
        
        const seq2 = await Sequence.create({
          clientId: client.id,
          leadListId: leadLists[leadLists.length - 1].id, // bind to second list
          name: `${client.name} - Sales Call Blitz`,
          description: "Aggressive 2-step call sequence"
        }, { transaction: t });

        sequences.push(seq1, seq2);
      }

      // ==========================================
      // 3. CAMPAIGNS, EXEC ASSIGNMENTS, AND QUEUES
      // ==========================================
      console.log("3. Seeding Campaigns, Exec Assignments, and Lead Queues...");
      const campaignStatuses = ['completed', 'active', 'paused', 'draft', 'active', 'completed', 'draft', 'active'];
      const campaigns = [];

      for (let i = 0; i < 8; i++) {
        const client = clients[i % 4];
        const seqType = i % 2 === 0 ? 'email' : 'call';
        const sequence = sequences.find((s) => s.clientId === client.id && s.name.includes(seqType === "email" ? "Email" : "Call"));
        const list = leadLists.find((l) => l.id === sequence.leadListId);
        const status = campaignStatuses[i];
        
        const createdAt = status === 'completed' ? getRandomDate(25, 20) : getRandomDate(10, 2);

        const campaign = await Campaign.create({
          clientId: client.id,
          leadListId: list.id,
          sequenceId: sequence.id,
          name: `${client.name} - ${seqType.toUpperCase()} Campaign ${i+1}`,
          type: seqType,
          status: status,
          createdByUserId: cm.id,
          approvedByUserId: (status !== 'draft') ? cm.id : null,
          approvedAt: (status !== 'draft') ? createdAt : null,
          excludeClosedLeads: true,
          requiresNetNewLeads: false,
          createdAt
        }, { transaction: t });
        campaigns.push(campaign);

        // Fetch valid leads for this campaign queue
        const members = await LeadListMembership.findAll({ where: { leadListId: list.id, status: 'Pending' }, transaction: t });

        if (seqType === 'call' && status !== 'draft') {
          const exec1 = executives[i % 10];
          const exec2 = executives[(i+1) % 10];
          
          await CampaignExecutive.create({ campaignId: campaign.id, executiveUserId: exec1.id, isActive: status !== 'completed' }, { transaction: t });
          await CampaignExecutive.create({ campaignId: campaign.id, executiveUserId: exec2.id, isActive: status !== 'completed' }, { transaction: t });

          const campaignLeads = members.map((m, index) => ({
            campaignId: campaign.id,
            clientLeadId: m.clientLeadId,
            status: status === 'completed' ? 'in_progress' : 'pending',
            assignedExecutiveId: index % 2 === 0 ? exec1.id : exec2.id
          }));
          await CampaignLead.bulkCreate(campaignLeads, { transaction: t });
        }
        else if (seqType === 'email' && status !== 'draft') {
          const campaignLeads = members.map(m => ({
            campaignId: campaign.id,
            clientLeadId: m.clientLeadId,
            status: 'pending',
            assignedExecutiveId: null
          }));
          await CampaignLead.bulkCreate(campaignLeads, { transaction: t });
        }
      }

      // ==========================================
      // 4. HISTORICAL METRICS: ENGAGEMENTS, REMARKS & WEBHOOKS
      // ==========================================
      console.log("4. Seeding Engagements, Call Remarks, Email Jobs & Webhooks...");
      
      for (const campaign of campaigns) {
        if (campaign.status === 'draft') continue;
        
        const campLeads = await CampaignLead.findAll({ where: { campaignId: campaign.id }, transaction: t });
        
        if (campaign.type === 'email') {
          // Simulate Background Job Completion
          await EmailProcessingJob.create({
            campaignId: campaign.id,
            status: campaign.status === 'completed' ? 'Completed' : 'Processing',
            totalEmails: campLeads.length,
            processedEmails: campLeads.length,
            successfulSends: campLeads.length,
            failedSends: 0,
            createdAt: campaign.approvedAt
          }, { transaction: t });

          // Simulate Engagements (80% open, 50% convert setup)
          for (const cl of campLeads) {
            const sentDate = new Date(campaign.approvedAt.getTime() + 60000); 
            
            const isOpen = Math.random() < 0.8;
            const isClick = isOpen && Math.random() < 0.7;
            const isConverted = isClick && Math.random() < 0.6;

            let engStatus = 'sent';
            let openDate = null, clickDate = null, convertDate = null;
            
            if (isOpen) {
              engStatus = 'delivered';
              openDate = new Date(sentDate.getTime() + 3600000); // +1 hour
            }
            if (isClick) clickDate = new Date(openDate.getTime() + 1800000); // +30 mins
            if (isConverted) convertDate = new Date(clickDate.getTime() + 86400000); // +1 day

            const token = `tk_${campaign.id.substring(0,8)}_${cl.clientLeadId.substring(0,8)}`;
            
            await LeadEngagement.create({
              campaignId: campaign.id,
              clientLeadId: cl.clientLeadId,
              trackingToken: token,
              status: engStatus,
              sentAt: sentDate,
              deliveredAt: isOpen ? sentDate : null,
              openedAt: openDate,
              clickedAt: clickDate,
              convertedAt: convertDate,
              openCount: isOpen ? Math.floor(Math.random() * 3) + 1 : 0,
              clickCount: isClick ? 1 : 0
            }, { transaction: t });

            await RawWebhook.create({
              provider: 'sendgrid',
              status: 'processed',
              payload: {
                event: isOpen ? 'open' : 'delivered',
                email: `fake_${cl.clientLeadId.substring(0,8)}@test.com`,
                timestamp: Math.floor(Date.now() / 1000),
                token: token
              }
            }, { transaction: t });
          }
        } else {
          // Simulate Call Remarks
          for (const cl of campLeads) {
            const isAnswered = Math.random() < 0.9;
            let outcome = 'Left_Voicemail';
            let duration = 0;
            let leadStatus = 'New';
            let conversionConfirmed = null;
            let confirmedBy = null;

            if (isAnswered) {
              duration = Math.floor(Math.random() * 15) + 2; // 2-16 mins
              const rand = Math.random();
              if (rand < 0.6) {
                outcome = 'Converted';
                leadStatus = 'Converted';
                conversionConfirmed = true;
                confirmedBy = cm.id;
              } else if (rand < 0.8) {
                outcome = 'Callback_Requested';
                leadStatus = 'Qualified';
              } else {
                outcome = 'Not_Interested';
                leadStatus = 'Dead';
              }
            }

            await CallRemark.create({
              campaignId: campaign.id,
              clientLeadId: cl.clientLeadId,
              executiveUserId: cl.assignedExecutiveId,
              callOutcome: outcome,
              callDurationMinutes: duration,
              notes: `Simulated remark: ${outcome.replace('_', ' ')}`,
              followUpDate: outcome === 'Callback_Requested' ? new Date(Date.now() + 86400000 * 3) : null,
              leadStatusUpdate: leadStatus,
              isManualEntryByManager: false,
              conversionConfirmed: conversionConfirmed,
              confirmedByUserId: confirmedBy,
              confirmedAt: conversionConfirmed ? new Date() : null,
              createdAt: new Date(campaign.approvedAt.getTime() + 86400000)
            }, { transaction: t });

            if (conversionConfirmed) {
              await LeadListMembership.update(
                { status: 'Converted' },
                { where: { clientLeadId: cl.clientLeadId }, transaction: t }
              );
              await cl.update({ status: 'completed' }, { transaction: t });
            }
          }
        }
      }

    });

    console.log("\n=============================================");
    console.log("🌟 MASSIVE HOLISTIC SEED SUCCESSFUL 🌟");
    console.log("ALL 16 tables populated with realistic 30-day historical data!");
    console.log("Login Credentials (Password for all: Password123!):");
    console.log("Manager:    manager@leadpulse.com");
    console.log("Executives: exec1@leadpulse.com to exec10@leadpulse.com");
    console.log("Clients:    client1@techcorp.com, etc.");
    console.log("=============================================\n");
    
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

runSeed();
