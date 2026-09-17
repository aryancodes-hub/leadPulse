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
  LeadListMembership 
} = require('./leadpulse-data-model');

async function runSeed() {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    await sequelize.transaction(async (t) => {
      const passwordHash = await bcrypt.hash("Password123!", 12);
      console.log("Seeding Identity & Workspace Sandbox...");

      // 1. Client
      const client = await Client.create({
        name: "Acme Corp",
        contactPerson: "Wile E. Coyote",
        contactEmail: "wile@acme.com",
        isActive: true
      }, { transaction: t });
      console.log(` âœ” Client created: Acme Corp`);

      // 2. Campaign Manager
      const cm = await User.create({
        role: 'campaign_manager',
        fullName: "Alice Manager",
        email: "manager@leadpulse.com",
        passwordHash,
        isActive: true
      }, { transaction: t });
      console.log(` âœ” Campaign Manager created: manager@leadpulse.com`);

      // 3. ClientManager Link
      await ClientManager.create({
        clientId: client.id,
        userId: cm.id
      }, { transaction: t });

      // 4. Client User
      await User.create({
        role: 'client',
        clientId: client.id,
        managerId: cm.id,
        fullName: "Wile E. Coyote",
        email: "client@acme.com",
        passwordHash,
        isActive: true
      }, { transaction: t });
      console.log(` âœ” Client User created: client@acme.com`);

      // 5. Executive
      await User.create({
        role: 'executive',
        managerId: cm.id,
        fullName: "Bob Executive",
        email: "executive@leadpulse.com",
        passwordHash,
        isActive: true
      }, { transaction: t });
      console.log(` âœ” Executive User created: executive@leadpulse.com`);

      console.log("\nSeeding Lead Ingestion Sandbox...");
      // 6. Lead List (Q3 Call Targets)
      const q3List = await LeadList.create({
        clientId: client.id,
        name: "Q3 Call Targets",
        importedByUserId: cm.id
      }, { transaction: t });
      console.log(` âœ” Lead List created: Q3 Call Targets`);

      // 7. 9 Fresh Leads
      for (let i = 1; i <= 9; i++) {
        const master = await MasterContact.create({
          email: `freshlead${i}@example.com`,
          firstName: `Fresh`,
          lastName: `Lead${i}`,
          phone: `555-010${i}`,
          company: `Acme Inc ${i}`
        }, { transaction: t });

        const clientLead = await ClientLead.create({
          clientId: client.id,
          masterContactId: master.id,
          source: 'Manual Seed'
        }, { transaction: t });

        await LeadListMembership.create({
          leadListId: q3List.id,
          clientLeadId: clientLead.id,
          status: 'Pending'
        }, { transaction: t });
      }
      console.log(` âœ” 9 Fresh Leads created and added to Q3 List`);

      console.log("\nSeeding Historical Data (Global Filter Trap)...");
      // 8. Historical List (Q1)
      const q1List = await LeadList.create({
        clientId: client.id,
        name: "Old Q1 List",
        importedByUserId: cm.id
      }, { transaction: t });
      console.log(` âœ” Lead List created: Old Q1 List`);

      // 9. The 10th Lead (Converted)
      const master10 = await MasterContact.create({
        email: "connie.verted@example.com",
        firstName: "Connie",
        lastName: "Verted",
        phone: "555-0200",
        company: "Converted Corp"
      }, { transaction: t });

      const clientLead10 = await ClientLead.create({
        clientId: client.id,
        masterContactId: master10.id,
        source: 'Manual Seed'
      }, { transaction: t });

      // Converted in Q1
      await LeadListMembership.create({
        leadListId: q1List.id,
        clientLeadId: clientLead10.id,
        status: 'Converted'
      }, { transaction: t });

      // Pending in Q3 (The Trap)
      await LeadListMembership.create({
        leadListId: q3List.id,
        clientLeadId: clientLead10.id,
        status: 'Pending'
      }, { transaction: t });
      console.log(` âœ” 1 Historical Lead created: Converted in Q1, Pending in Q3`);
      
    });

    console.log("\n=============================================");
    console.log("âœ¨ SEED SUCCESSFUL âœ¨");
    console.log("Login Credentials (Password for all: Password123!):");
    console.log("Manager:   manager@leadpulse.com");
    console.log("Executive: executive@leadpulse.com");
    console.log("Client:    client@acme.com");
    console.log("=============================================\n");
    
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

runSeed();
