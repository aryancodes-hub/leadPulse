require("dotenv").config();
const bcrypt = require("bcryptjs");
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
  CampaignLead
} = require("./leadpulse-data-model");

async function runSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    await sequelize.transaction(async (t) => {
      const passwordHash = await bcrypt.hash("Password123!", 12);
      console.log("Seeding Identity & Workspace Sandbox...");

      // 1. Manager
      const cm = await User.create(
        {
          role: "campaign_manager",
          fullName: "Alice Manager",
          email: "manager@leadpulse.com",
          passwordHash,
          isActive: true
        },
        { transaction: t }
      );
      console.log(`✅ Campaign Manager created: manager@leadpulse.com`);

      // 2. Executives (10)
      const executives = [];
      for (let i = 1; i <= 10; i++) {
        const exec = await User.create(
          {
            role: "executive",
            managerId: cm.id,
            fullName: `Executive 00${i}`,
            email: `exec${i}@leadpulse.com`,
            passwordHash,
            isActive: true
          },
          { transaction: t }
        );
        executives.push(exec);
      }
      console.log(`✅ 10 Executives created.`);

      // 3. Clients (4)
      const clientData = [
        { name: "Acme Corp", email: "client1@acme.com", contact: "Wile E. Coyote" },
        { name: "Stark Industries", email: "client2@stark.com", contact: "Tony Stark" },
        { name: "Wayne Enterprises", email: "client3@wayne.com", contact: "Bruce Wayne" },
        { name: "Initech", email: "client4@initech.com", contact: "Bill Lumbergh" }
      ];

      const clients = [];
      for (const cd of clientData) {
        const client = await Client.create(
          {
            name: cd.name,
            contactPerson: cd.contact,
            contactEmail: cd.email,
            isActive: true
          },
          { transaction: t }
        );
        clients.push(client);

        // Link Manager
        await ClientManager.create({ clientId: client.id, userId: cm.id }, { transaction: t });

        // Client User
        await User.create(
          {
            role: "client",
            clientId: client.id,
            managerId: cm.id,
            fullName: cd.contact,
            email: cd.email,
            passwordHash,
            isActive: true
          },
          { transaction: t }
        );
      }
      console.log(`✅ 4 Clients and their Users created.`);

      // 4. Seeding Lists, Leads, and Sequences
      console.log("\nSeeding Lead Ingestion Sandbox & Sequences...");
      const leadLists = [];
      const sequences = [];

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];

        // Create 2 Lead Lists per client
        for (let j = 1; j <= 2; j++) {
          const listName = `${client.name} - List Q${j}`;
          const list = await LeadList.create(
            {
              clientId: client.id,
              name: listName,
              importedByUserId: cm.id
            },
            { transaction: t }
          );
          leadLists.push(list);

          // Add 15 leads to each list
          for (let k = 1; k <= 15; k++) {
            const master = await MasterContact.create(
              {
                email: `lead${k}.q${j}.${i}@example.com`,
                firstName: `Lead${k}`,
                lastName: `Smith`,
                phone: `555-010${i}${j}${k}`,
                company: `${client.name} Prospect ${k}`
              },
              { transaction: t }
            );

            const clientLead = await ClientLead.create(
              {
                clientId: client.id,
                masterContactId: master.id,
                source: "Seed Data"
              },
              { transaction: t }
            );

            await LeadListMembership.create(
              {
                leadListId: list.id,
                clientLeadId: clientLead.id,
                status: k % 5 === 0 ? "Converted" : "Pending" // Every 5th lead is historically converted
              },
              { transaction: t }
            );
          }
        }

        // 🚀 Grab the first list we just created for this client
        const clientList = leadLists.find((l) => l.clientId === client.id);

                  // Create 2 Sequences per client
          const seq1 = await Sequence.create(
            {
              clientId: client.id,
              leadListId: clientList.id,
              name: `${client.name} - Cold Email Outreach`,
              description: "Standard 3-step cold email sequence"
            },
            { transaction: t }
          );
  
          const seq2 = await Sequence.create(
            {
              clientId: client.id,
              leadListId: clientList.id,
              name: `${client.name} - Sales Call Blitz`,
              description: "Aggressive 2-step call sequence"
            },
            { transaction: t }
          );

        sequences.push(seq1, seq2);
      }
      console.log(`✅ 8 Lead Lists (with 120 leads) and 8 Sequences created.`);

      // 5. Campaigns (8)
      console.log("\nSeeding Campaigns...");

      const campaignStatuses = [
        "active",
        "draft",
        "active",
        "completed",
        "active",
        "paused",
        "active",
        "draft"
      ];

      for (let i = 0; i < 8; i++) {
        const client = clients[i % 4];
        const list = leadLists.find((l) => l.clientId === client.id);
        const seqType = i % 2 === 0 ? "email" : "call";
         const sequence = sequences.find(
          (s) => s.clientId === client.id && s.name.includes(seqType === "email" ? "Email" : "Call")
        );
        const status = campaignStatuses[i];

        const campaign = await Campaign.create(
          {
            clientId: client.id,
            leadListId: list.id,
            sequenceId: sequence.id,
            name: `${client.name} - ${seqType.toUpperCase()} Campaign ${i + 1}`,
            type: seqType,
            status: status,
            createdByUserId: cm.id,
            approvedByUserId: status !== "draft" ? cm.id : null,
            approvedAt: status !== "draft" ? new Date() : null,
            excludeClosedLeads: true,
            requiresNetNewLeads: false
          },
          { transaction: t }
        );

        // If campaign is call and active/paused, assign executives and simulate the queue copy!
        if (seqType === "call" && (status === "active" || status === "paused")) {
          // Assign 2 executives round-robin
          const exec1 = executives[i % 10];
          const exec2 = executives[(i + 1) % 10];

          await CampaignExecutive.create(
            { campaignId: campaign.id, executiveUserId: exec1.id, isActive: true },
            { transaction: t }
          );
          await CampaignExecutive.create(
            { campaignId: campaign.id, executiveUserId: exec2.id, isActive: true },
            { transaction: t }
          );

          // Copy leads from LeadList to CampaignLead
          const members = await LeadListMembership.findAll({
            where: { leadListId: list.id, status: "Pending" },
            transaction: t
          });

          const campaignLeads = members.map((m, index) => ({
            campaignId: campaign.id,
            clientLeadId: m.clientLeadId,
            status: "pending",
            assignedExecutiveId: index % 2 === 0 ? exec1.id : exec2.id // Round robin assignment
          }));
          await CampaignLead.bulkCreate(campaignLeads, { transaction: t });
        }
      }
      console.log(`✅ 8 Campaigns seeded with realistic statuses and executive queues!`);
    });

    console.log("\n=============================================");
    console.log("🌟 SEED SUCCESSFUL 🌟");
    console.log("Login Credentials (Password for all: Password123!):");
    console.log("Manager:    manager@leadpulse.com");
    console.log("Executives: exec1@leadpulse.com up to exec10@leadpulse.com");
    console.log("Clients:    client1@acme.com, client2@stark.com, etc.");
    console.log("=============================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

runSeed();
