"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  triageTicket, 
  getTickets, 
  getTicketDetail 
} from "@/lib/api";
import { Ticket } from "@/lib/types";
import { 
  Terminal, 
  Upload, 
  Play, 
  CheckCircle, 
  Cpu, 
  Clock, 
  FileText,
  FileJson,
  Plus, 
  Loader2, 
  History,
  Copy,
  AlertTriangle,
  Flame,
  Check,
  Zap,
  Globe,
  Smile,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

// Redesigned presets matching neutral branding
const DEMO_PRESETS = [
  {
    label: "Refund Request (Gujarati)",
    text: "મને રિફંડ ક્યારે મળશે? ૧૦ દિવસ થઈ ગયા છે. મેં એક સાડી ખરીદી હતી જે ફાટેલી નીકળી. ઓર્ડર નંબર ORD-33928. મારા 2500 રૂપિયા પાછા જોઈએ છે!"
  },
  {
    label: "Double Charged (English)",
    text: "Double charge issue! I was billed twice for order ORD-12093. Charges are $89.00 and $89.00 on my credit card. Refund the duplicate charge."
  },
  {
    label: "Failed Payment (Hinglish/Mixed)",
    text: "Mera payment deduct ho gaya but refund nathi malyo. check karo status. email is rahul.sharma@gmail.com and phone is 9876543210. Rs. 1500 cut gaye."
  },
  {
    label: "Gibberish Spam (Characters)",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa gibberish content text"
  },
  {
    label: "Promotional Spam (Emojis)",
    text: "🔥🔥🔥 CLICK HERE 🔥🔥🔥 GET FREE CASH PRIZE NOW 🔥🔥🔥 AMAZING VOUCHERS NOW CLICK HERE 🔥🔥🔥"
  },
  {
    label: "Security Incident (English / SQL Injection)",
    text: "URGENT: I detected a SQL injection attempt in our client portal input logs. Someone is trying to exploit the search query box. IP: 192.168.1.100. Contact security admin."
  }
];

function Workspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketIdParam = searchParams.get("tkt");

  const [rawText, setRawText] = useState("");
  const [analyzedTicket, setAnalyzedTicket] = useState<Ticket | null>(null);
  const [recentList, setRecentList] = useState<Ticket[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [centerTab, setCenterTab] = useState<"processing" | "timeline">("processing");
  
  // Batch processing queue states
  const [batchActive, setBatchActive] = useState(false);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecentList();
    if (ticketIdParam) {
      loadTicketDetail(ticketIdParam);
    }
  }, [ticketIdParam]);

  const loadRecentList = async () => {
    setListLoading(true);
    try {
      const tickets = await getTickets({ limit: "15" });
      setRecentList(tickets);
    } catch (err) {
      console.error("Error loading history list:", err);
    } finally {
      setListLoading(false);
    }
  };

  const loadTicketDetail = async (id: string) => {
    setLoading(true);
    try {
      const detail = await getTicketDetail(id);
      setAnalyzedTicket(detail);
      setRawText(detail.raw_text);
    } catch (err) {
      console.error("Error loading ticket detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setAnalyzedTicket(null);
    try {
      const result = await triageTicket(rawText);
      setAnalyzedTicket(result);
      loadRecentList();
      router.push("/workspace", { scroll: false });
    } catch (err: any) {
      console.error("Triage failed:", err);
      alert(err.message || "Failed to run AI Triage analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.text) {
          setRawText(json.text);
        } else if (typeof json === "string") {
          setRawText(json);
        } else {
          setRawText(JSON.stringify(json, null, 2));
        }
      } catch (err) {
        setRawText(event.target?.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let textArray: string[] = [];
        
        if (Array.isArray(json)) {
          textArray = json.map((item: any) => typeof item === "string" ? item : item.text || JSON.stringify(item));
        } else if (json.tickets && Array.isArray(json.tickets)) {
          textArray = json.tickets.map((t: any) => t.text || JSON.stringify(t));
        } else {
          alert("JSON format should be an array of objects: [{ \"text\": \"...\" }]");
          return;
        }

        if (textArray.length === 0) {
          alert("No tickets found in the file.");
          return;
        }

        // Initialize batch processing queue
        setBatchTotal(textArray.length);
        setBatchCurrentIndex(0);
        setBatchActive(true);
        setLoading(true);

        const results: Ticket[] = [];
        
        // Sequentially triage tickets to update progress bar live
        for (let i = 0; i < textArray.length; i++) {
          setBatchCurrentIndex(i + 1);
          if (!textArray[i].trim()) continue;
          try {
            const res = await triageTicket(textArray[i]);
            results.push(res);
            // Brief pause to simulate progression
            await new Promise(r => setTimeout(r, 100));
          } catch (err) {
            console.error(`Failed to triage ticket index ${i}:`, err);
          }
        }

        alert(`Successfully processed batch queue of ${results.length}/${textArray.length} tickets.`);
        await loadRecentList();
        if (results.length > 0) {
          setAnalyzedTicket(results[results.length - 1]);
          setRawText(results[results.length - 1].raw_text);
        }
      } catch (err) {
        alert("Parsing failed. Verify file format matches JSON ticket array.");
      } finally {
        setBatchActive(false);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyJson = () => {
    if (!analyzedTicket) return;
    const jsonOutput = getOutputSchema(analyzedTicket);
    navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOutputSchema = (tkt: Ticket) => {
    return {
      ticket_id: tkt.ticket_id,
      summary: tkt.summary,
      language: tkt.language,
      translated_text: tkt.translated_text,
      cleaned_text: tkt.cleaned_text,
      intent: tkt.intent,
      sentiment: tkt.sentiment,
      priority: tkt.priority,
      department: tkt.department,
      sla_hours: tkt.sla_hours,
      confidence_score: tkt.confidence_score,
      human_review_required: tkt.human_review_required,
      out_of_scope: tkt.out_of_scope,
      duplicate_ticket: tkt.duplicate_ticket,
      reason: tkt.reason,
      spam: tkt.spam,
      spam_score: tkt.spam_score,
      spam_reason: tkt.spam_reason,
      matched_ticket_id: tkt.matched_ticket_id || tkt.duplicate_ticket_id,
      retries_count: tkt.retries_count,
      entities: {
        order_id: tkt.entities?.order_id || "",
        amount: tkt.entities?.amount || "",
        email: tkt.entities?.email || "",
        phone: tkt.entities?.phone || ""
      }
    };
  };

  const selectPreset = (text: string) => {
    setRawText(text);
  };

  // Priority Colors
  const PRIORITY_THEME: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200/60",
    High: "bg-orange-50 text-orange-700 border-orange-200/60",
    Medium: "bg-amber-50 text-amber-800 border-amber-200/60",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
  };

  return (
    <div className="flex-grow bg-white flex flex-col h-screen overflow-hidden text-slate-800">
      
      {/* Action Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal size={16} className="text-blue-600" />
            <span>Analysis Workspace Console</span>
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Triage raw support requests in real time or process files in bulk.</p>
        </div>

        {/* Presets dropdown */}
        <div className="flex items-center gap-2.5">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Demo Presets:</label>
          <select 
            onChange={(e) => selectPreset(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
            defaultValue=""
          >
            <option value="" disabled>-- Select demo scenario --</option>
            {DEMO_PRESETS.map((p, idx) => (
              <option key={idx} value={p.text}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        
        {/* Workspace Sidebar History */}
        <aside className="w-56 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-450">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <History size={12} />
              <span>Workspace Logs</span>
            </span>
            <button 
              onClick={() => {
                setRawText("");
                setAnalyzedTicket(null);
                router.push("/workspace", { scroll: false });
              }}
              className="text-slate-500 hover:text-slate-950 p-1 hover:bg-slate-200 rounded transition-colors"
              title="Reset Sandbox"
            >
              <Plus size={13} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-1 bg-slate-50/50">
            {listLoading && recentList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Loader2 className="animate-spin inline-block mb-1.5 text-slate-400" size={14} />
                <p>Loading History...</p>
              </div>
            ) : (
              recentList.map((t) => (
                <button
                  key={t.ticket_id}
                  onClick={() => router.push(`/workspace?tkt=${t.ticket_id}`, { scroll: false })}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-1 border ${
                    ticketIdParam === t.ticket_id || (analyzedTicket?.ticket_id === t.ticket_id && !ticketIdParam)
                      ? "bg-white border-blue-600/30 text-slate-900 font-semibold shadow-xs" 
                      : "bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center w-full font-mono text-[9px] text-slate-400">
                    <span>{t.ticket_id}</span>
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        t.priority === "Critical" 
                          ? "text-red-600 bg-red-50" 
                          : t.priority === "High" 
                          ? "text-orange-650 bg-orange-50" 
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="truncate w-full font-medium text-slate-650">{t.raw_text}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* 3-Column main grid */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-50/30">
          
          {/* COLUMN 1: Inputs */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col overflow-y-auto p-5 space-y-5 bg-white">
            
            {/* Batch Upload widgets */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workspace Inputs</h2>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col gap-3">
                
                {/* Single file upload */}
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <span className="text-xs text-slate-600">Upload JSON Ticket</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer"
                  >
                    Browse
                  </button>
                </div>

                {/* Bulk Queue Upload */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Batch Analysis Upload</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBulkUpload}
                    ref={bulkInputRef}
                    className="hidden"
                  />
                  <button
                    onClick={() => bulkInputRef.current?.click()}
                    disabled={loading}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-slate-900 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Select List
                  </button>
                </div>

              </div>
            </div>

            {/* Batch Queue Processing indicator */}
            {batchActive && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2.5">
                <span className="text-[9px] text-blue-700 font-bold uppercase tracking-wider block">Processing Queue</span>
                <div className="flex justify-between items-center text-xs text-blue-900 font-semibold">
                  <span>Analyzing Ticket {batchCurrentIndex}/{batchTotal}</span>
                  <span>{Math.round((batchCurrentIndex / batchTotal) * 100)}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-blue-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-150" 
                    style={{ width: `${(batchCurrentIndex / batchTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Raw message text area */}
            <div className="flex-grow flex flex-col min-h-[220px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Raw Message Input</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Enter customer support message here. Multilingual texts, spam promos, or duplicate tickets are supported..."
                className="flex-1 w-full p-4 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 resize-none font-sans shadow-xs bg-slate-50/20"
              />
            </div>

            {/* Action Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading || !rawText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 text-white font-semibold text-xs py-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && !batchActive ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Analyzing Telemetry...</span>
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  <span>Execute AI Triage</span>
                </>
              )}
            </button>
          </div>

          {/* COLUMN 2: Workspace Details & explainers */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col overflow-hidden bg-white">
            
            {/* Header Tabs */}
            <div className="flex border-b border-slate-200 px-4 pt-3 shrink-0">
              <button
                onClick={() => setCenterTab("processing")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === "processing" 
                    ? "border-blue-600 text-slate-900 font-bold" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Analysis Details
              </button>
              <button
                onClick={() => setCenterTab("timeline")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                  centerTab === "timeline" 
                    ? "border-blue-600 text-slate-900 font-bold" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Pipeline Timeline
              </button>
            </div>

            {/* Content box */}
            <div className="flex-grow overflow-y-auto p-5">
              {!analyzedTicket ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-400">
                  <Cpu size={28} className="mb-3 text-slate-300 animate-pulse" />
                  <h3 className="font-semibold text-xs text-slate-500">Await Triage Request</h3>
                  <p className="text-[10px] max-w-xs mt-1 leading-relaxed text-slate-400">
                    Input a support message in the left panel and click 'Execute AI Triage' to launch the pipeline.
                  </p>
                </div>
              ) : centerTab === "processing" ? (
                <div className="space-y-4">
                  
                  {/* Original text block */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Customer Message</span>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs leading-relaxed">
                      {analyzedTicket.raw_text}
                    </p>
                  </div>

                  {/* Language Detection block */}
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Language</span>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 mt-1">
                        {analyzedTicket.language}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Sentiment</span>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 mt-1">
                        {analyzedTicket.sentiment}
                      </div>
                    </div>
                  </div>

                  {/* Translation block if needed */}
                  {analyzedTicket.translated_text && analyzedTicket.language.toLowerCase() !== "english" && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">English Translation</span>
                      <p className="p-3 bg-blue-50/20 border border-blue-100 rounded-lg text-blue-900 text-xs leading-relaxed">
                        {analyzedTicket.translated_text}
                      </p>
                    </div>
                  )}

                  {/* Spam Block Alert Indicators */}
                  {analyzedTicket.spam && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex gap-2.5 items-start text-xs text-red-700">
                      <ShieldAlert className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="font-bold block">Spam Content Blocked</span>
                        <span className="text-slate-550 text-[10px] mt-0.5 block">
                          Reason: {analyzedTicket.spam_reason} (Score: {Math.round(analyzedTicket.spam_score * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Alert Indicators */}
                  {analyzedTicket.duplicate_ticket && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start text-xs text-amber-800">
                      <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="font-bold block">Duplicate Ticket Flagged</span>
                        <span className="text-slate-550 text-[10px] mt-0.5 block">
                          This complaint matches ticket ID <strong>{analyzedTicket.matched_ticket_id || analyzedTicket.duplicate_ticket_id}</strong>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* AI Explainability Breakdown */}
                  <div className="border border-slate-250 bg-white p-4 rounded-xl space-y-3.5 mt-3 shadow-xs">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-[10px] uppercase tracking-wider">AI Explainability</h4>
                    
                    <div className="space-y-2.5 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Priority Explainer ({analyzedTicket.priority})</span>
                        <p className="text-slate-600 mt-0.5">
                          {analyzedTicket.priority === "Critical" && "Identified security threat requiring immediate operations routing."}
                          {analyzedTicket.priority === "High" && "Identified billing/transaction block or premium service cancellation."}
                          {analyzedTicket.priority === "Medium" && "Service quality issue (refund query / delivery delay) assigned normal SLA routing."}
                          {analyzedTicket.priority === "Low" && "Low urgency back-office requests, general suggestions, or spam filters."}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Routing Explainer ({analyzedTicket.department})</span>
                        <p className="text-slate-600 mt-0.5">
                          {analyzedTicket.department === "Finance" && "Routed to Finance due to transactional queries, double charging, or refund demands."}
                          {analyzedTicket.department === "Technical Support" && "Routed to Tech Support: customer report app crashing, bug logs, or reset failures."}
                          {analyzedTicket.department === "Logistics" && "Routed to Logistics: client reports delayed delivery, custom transit, or address updates."}
                          {analyzedTicket.department === "Customer Success" && "Routed to Customer Success: subscription cancellation requests or profile deletions."}
                          {analyzedTicket.department === "Security Team" && "Routed to Security Team: security alert notifications or unauthorized login records."}
                          {analyzedTicket.department === "Operations Team" && "Routed to Operations Team: spam block dismissals or general feedback venting."}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Audit Reason</span>
                        <p className="text-slate-600 mt-0.5">
                          {analyzedTicket.human_review_required 
                            ? `Verification triggered: ${analyzedTicket.reason}` 
                            : "Routing clean: confidence score exceeds safety threshold (85%) with standard language."}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Latency steps list */
                <div className="relative border-l border-slate-200 ml-4 py-2 space-y-6">
                  {analyzedTicket.timeline_data && Object.entries(analyzedTicket.timeline_data)
                    .filter(([key]) => key !== "total_duration_ms")
                    .map(([key, val]: [string, any], index) => (
                      <div key={key} className="relative pl-6 group">
                        {/* Dot indicator */}
                        <div className="absolute top-1.5 left-[-4.5px] w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white group-hover:bg-blue-500 transition-colors"></div>
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            <h4 className="font-semibold text-slate-800 leading-none">{key}</h4>
                            {val.result && <p className="text-[9px] text-blue-600 font-mono mt-0.5">Val: {val.result}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-slate-450">{val.duration_ms}ms</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Latency Footer */}
                    <div className="pl-6 pt-4 border-t border-slate-100 mt-4 flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800">Total Latency</span>
                      <span className="text-emerald-600 font-mono">
                        {analyzedTicket.timeline_data?.total_duration_ms || 0}ms
                      </span>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: JSON output preview */}
          <div className="lg:col-span-4 flex flex-col overflow-hidden bg-slate-50/20">
            
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileJson size={12} className="text-blue-600" />
                <span>JSON Payload output</span>
              </span>
              
              {analyzedTicket && (
                <button
                  onClick={handleCopyJson}
                  className="px-2 py-1 bg-white hover:bg-slate-50 rounded border border-slate-200 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={10} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-grow p-4 overflow-auto font-mono text-[10px] text-slate-600 select-all bg-white">
              {analyzedTicket ? (
                <pre className="text-blue-900/90 leading-relaxed max-w-full">
                  {JSON.stringify(getOutputSchema(analyzedTicket), null, 2)}
                </pre>
              ) : (
                <div className="h-full flex justify-center items-center text-slate-400 text-center">
                  <span>No triage object generated.</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <Workspace />
    </Suspense>
  );
}
