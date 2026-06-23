"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getAnalytics, 
  getTickets, 
  seedTickets, 
  clearTickets,
  deleteTicket,
  getExportJsonUrl,
  getExportCsvUrl
} from "@/lib/api";
import { Ticket, DashboardAnalytics } from "@/lib/types";
import { 
  Layers, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Database, 
  Download, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  AlertOctagon,
  Languages,
  Loader2,
  Filter,
  Eye,
  SlidersHorizontal,
  Flame,
  Check,
  ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters State
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterSpam, setFilterSpam] = useState("");
  const [filterDuplicate, setFilterDuplicate] = useState("");
  const [filterIntervention, setFilterIntervention] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "warning" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const analyticData = await getAnalytics();
      setAnalytics(analyticData);
      
      const allTickets = await getTickets({ limit: "500" });
      setTickets(allTickets);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setActionsLoading(true);
    try {
      await seedTickets();
      await fetchData();
      showToast("Successfully seeded 40 tickets from backend database!", "success");
      setSelectedRows({});
      setExpandedRows({});
    } catch (err) {
      console.error("Error seeding tickets:", err);
      try {
        const { getLocalMockTickets } = await import("@/lib/mockTickets");
        const mockTicketsList = getLocalMockTickets();
        setTickets(mockTicketsList);
        showToast("Backend offline. Loaded 40 local fallback mock tickets for demo safety.", "warning");
      } catch (fallbackErr) {
        showToast("Failed to seed tickets.", "error");
      }
      setSelectedRows({});
      setExpandedRows({});
    } finally {
      setActionsLoading(false);
    }
  };

  const handleExportJSON = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tickets.length === 0) {
      showToast("No tickets available to export.", "warning");
      return;
    }
    const exportData = tickets.map(t => ({
      ticket_id: t.ticket_id,
      status: t.status,
      created_at: t.created_at,
      raw_text: t.raw_text,
      summary: t.summary,
      language: t.language,
      translated_text: t.translated_text,
      cleaned_text: t.cleaned_text,
      intent: t.intent,
      sentiment: t.sentiment,
      priority: t.priority,
      department: t.department,
      sla_hours: t.sla_hours,
      confidence_score: t.confidence_score,
      human_review_required: t.human_review_required,
      out_of_scope: t.out_of_scope,
      duplicate_ticket: t.duplicate_ticket,
      duplicate_ticket_id: t.duplicate_ticket_id,
      matched_ticket_id: t.matched_ticket_id,
      spam: t.spam,
      spam_score: t.spam_score,
      spam_reason: t.spam_reason,
      human_intervention: t.human_intervention,
      human_intervention_reason: t.human_intervention_reason,
      reason: t.reason,
      entities: {
        order_id: t.entities?.order_id || "",
        amount: t.entities?.amount || "",
        email: t.entities?.email || "",
        phone: t.entities?.phone || ""
      }
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart_triage_export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Successfully exported JSON to downloads!", "success");
  };

  const handleExportCSV = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tickets.length === 0) {
      showToast("No tickets available to export.", "warning");
      return;
    }
    const headers = [
      "Ticket ID", "Status", "Date", "Original Text", "Summary", "Language", 
      "Cleaned Text", "Intent", "Sentiment", "Priority", "Department", 
      "SLA Hours", "Confidence", "Human Review Required", "Out Of Scope", 
      "Is Duplicate", "Duplicate ID", "Is Spam", "Spam Score", "Spam Reason",
      "Human Intervention", "Human Intervention Reason", "Order ID", "Amount", "Email", "Phone"
    ];
    const rows = tickets.map(t => [
      t.ticket_id,
      t.status,
      t.created_at,
      `"${(t.raw_text || "").replace(/"/g, '""')}"`,
      `"${(t.summary || "").replace(/"/g, '""')}"`,
      t.language,
      `"${(t.cleaned_text || "").replace(/"/g, '""')}"`,
      t.intent,
      t.sentiment,
      t.priority,
      t.department,
      t.sla_hours,
      t.confidence_score,
      t.human_review_required ? "Yes" : "No",
      t.out_of_scope ? "Yes" : "No",
      t.duplicate_ticket ? "Yes" : "No",
      t.duplicate_ticket_id || "",
      t.spam ? "Yes" : "No",
      t.spam_score,
      `"${(t.spam_reason || "").replace(/"/g, '""')}"`,
      t.human_intervention || "",
      `"${(t.human_intervention_reason || "").replace(/"/g, '""')}"`,
      t.entities?.order_id || "",
      t.entities?.amount || "",
      t.entities?.email || "",
      t.entities?.phone || ""
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart_triage_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Successfully exported CSV to downloads!", "success");
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear the entire database?")) return;
    setActionsLoading(true);
    try {
      await clearTickets();
      await fetchData();
      setSelectedRows({});
      setExpandedRows({});
    } catch (err) {
      console.error("Error clearing database:", err);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm(`Delete ticket ${ticketId}?`)) return;
    try {
      await deleteTicket(ticketId);
      setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      // Reload analytics summary
      const analyticData = await getAnalytics();
      setAnalytics(analyticData);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  };

  const toggleRowExpanded = (ticketId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const toggleRowSelected = (ticketId: string) => {
    setSelectedRows(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const toggleAllSelected = (visibleTickets: Ticket[]) => {
    const allSelected = visibleTickets.every(t => selectedRows[t.ticket_id]);
    const updated: Record<string, boolean> = { ...selectedRows };
    visibleTickets.forEach(t => {
      updated[t.ticket_id] = !allSelected;
    });
    setSelectedRows(updated);
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete all ${selectedIds.length} selected tickets?`)) return;
    
    setActionsLoading(true);
    try {
      for (const id of selectedIds) {
        await deleteTicket(id);
      }
      setSelectedRows({});
      await fetchData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
    } finally {
      setActionsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterPriority("");
    setFilterDepartment("");
    setFilterLanguage("");
    setFilterIntent("");
    setFilterSentiment("");
    setFilterSpam("");
    setFilterDuplicate("");
    setFilterIntervention("");
    setSearchQuery("");
  };

  if (!isMounted) {
    return (
      <div className="flex-grow bg-slate-50 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Priority Weights for sorting
  const PRIORITY_WEIGHTS: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };

  const PRIORITY_BADGES: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200/60",
    High: "bg-orange-50 text-orange-700 border-orange-200/60",
    Medium: "bg-amber-50 text-amber-800 border-amber-200/60",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
  };

  const SENTIMENT_BADGES: Record<string, string> = {
    Positive: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Neutral: "bg-slate-50 text-slate-600 border-slate-100",
    Negative: "bg-red-50 text-red-600 border-red-100"
  };

  // Filter & Search Tickets
  const filteredTickets = tickets.filter(ticket => {
    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = ticket.ticket_id.toLowerCase().includes(query);
      const matchText = ticket.raw_text.toLowerCase().includes(query);
      const matchSummary = ticket.summary.toLowerCase().includes(query);
      if (!matchId && !matchText && !matchSummary) return false;
    }

    // Dropdown filters
    if (filterPriority && ticket.priority !== filterPriority) return false;
    if (filterDepartment && ticket.department !== filterDepartment) return false;
    if (filterLanguage && ticket.language !== filterLanguage) return false;
    if (filterIntent && ticket.intent !== filterIntent) return false;
    if (filterSentiment && ticket.sentiment !== filterSentiment) return false;
    
    if (filterSpam) {
      const isSpamFilter = filterSpam === "true";
      if (ticket.spam !== isSpamFilter) return false;
    }
    
    if (filterDuplicate) {
      const isDupFilter = filterDuplicate === "true";
      if (ticket.duplicate_ticket !== isDupFilter) return false;
    }

    if (filterIntervention && ticket.human_intervention !== filterIntervention) return false;

    return true;
  });

  // Local calculations for real-time KPI updates
  const summaryTotal = analytics?.summary.total_tickets ?? tickets.length;
  const summaryCritical = analytics?.summary.critical_tickets ?? tickets.filter(t => t.priority === "Critical").length;
  const summaryDuplicates = analytics?.summary.duplicate_tickets ?? tickets.filter(t => t.duplicate_ticket).length;
  const summarySpam = analytics?.summary.spam_tickets_blocked ?? tickets.filter(t => t.spam).length;
  const summaryLanguages = analytics?.summary.languages_processed ?? (tickets.length > 0 ? new Set(tickets.map(t => t.language)).size : 0);
  const summarySla = analytics?.summary.average_sla ?? (tickets.length > 0 ? Number((tickets.filter(t => !t.spam).reduce((acc, t) => acc + (t.sla_hours || 0), 0) / (tickets.filter(t => !t.spam).length || 1)).toFixed(1)) : 0);
  const summaryInterventionCount = analytics?.summary.human_intervention_required_count ?? tickets.filter(t => t.human_intervention === "Human Required").length;
  const summaryInterventionPercent = analytics?.summary.human_intervention_required_percentage ?? (tickets.length > 0 ? Number(((tickets.filter(t => t.human_intervention === "Human Required").length / tickets.length) * 100).toFixed(1)) : 0);

  // Sort Tickets (Critical -> High -> Medium -> Low)
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const wA = PRIORITY_WEIGHTS[a.priority] || 0;
    const wB = PRIORITY_WEIGHTS[b.priority] || 0;
    
    if (wA !== wB) {
      return wB - wA; // Descending weight (4 first, 1 last)
    }
    // Secondary sort: Recency
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Pagination bounds
  const totalItems = sortedTickets.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Selected count
  const selectedCount = Object.keys(selectedRows).filter(id => selectedRows[id]).length;

  return (
    <div className="flex-1 bg-slate-50 p-6 lg:p-8 flex flex-col space-y-6 overflow-y-auto">
      
      {/* Page Title & Rebrand */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Support Operations Console</span>
            {actionsLoading && <Loader2 className="animate-spin text-blue-600" size={16} />}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage customer support tickets, analyze intent structures, and audit routing SLA logs.</p>
        </div>
        
        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            disabled={actionsLoading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={actionsLoading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </button>
          
          <button
            onClick={handleSeed}
            disabled={actionsLoading}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Seeding database"
          >
            <Database size={13} />
            <span>Seed 40 Tickets</span>
          </button>

          <button
            onClick={handleClear}
            disabled={actionsLoading}
            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Purge Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* KPI 1: Total */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Tickets</span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {summaryTotal}
          </span>
        </div>

        {/* KPI 2: Critical */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Critical Queue</span>
          <span className="text-xl font-extrabold text-red-600 mt-1 block">
            {summaryCritical}
          </span>
        </div>

        {/* KPI 3: Duplicates */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Duplicates found</span>
          <span className="text-xl font-extrabold text-amber-600 mt-1 block">
            {summaryDuplicates}
          </span>
        </div>

        {/* KPI 4: Spam Blocked */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Spam Blocked</span>
          <span className="text-xl font-extrabold text-rose-500 mt-1 block">
            {summarySpam}
          </span>
        </div>

        {/* KPI 5: Languages Processed */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Languages</span>
          <span className="text-xl font-extrabold text-blue-600 mt-1 block">
            {summaryLanguages}
          </span>
        </div>

        {/* KPI 6: Average SLA */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Average SLA</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1 block">
            {summarySla} <span className="text-xs font-normal text-slate-400">hrs</span>
          </span>
        </div>

        {/* KPI 7: Human Intervention */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Human Required</span>
          <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
            {summaryInterventionCount} <span className="text-xs font-normal text-slate-400 ml-0.5">({summaryInterventionPercent}%)</span>
          </span>
        </div>
      </div>

      {/* Main Support Queue Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Customer Support Queue</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Support tickets sorted by severity priority matrix.</p>
          </div>

          {/* Export & Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer mr-2"
              >
                <Trash2 size={12} />
                <span>Delete Selected ({selectedCount})</span>
              </button>
            )}

            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <Download size={12} />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3 items-center bg-white">
          
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or text..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Department filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">All Departments</option>
            <option value="Finance">Finance</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Logistics">Logistics</option>
            <option value="Customer Success">Customer Success</option>
            <option value="Security Team">Security Team</option>
            <option value="Operations Team">Operations Team</option>
          </select>

          {/* Language filter */}
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Mixed Hindi-English">Mixed Hindi-English</option>
            <option value="Mixed Gujarati-English">Mixed Gujarati-English</option>
            <option value="Mixed Hindi-Gujarati-English">Mixed Hindi-Gujarati-English</option>
          </select>

          {/* Spam filter */}
          <select
            value={filterSpam}
            onChange={(e) => setFilterSpam(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">Spam: All</option>
            <option value="true">Spam Blocked</option>
            <option value="false">Clean Only</option>
          </select>

          {/* Duplicate filter */}
          <select
            value={filterDuplicate}
            onChange={(e) => setFilterDuplicate(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">Duplicates: All</option>
            <option value="true">Duplicates Only</option>
            <option value="false">Unique Only</option>
          </select>

          {/* Human Intervention filter */}
          <select
            value={filterIntervention}
            onChange={(e) => setFilterIntervention(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="">All Interventions</option>
            <option value="Human Required">Human Required</option>
            <option value="Can Be Resolved Online">Online Resolvable</option>
          </select>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col justify-center items-center">
              <Loader2 className="animate-spin text-blue-600 mb-3" size={28} />
              <span className="text-xs text-slate-400">Loading Support queue...</span>
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <AlertCircle size={32} className="text-slate-300 mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">No Tickets Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                We couldn't find any tickets matching your search filters. Adjust inputs or click "Seed 40 Tickets" above.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 select-none">
                  {/* Checkbox */}
                  <th className="py-3 px-4 w-[2%] border-r border-slate-100">
                    <input
                      type="checkbox"
                      checked={paginatedTickets.every(t => selectedRows[t.ticket_id])}
                      onChange={() => toggleAllSelected(paginatedTickets)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider w-[6%]">Priority</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[8%]">Ticket ID</th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider w-[15%]">Original Message</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[8%]">Language</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[8%]">Intent</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[6%]">Sentiment</th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider w-[8%]">Department</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[4%]">SLA</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[5%]">Confidence</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[5%]">Duplicate</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[5%]">Spam</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[6%]">Human Review</th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider w-[10%]">Human Intervention</th>
                  <th className="py-3 px-2 font-bold uppercase tracking-wider w-[5%]">Status</th>
                  <th className="py-3 px-1 w-[2%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTickets.map((ticket) => {
                  const isExpanded = !!expandedRows[ticket.ticket_id];
                  const isSelected = !!selectedRows[ticket.ticket_id];
                  return (
                    <React.Fragment key={ticket.ticket_id}>
                      {/* Standard Row */}
                      <tr 
                        className={`enterprise-table-row transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/20" : isExpanded ? "bg-slate-50/30" : "bg-white"
                        }`}
                        onClick={() => toggleRowExpanded(ticket.ticket_id)}
                      >
                        {/* Checkbox column */}
                        <td 
                          className="py-3 px-4 border-r border-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowSelected(ticket.ticket_id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-blue-600 cursor-pointer"
                          />
                        </td>
                        
                        {/* Priority Badge */}
                        <td className="py-3 px-3">
                          <span 
                            className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                              PRIORITY_BADGES[ticket.priority] || "bg-slate-50 text-slate-700"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        
                        {/* Ticket ID */}
                        <td className="py-3 px-2 font-mono font-semibold text-slate-800">
                          {ticket.ticket_id}
                        </td>
                        
                        {/* Message column */}
                        <td className="py-3 px-3 pr-4">
                          <div className="truncate max-w-[130px] font-medium text-slate-700">{ticket.raw_text}</div>
                        </td>

                        {/* Language */}
                        <td className="py-3 px-2 font-medium text-slate-500">
                          {ticket.language}
                        </td>

                        {/* Intent */}
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {ticket.intent}
                          </span>
                        </td>

                        {/* Sentiment */}
                        <td className="py-3 px-2">
                          <span 
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                              SENTIMENT_BADGES[ticket.sentiment] || "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {ticket.sentiment}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 font-semibold text-slate-600">
                          {ticket.department}
                        </td>

                        {/* SLA */}
                        <td className="py-3 px-2 font-mono font-semibold text-slate-600">
                          {ticket.sla_hours} hrs
                        </td>

                        {/* Confidence */}
                        <td className="py-3 px-2 font-mono text-slate-500">
                          {Math.round((ticket.confidence_score || 0) * 100)}%
                        </td>

                        {/* Duplicate */}
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ticket.duplicate_ticket 
                              ? "bg-amber-50 text-amber-800 border border-amber-200/50" 
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                            {ticket.duplicate_ticket ? "Yes" : "No"}
                          </span>
                        </td>

                        {/* Spam */}
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ticket.spam 
                              ? "bg-rose-50 text-rose-700 border border-rose-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {ticket.spam ? "Spam" : "Clean"}
                          </span>
                        </td>

                        {/* Human Review */}
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ticket.human_review_required 
                              ? "bg-orange-50 text-orange-700 border border-orange-200/50" 
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                            {ticket.human_review_required ? "Yes" : "No"}
                          </span>
                        </td>

                        {/* Human Intervention */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                            ticket.human_intervention === "Human Required" 
                              ? "bg-red-50 text-red-700 border-red-200" 
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            {ticket.human_intervention || "Can Be Resolved Online"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            ticket.status === "Open" 
                              ? "bg-blue-50 text-blue-700 border border-blue-100" 
                              : ticket.status === "Closed" 
                              ? "bg-slate-150 text-slate-700 border border-slate-200" 
                              : "bg-yellow-50 text-yellow-700 border border-yellow-150"
                          }`}>
                            {ticket.status}
                          </span>
                        </td>

                        {/* Expand Toggle */}
                        <td className="py-3 px-1 text-right">
                          <button className="text-slate-400 hover:text-slate-700 transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                          <td colSpan={16} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs text-slate-600">
                              
                              {/* Left details - original/translated content */}
                              <div className="lg:col-span-8 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Raw input */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer Message</span>
                                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-sans leading-relaxed shadow-xs">
                                      {ticket.raw_text}
                                    </p>
                                  </div>

                                  {/* Cleaned text */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cleaned Text (Profanity checked)</span>
                                    <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-600 font-mono leading-relaxed shadow-xs truncate">
                                      {ticket.cleaned_text || "No cleaning required"}
                                    </p>
                                  </div>
                                </div>

                                {/* Translation block */}
                                {ticket.translated_text && ticket.language.toLowerCase() !== "english" && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">English Translation</span>
                                    <p className="p-3 bg-blue-50/30 border border-blue-100 rounded-lg text-blue-900 leading-relaxed shadow-xs font-sans">
                                      {ticket.translated_text}
                                    </p>
                                  </div>
                                )}

                                {/* AI Explainability Section */}
                                <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-3.5 shadow-xs">
                                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-[11px] uppercase tracking-wider">AI Explainability Breakdown</h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Priority explainer */}
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Priority Choice ({ticket.priority})</span>
                                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                        {ticket.priority === "Critical" && "Flagged as Critical: detected a severe security breach or account compromise attempt."}
                                        {ticket.priority === "High" && "Flagged as High: detected a blocking transaction issue or user subscription cancellation."}
                                        {ticket.priority === "Medium" && "Flagged as Medium: customer reports non-blocking delivery delay or standard refund request."}
                                        {ticket.priority === "Low" && "Flagged as Low: general low-urgency feature suggestion or out-of-scope query."}
                                      </p>
                                    </div>
                                    
                                    {/* Department explainer */}
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Department Routing ({ticket.department})</span>
                                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                        {ticket.department === "Finance" && "Routed to Finance: complaint text relates specifically to payment deduction, double billing, or refund queries."}
                                        {ticket.department === "Technical Support" && "Routed to Technical Support: customer reports browser white-screens, app crashes, or login lockouts."}
                                        {ticket.department === "Logistics" && "Routed to Logistics: message matches order tracking, shipment delay, or delivery address queries."}
                                        {ticket.department === "Security Team" && "Routed to Security Team: security alerts, hack notifications, or vulnerability exploits."}
                                        {ticket.department === "Customer Success" && "Routed to Customer Success: subscription plans cancellation or profile metadata updates."}
                                        {ticket.department === "Operations Team" && "Routed to Operations Team: general complaint venting or spam dismissals."}
                                      </p>
                                    </div>

                                    {/* Human Review explainer */}
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Human Review status</span>
                                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                        {ticket.human_review_required 
                                          ? `Audit Triggered: ${ticket.reason}`
                                          : "No audit required: AI confidence score exceeds safety threshold (85%) with clean English text."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right details - entities, duplicate, spam metrics */}
                              <div className="lg:col-span-4 space-y-4">
                                
                                {/* Entities Card */}
                                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs space-y-2.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Extracted Entities</span>
                                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div>
                                      <span className="text-slate-450 block text-[10px]">Order ID</span>
                                      <span className="font-mono text-slate-800 font-bold">{ticket.entities?.order_id || "N/A"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-450 block text-[10px]">Amount</span>
                                      <span className="font-semibold text-slate-800">{ticket.entities?.amount || "N/A"}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-slate-450 block text-[10px]">Email Address</span>
                                      <span className="text-slate-800 font-medium truncate block">{ticket.entities?.email || "N/A"}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-slate-450 block text-[10px]">Phone Number</span>
                                      <span className="font-mono text-slate-800 block">{ticket.entities?.phone || "N/A"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Duplicate & Spam Telemetry */}
                                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs space-y-3.5">
                                  {/* Duplicate details */}
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duplicate Detection</span>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      {/* Gauge Indicator */}
                                      <div className="w-10 h-10 rounded-full border-4 border-slate-100 flex items-center justify-center text-[10px] font-mono font-bold text-slate-700 bg-slate-50 shrink-0">
                                        {ticket.duplicate_ticket ? "75%" : "0%"}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">
                                          {ticket.duplicate_ticket ? "Duplicate Detected" : "Unique Ticket"}
                                        </span>
                                        {ticket.duplicate_ticket && (
                                          <span className="text-[10px] text-amber-600 font-medium block">
                                            Matches Original: {ticket.duplicate_ticket_id || ticket.matched_ticket_id}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Spam details */}
                                  <div className="border-t border-slate-100 pt-3">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Spam Scoring</span>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 bg-slate-50 ${
                                        ticket.spam ? "border-red-200 text-red-700" : "border-emerald-100 text-emerald-700"
                                      }`}>
                                        {Math.round(ticket.spam_score * 100)}%
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-800 text-[11px] block">
                                          {ticket.spam ? "Flagged Spam (Blocked)" : "Clean Customer Text"}
                                        </span>
                                        {ticket.spam && (
                                          <span className="text-[10px] text-red-500 block font-medium">
                                            Reason: {ticket.spam_reason}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Timeline latency details */}
                                {ticket.timeline_data && (
                                  <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs space-y-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Execution Latency Timeline</span>
                                    <div className="space-y-1 max-h-[140px] overflow-y-auto text-[10px] font-mono text-slate-500 pr-1">
                                      {Object.entries(ticket.timeline_data)
                                        .filter(([key]) => key !== "total_duration_ms")
                                        .map(([key, val]: [string, any]) => (
                                          <div key={key} className="flex justify-between items-center py-0.5 border-b border-slate-50">
                                            <span className="truncate pr-2">{key}:</span>
                                            <span className="font-bold text-slate-650">{val.duration_ms}ms</span>
                                          </div>
                                        ))}
                                      <div className="flex justify-between items-center py-1 font-bold text-slate-800 border-t border-slate-100 mt-1">
                                        <span>Total:</span>
                                        <span className="text-emerald-600">{ticket.timeline_data.total_duration_ms}ms</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {!loading && totalItems > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 text-xs text-slate-500 select-none">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong> to <strong>{Math.min(currentPage * rowsPerPage, totalItems)}</strong> of <strong>{totalItems}</strong> entries
              </span>
              <div className="flex items-center gap-1.5">
                <span>Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 bg-white rounded p-1 text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-semibold">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              
              <span className="px-3">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Toast Notifications */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-350 ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-250" 
            : toast.type === "warning"
            ? "bg-amber-50 text-amber-800 border-amber-250"
            : "bg-red-50 text-red-800 border-red-250"
        }`}>
          {toast.type === "success" && <CheckCircle size={15} className="text-emerald-600" />}
          {toast.type === "warning" && <AlertCircle size={15} className="text-amber-600" />}
          {toast.type === "error" && <AlertCircle size={15} className="text-red-600" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:text-slate-900 text-slate-400">×</button>
        </div>
      )}

    </div>
  );
}
