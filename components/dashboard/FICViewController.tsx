"use client";

import React, { useState, useEffect } from "react";
import { IUser } from "@/types/user";
import { dispatchGateway, GATEWAY_OPCODES } from "@/lib/gatewayClient";
import { formatIndianCurrency } from "@/lib/eventProposalPresets";
import EventProposalDocument from "./EventProposalDocument";

interface FICViewControllerProps {
  user: IUser;
}

export default function FICViewController({ user }: FICViewControllerProps) {
  const [activeTab, setActiveTab] = useState<"proposals" | "rough_requests" | "budgets" | "files">("proposals");
  const [proposals, setProposals] = useState<any[]>([]);
  const [roughRequests, setRoughRequests] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [societyFiles, setSocietyFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Proposal modal & action state
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [ficRemarks, setFicRemarks] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [previewDocument, setPreviewDocument] = useState<boolean>(false);

  // Rough request action state
  const [roughRemarks, setRoughRemarks] = useState<string>("");
  const [activeRoughId, setActiveRoughId] = useState<string | null>(null);

  // Filter state
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState<string>("ALL");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("ALL");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch Proposals
      const propRes = await dispatchGateway<{ proposals: any[] }>(GATEWAY_OPCODES.FETCH_EVENT_PROPOSALS);
      if (propRes.ok && propRes.data) {
        setProposals(propRes.data.proposals || []);
      }

      // 2. Fetch Rough Requests
      const roughRes = await dispatchGateway<{ requests: any[] }>(GATEWAY_OPCODES.FETCH_ROUGH_REQUESTS);
      if (roughRes.ok && roughRes.data) {
        setRoughRequests(roughRes.data.requests || []);
      }

      // 3. Fetch Budgets
      const budRes = await dispatchGateway<{ budgets: any[] }>(GATEWAY_OPCODES.FETCH_EVENT_BUDGETS);
      if (budRes.ok && budRes.data) {
        setBudgets(budRes.data.budgets || []);
      }

      // 4. Fetch Society Files
      const fileRes = await dispatchGateway<{ files: any[] }>(GATEWAY_OPCODES.FETCH_SOCIETY_FILES);
      if (fileRes.ok && fileRes.data) {
        setSocietyFiles(fileRes.data.files || []);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to load FIC records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle FIC stage action on proposals (Student -> FIC -> Dean)
  const handleFicProposalAction = async (action: "APPROVE" | "REQUEST_REVISION" | "REJECT") => {
    if (!selectedProposal?._id) return;
    setActionLoading(true);

    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.FIC_ACTION_PROPOSAL, {
        proposalId: selectedProposal._id,
        action,
        remarks: ficRemarks,
      });

      if (res.ok) {
        showToast(
          "success",
          action === "APPROVE"
            ? "Proposal approved and forwarded to Dean KSAC for final sanction."
            : action === "REQUEST_REVISION"
            ? "Revision requested and returned to Student Lead."
            : "Proposal rejected."
        );
        setSelectedProposal(null);
        setFicRemarks("");
        loadData();
      } else {
        showToast("error", res.message || "Action failed.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rough Request action (approve / disapprove / waiting)
  const handleRoughRequestAction = async (requestId: string, action: "APPROVE" | "DISAPPROVE" | "WAITING") => {
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.ACTION_ROUGH_REQUEST, {
        requestId,
        action,
        reviewRemarks: roughRemarks,
      });

      if (res.ok) {
        showToast("success", `Rough request marked as ${action}.`);
        setActiveRoughId(null);
        setRoughRemarks("");
        loadData();
      } else {
        showToast("error", res.message || "Failed to update rough request.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_FIC":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200">Awaiting FIC Review</span>;
      case "REVISION_REQUESTED_FIC":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-800 border border-orange-200">Revision Requested (FIC)</span>;
      case "PENDING_DEAN":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200">FIC Endorsed &bull; Pending Dean</span>;
      case "REVISION_REQUESTED_DEAN":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-200">Dean Requested Revision</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">Approved by Dean KSAC</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-800 border border-red-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const pendingFicCount = proposals.filter((p) => p.status === "PENDING_FIC").length;
  const pendingRoughCount = roughRequests.filter((r) => r.status === "WAITING").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-bold transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold mb-2">
            Faculty In-Charge (FIC) Portal &bull; {user.department || "Faculty Cell"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Society Mentor &amp; Approval Controller
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Welcome, <strong>{user.name}</strong>. Manage the first-stage approval pipeline:
            review preliminary rough requests, endorse comprehensive event proposals before Dean KSAC sanction, and inspect society budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
            <span className="block text-2xl font-black text-amber-700">{pendingFicCount}</span>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Pending Proposals</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-center">
            <span className="block text-2xl font-black text-blue-700">{pendingRoughCount}</span>
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Rough Requests</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab("proposals")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "proposals"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Proposals for Review {pendingFicCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">{pendingFicCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab("rough_requests")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "rough_requests"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Rough Pre-Requests {pendingRoughCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px]">{pendingRoughCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab("budgets")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "budgets"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Backend Budget Records
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "files"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Society File Vault
        </button>
      </div>

      {/* TAB 1: PROPOSALS REVIEW */}
      {activeTab === "proposals" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Event Proposals Queue</h2>
              <p className="text-xs text-slate-500">Student submissions requiring Faculty In-Charge verification before Dean KSAC.</p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">No proposals pending review.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {proposals.map((prop) => (
                <div
                  key={prop._id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-2xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">{prop.eventName}</span>
                      {getStatusBadge(prop.status)}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span><strong>Society:</strong> {prop.society}</span>
                      <span>&bull;</span>
                      <span><strong>Dates:</strong> {prop.dateDisplay || prop.startDate}</span>
                      <span>&bull;</span>
                      <span><strong>Venue:</strong> {prop.venueCampus}</span>
                      <span>&bull;</span>
                      <span><strong>Budget:</strong> Rs. {formatIndianCurrency(prop.budgetTotal || 0)}/-</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedProposal(prop);
                        setPreviewDocument(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Review &amp; Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUGH EVENT REQUESTS */}
      {activeTab === "rough_requests" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Pre-Proposal Rough Requests</h2>
              <p className="text-xs text-slate-500">Fast concept approvals: Review event name, tentative dates, and rough budgets.</p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Refresh
            </button>
          </div>

          {roughRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">No rough requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Society</th>
                    <th className="p-3">Tentative Date</th>
                    <th className="p-3">Rough Budget</th>
                    <th className="p-3">Submitted By</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">FIC Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roughRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{req.eventName}</td>
                      <td className="p-3">{req.society}</td>
                      <td className="p-3">{req.eventDate}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">Rs. {formatIndianCurrency(req.estimatedBudget || 0)}/-</td>
                      <td className="p-3">{req.studentName} ({req.position || "Lead"})</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "DISAPPROVED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRoughRequestAction(req._id, "APPROVE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                            title="Approve rough request"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRoughRequestAction(req._id, "DISAPPROVE")}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
                            title="Disapprove rough request"
                          >
                            Disapprove
                          </button>
                          <button
                            onClick={() => handleRoughRequestAction(req._id, "WAITING")}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition cursor-pointer"
                            title="Set to waiting"
                          >
                            Waiting
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BACKEND BUDGET RECORDS */}
      {activeTab === "budgets" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Event Budgets Ledger</h2>
              <p className="text-xs text-slate-500">Dedicated backend index of event names, sanctioned budgets, and revenue projections.</p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Refresh
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">No budget records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Society</th>
                    <th className="p-3">Budget Total</th>
                    <th className="p-3">Budget in Words</th>
                    <th className="p-3">Revenue Projection</th>
                    <th className="p-3">Items Count</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{b.eventName}</td>
                      <td className="p-3">{b.society}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">Rs. {formatIndianCurrency(b.budgetTotal || 0)}/-</td>
                      <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">{b.budgetInWords}</td>
                      <td className="p-3 font-mono text-slate-700">Rs. {formatIndianCurrency(b.revenueTotal || 0)}/-</td>
                      <td className="p-3 font-bold text-slate-600">{b.itemsCount || 0}</td>
                      <td className="p-3">{getStatusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SOCIETY FILE VAULT */}
      {activeTab === "files" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Society File Repository</h2>
              <p className="text-xs text-slate-500">Centralized storage for Banners, Posters, Sponsor MoUs, Society Logos, and Signed Copies.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="BANNER">Banners (12x8, 8x4)</option>
                <option value="POSTER">Posters (A3, A4, Digital)</option>
                <option value="MOU">Sponsor MoUs</option>
                <option value="SOCIETY_LOGO">Society Logos</option>
                <option value="SIGNED_COPY">Signed Copies</option>
              </select>

              <button
                onClick={loadData}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {societyFiles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm">No files uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {societyFiles
                .filter((f) => fileTypeFilter === "ALL" || f.fileType === fileTypeFilter)
                .map((file) => (
                  <div
                    key={file._id}
                    className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                        {file.fileType}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {file.fileDimensions || file.mimeType}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900 truncate">{file.fileName}</h4>
                      <p className="text-xs text-slate-500">
                        <strong>Society:</strong> {file.society} &bull; {file.eventName || "General Asset"}
                      </p>
                    </div>

                    {file.dataUrl && file.dataUrl.startsWith("data:image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.dataUrl}
                        alt={file.fileName}
                        className="w-full h-32 object-contain bg-slate-100 rounded-xl border border-slate-200"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-xs font-bold">
                        Document / PDF File
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <a
                        href={file.dataUrl}
                        download={file.fileName}
                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                      >
                        Download File
                      </a>
                      <span className="text-slate-400 text-[10px]">{file.uploadedByName}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL ACTION MODAL */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                  Faculty In-Charge Evaluation
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedProposal.eventName}</h3>
                <p className="text-xs text-slate-500">
                  Society: <strong>{selectedProposal.society}</strong> &bull; Lead: {selectedProposal.studentName} ({selectedProposal.position})
                </p>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition font-bold"
              >
                &times; Close
              </button>
            </div>

            {/* Document Preview Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewDocument((prev) => !prev)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                {previewDocument ? "Hide Document Preview" : "View Official A4 Document Preview"}
              </button>
            </div>

            {previewDocument ? (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <EventProposalDocument proposal={selectedProposal} canPrint={true} />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-[11px] text-slate-400 font-bold uppercase">Dates &amp; Mode</span>
                    <strong className="text-slate-800">{selectedProposal.dateDisplay || selectedProposal.startDate} ({selectedProposal.eventMode})</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-[11px] text-slate-400 font-bold uppercase">Sanctioned Budget</span>
                    <strong className="text-emerald-700 font-mono text-sm">Rs. {formatIndianCurrency(selectedProposal.budgetTotal || 0)}/-</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="block text-[11px] text-slate-400 font-bold uppercase">Current Status</span>
                    <div>{getStatusBadge(selectedProposal.status)}</div>
                  </div>
                </div>

                {/* Security Requisition overview */}
                {Array.isArray(selectedProposal.securityRequirements) && selectedProposal.securityRequirements.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                    <strong className="text-blue-900 block mb-1">Campus Security Requisition ({selectedProposal.securityRequirements.length} items):</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                      {selectedProposal.securityRequirements.map((s: any, idx: number) => (
                        <li key={idx}>
                          {s.securityType} - {s.quantity} personnel at {s.campus} ({s.timings})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Felicitation Requisition overview */}
                {Array.isArray(selectedProposal.felicitationRequirements) && selectedProposal.felicitationRequirements.length > 0 && (
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                    <strong className="text-purple-900 block mb-1">Dignitary Felicitation Materials ({selectedProposal.felicitationRequirements.length} items):</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-purple-800">
                      {selectedProposal.felicitationRequirements.map((f: any, idx: number) => (
                        <li key={idx}>
                          {f.item} (Qty: {f.quantity}) for {f.recipientDignitary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sponsors & MoU overview */}
                {Array.isArray(selectedProposal.sponsors) && selectedProposal.sponsors.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <strong className="text-amber-900 block mb-1">Sponsors &amp; MoU Attachments ({selectedProposal.sponsors.length} sponsors):</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                      {selectedProposal.sponsors.map((sp: any, idx: number) => (
                        <li key={idx}>
                          {sp.name} ({sp.tier}) - Rs. {formatIndianCurrency(sp.contributionAmount || 0)}/- {sp.mouFileName ? `[MoU: ${sp.mouFileName}]` : "[No MoU]"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* FIC Action & Remarks Input */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Faculty In-Charge Evaluation Remarks (Endorsement Note / Feedback):
              </label>
              <textarea
                value={ficRemarks}
                onChange={(e) => setFicRemarks(e.target.value)}
                placeholder="e.g. Recommended and endorsed for Dean KSAC approval. Budget and security requirements are verified."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-indigo-500"
                rows={3}
              />

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleFicProposalAction("APPROVE")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  &check; Approve &amp; Forward to Dean KSAC
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleFicProposalAction("REQUEST_REVISION")}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  Request Revisions from Student
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleFicProposalAction("REJECT")}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  Reject Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
