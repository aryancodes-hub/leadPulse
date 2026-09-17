"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. clients
    await queryInterface.createTable("clients", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      contact_person: { type: Sequelize.STRING, allowNull: true },
      contact_email: { type: Sequelize.STRING, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. users
    await queryInterface.createTable("users", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      role: { type: Sequelize.ENUM("campaign_manager", "executive", "client"), allowNull: false },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      full_name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      refresh_token_hash: { type: Sequelize.STRING, allowNull: true },
      refresh_token_expires_at: { type: Sequelize.DATE, allowNull: true },
      reset_token_hash: { type: Sequelize.STRING, allowNull: true },
      reset_token_expires_at: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. client_managers (Junction table enforcing 1 Manager per Client)
    await queryInterface.createTable("client_managers", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. master_contacts
    await queryInterface.createTable("master_contacts", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      first_name: { type: Sequelize.STRING, allowNull: true },
      last_name: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      company: { type: Sequelize.STRING, allowNull: true },
      job_title: { type: Sequelize.STRING, allowNull: true },
      industry: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. lead_lists
    await queryInterface.createTable("lead_lists", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: { type: Sequelize.STRING, allowNull: false },
      imported_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 6. import_jobs
    await queryInterface.createTable("import_jobs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      lead_list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "lead_lists", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      uploaded_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      s3_source_file_key: { type: Sequelize.STRING, allowNull: false },
      s3_error_file_key: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM(
          "Uploaded",
          "Queued",
          "Processing",
          "Completed",
          "Completed_with_Errors",
          "Failed"
        ),
        defaultValue: "Uploaded"
      },
      total_rows: { type: Sequelize.INTEGER, defaultValue: 0 },
      processed_rows: { type: Sequelize.INTEGER, defaultValue: 0 },
      successful_rows: { type: Sequelize.INTEGER, defaultValue: 0 },
      failed_rows: { type: Sequelize.INTEGER, defaultValue: 0 },
      progress_percentage: { type: Sequelize.NUMERIC, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. sequences
    await queryInterface.createTable("sequences", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      lead_list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "lead_lists", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. client_leads
    await queryInterface.createTable("client_leads", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      master_contact_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "master_contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      source: { type: Sequelize.STRING, allowNull: true },
      is_dnc: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_unsubscribed: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex("client_leads", ["client_id", "master_contact_id"], {
      unique: true,
      name: "client_leads_client_id_master_contact_id_unique"
    });

    // 9. lead_list_memberships
    await queryInterface.createTable("lead_list_memberships", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      lead_list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "lead_lists", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      client_lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "client_leads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      status: {
        type: Sequelize.ENUM("Pending", "Converted", "Dead", "Callback", "Unreachable"),
        defaultValue: "Pending"
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex("lead_list_memberships", ["lead_list_id", "client_lead_id"], {
      unique: true,
      name: "lead_list_memberships_lead_list_id_client_lead_id_unique"
    });

    // 10. campaigns
    await queryInterface.createTable("campaigns", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      lead_list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "lead_lists", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      sequence_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sequences", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      requires_net_new_leads: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM("email", "call"), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category_tag: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM("draft", "active", "paused", "completed"),
        defaultValue: "draft"
      },
      dispatch_status: {
        type: Sequelize.ENUM("not_sent", "sending", "sent"),
        defaultValue: "not_sent"
      },
      segmentation_filters: { type: Sequelize.JSONB, allowNull: true },
      exclude_closed_leads: { type: Sequelize.BOOLEAN, defaultValue: true },
      pricing_model: { type: Sequelize.ENUM("flat_retainer", "cost_per_lead"), allowNull: true },
      retainer_amount: { type: Sequelize.NUMERIC, allowNull: true },
      rate_per_lead: { type: Sequelize.NUMERIC, allowNull: true },
      budget_alert90_sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      budget_alert100_sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      requires_manager_approval: { type: Sequelize.BOOLEAN, defaultValue: true },
      approved_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      subject_line: { type: Sequelize.STRING, allowNull: true },
      sender_name: { type: Sequelize.STRING, allowNull: true },
      reply_to_email: { type: Sequelize.STRING, allowNull: true },
      email_body_html: { type: Sequelize.TEXT, allowNull: true },
      banner_image_url: { type: Sequelize.STRING, allowNull: true },
      schedule_type: { type: Sequelize.STRING, allowNull: true },
      scheduled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 11. campaign_executives
    await queryInterface.createTable("campaign_executives", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      executive_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      unassigned_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 12. campaign_leads
    await queryInterface.createTable("campaign_leads", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      client_lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "client_leads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      assigned_executive_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      assigned_at: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM("pending", "in_progress", "called", "skipped", "completed"),
        defaultValue: "pending"
      },
      status_updated_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex("campaign_leads", ["campaign_id", "client_lead_id"], {
      unique: true,
      name: "campaign_leads_campaign_id_client_lead_id_unique"
    });

    // 13. lead_engagements
    await queryInterface.createTable("lead_engagements", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      client_lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "client_leads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      tracking_token: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM("sent", "delivered", "bounced", "spamreport"),
        defaultValue: "sent"
      },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      opened_at: { type: Sequelize.DATE, allowNull: true },
      clicked_at: { type: Sequelize.DATE, allowNull: true },
      converted_at: { type: Sequelize.DATE, allowNull: true },
      unsubscribed_at: { type: Sequelize.DATE, allowNull: true },
      open_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      click_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      bounce_type: { type: Sequelize.STRING, allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 14. call_remarks
    await queryInterface.createTable("call_remarks", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      client_lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "client_leads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      executive_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      call_outcome: {
        type: Sequelize.ENUM(
          "Answered",
          "Not_Answered",
          "Busy",
          "Wrong_Number",
          "Left_Voicemail",
          "Callback_Requested",
          "Not_Interested",
          "Converted"
        ),
        allowNull: false
      },
      call_duration_minutes: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.STRING(1000), allowNull: true },
      follow_up_date: { type: Sequelize.DATE, allowNull: true },
      lead_status_update: {
        type: Sequelize.ENUM("New", "Contacted", "Qualified", "Converted", "Dead"),
        allowNull: true
      },
      is_manual_entry_by_manager: { type: Sequelize.BOOLEAN, defaultValue: false },
      conversion_confirmed: { type: Sequelize.BOOLEAN, allowNull: true },
      confirmed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      confirmed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 15. email_processing_jobs
    await queryInterface.createTable("email_processing_jobs", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      status: {
        type: Sequelize.ENUM("Queued", "Processing", "Completed", "Failed"),
        defaultValue: "Queued"
      },
      total_emails: { type: Sequelize.INTEGER, defaultValue: 0 },
      processed_emails: { type: Sequelize.INTEGER, defaultValue: 0 },
      successful_sends: { type: Sequelize.INTEGER, defaultValue: 0 },
      failed_sends: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in strict reverse order to avoid FK constraint errors
    await queryInterface.dropTable("email_processing_jobs");
    await queryInterface.dropTable("call_remarks");
    await queryInterface.dropTable("lead_engagements");
    await queryInterface.dropTable("campaign_leads");
    await queryInterface.dropTable("campaign_executives");
    await queryInterface.dropTable("campaigns");
    await queryInterface.dropTable("lead_list_memberships");
    await queryInterface.dropTable("client_leads");
    await queryInterface.dropTable("sequences");
    await queryInterface.dropTable("import_jobs");
    await queryInterface.dropTable("lead_lists");
    await queryInterface.dropTable("master_contacts");
    await queryInterface.dropTable("client_managers");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("clients");
  }
};
