"use client";

import { useEffect, useState } from "react";
import DonutChart from "@/components/for_client/DonutChart";
import ConvertedLeadsDetails from "@/components/for_client/ConvertedLeadsDetails";
import SequenceTable from "@/components/for_client/SequenceTable";
import CampaignTable from "@/components/for_client/CampaignTable";
import ConvertedLeadsModal from "@/components/for_client/ConvertedLeadsModal";
import CampaignDetailsModal from "@/components/for_client/CampaignDetailsModal";
import { getSequences, getSequence } from "@/lib/sequences";
import { exportConvertedLeads } from "@/lib/reports";
import { ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/api/api";


// Generate dedicated Converted Leads PDF Report
function printConvertedLeadsReport({ sequence, leads = [] }) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const rows = leads
    .map(
      (lead, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 10px; font-family: monospace; font-weight: 600; color: #475569;">${index+1}</td>
        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${lead.name}</td>
        <td style="padding: 8px 10px; color: #334155;">
          ${lead.email}
          ${lead.phone ? `<br><span style="color: #64748b; font-size: 10px;">${lead.phone}</span>` : ""}
        </td>
        <td style="padding: 8px 10px; color: #334155;">${lead.company || "-"}</td>
        <td style="padding: 8px 10px;">
          <span style="background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600;">
            ${lead.campaignName}
          </span>
        </td>
        <td style="padding: 8px 10px; color: #64748b; font-family: monospace;">${lead.convertedDate}</td>
        <td style="padding: 8px 10px;">
          <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700;">
            ${lead.status || "Converted"}
          </span>
        </td>
      </tr>
    `
    )
    .join("");

  const docHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Converted_Leads_${sequence ? sequence.id : "Report"}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
          }
          .header {
            border-bottom: 3px solid #18181b;
            padding-bottom: 14px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; }
          .meta { font-size: 11px; color: #64748b; text-align: right; }
          .summary-grid {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
          }
          .summary-card {
            flex: 1;
            background: #f8fafc;
            border: 2px solid #18181b;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .summary-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .summary-val { font-size: 20px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          thead th {
            background: #f1f5f9;
            padding: 9px 10px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1e293b;
            border-bottom: 2px solid #18181b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Lead Pulse &bull; Converted Leads Report</div>
            <div class="subtitle">
              Sequence: <strong>${sequence ? sequence.name : "All Sequences"}</strong> (ID: ${sequence ? sequence.id : "-"})
            </div>
          </div>
          <div class="meta">
            <div>Report Date: ${new Date().toLocaleDateString()}</div>
            <div>Status: Verified Converted Leads</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Converted Leads</div>
            <div class="summary-val">${leads.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Campaigns in Sequence</div>
            <div class="summary-val">${sequence?.campaigns?.length || 0}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.NO.</th>
              <th>Lead Name</th>
              <th>Contact Info</th>
              <th>Company</th>
              <th>Campaign</th>
              <th>Converted Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">No converted leads found</td></tr>`}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(docHtml);
  iframeDoc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 350);
}

export default function DeepDiveView({ clientId }) {
  const [sequences, setSequences] = useState();
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [viewingCampaign, setViewingCampaign] = useState(null);
  const [showAllLeadsModal, setShowAllLeadsModal] = useState(false);
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(false);

  /*
  =============================================================================
  BACKEND INTEGRATION POINT 1: Fetch Sequences via Axios
  Endpoint: GET /sequences
  =============================================================================
  */
  useEffect(() => {
    let isMounted = true;

    async function loadSequencesFromBackend() {
      try {
        setLoading(true);
         const data = await getSequences(clientId ? { clientId } : {});
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setSequences(data);
        }
      } catch (err) {
        if (isMounted) {
          setSequences();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSequencesFromBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  /*
  =============================================================================
  BACKEND INTEGRATION POINT 2: Load Converted Leads for Selected Sequence m rn
  =============================================================================
  */
  useEffect(() => {
    if (!selectedSequence) {
      setLeadsList([]);
      return;
    }

    let isMounted = true;

    async function fetchSequenceDetailsAndLeads() {
      try {
        // 🚀 NEW: Call the dedicated converted-leads endpoint
        const response = await api.get(`/sequences/${selectedSequence.id}/converted-leads`);
        const fetchedLeads = response.data?.data;
        
        if (fetchedLeads && Array.isArray(fetchedLeads) && isMounted) {
          setLeadsList(fetchedLeads);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch converted leads", err);
      }

      if (isMounted) {
        // Fallback or empty state if it fails
        setLeadsList([]);
      }
    }

    fetchSequenceDetailsAndLeads();
    return () => {
      isMounted = false;
    };
  }, [selectedSequence]);

  const totalConverted = selectedSequence
    ? selectedSequence.campaigns.reduce((acc, c) => acc + (Number(c.convertedLeads) || 0), 0)
    : 0;

  /*
  =============================================================================
  BACKEND INTEGRATION POINT 3: Export Converted Leads as PDF via Axios
  =============================================================================
  */
  const handleExportPDF = async () => {

    // Export dedicated Converted Leads report
    printConvertedLeadsReport({
      sequence: selectedSequence,
      leads: leadsList,
    });
  };

  return (
    <div className="client-deepdive-page flex flex-col gap-6">
      {/* Clean Breadcrumb Navigation */}
      <div className="client-breadcrumb-bar">
        <div className="client-breadcrumb-trail">
          <button
            type="button"
            onClick={() => setSelectedSequence(null)}
            className={`client-crumb-btn ${!selectedSequence ? "active" : ""}`}
          >
            Sequence List
          </button>

          {selectedSequence && (
            <>
              <ChevronRight size={14} className="client-crumb-separator" />
              <span className="client-crumb-current">
                {selectedSequence.name}
              </span>
            </>
          )}
        </div>

        {selectedSequence && (
          <button
            type="button"
            onClick={() => setSelectedSequence(null)}
            className="client-back-to-seqs-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Sequences</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedSequence ? (
        /* SEQUENCE LEVEL RENDER */
        <div className="client-sequence-render-wrapper">
          <SequenceTable
            sequences={sequences}
            onSelectSequence={(seq) => setSelectedSequence(seq)}
          />
        </div>
      ) : (
        /* CAMPAIGN LEVEL RENDER */
        <div className="client-campaign-render-wrapper">
          <div className="client-campaign-split-grid">
            {/* Left Column: Donut Chart & Converted Leads Details Box */}
            <div className="client-campaign-left-col">
              <DonutChart
                campaigns={selectedSequence.campaigns}
                sequenceName={selectedSequence.name}
              />

              <ConvertedLeadsDetails
                totalConverted={totalConverted}
                onExportPDF={handleExportPDF}
                onViewAllLeads={() => setShowAllLeadsModal(true)}
              />
            </div>

            {/* Right Column: Campaigns Table with Pagination & Modal Triggers */}
            <div className="client-campaign-right-col">
              <CampaignTable
                campaigns={selectedSequence.campaigns}
                onViewCampaign={(camp) => setViewingCampaign(camp)}
              />
            </div>
          </div>
        </div>
      )}

      {/* In-place Pop-up Modals */}
      <ConvertedLeadsModal
        show={showAllLeadsModal}
        onClose={() => setShowAllLeadsModal(false)}
        sequence={selectedSequence}
        leads={leadsList}
      />

      <CampaignDetailsModal
        show={Boolean(viewingCampaign)}
        onClose={() => setViewingCampaign(null)}
        campaign={viewingCampaign}
        sequenceName={selectedSequence?.name}
      />
    </div>
  );
}