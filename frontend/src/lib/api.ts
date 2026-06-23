import { Ticket, DashboardAnalytics } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function triageTicket(text: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/api/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to run triage analysis");
  }
  return response.json();
}

export async function processBulk(texts: string[]): Promise<Ticket[]> {
  const ticketsPayload = texts.map((t) => ({ text: t }));
  const response = await fetch(`${API_BASE}/api/tickets/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickets: ticketsPayload }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to process bulk upload");
  }
  return response.json();
}

export async function getTickets(filters: Record<string, string> = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val) params.append(key, val);
  });
  
  const response = await fetch(`${API_BASE}/api/tickets?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return response.json();
}

export async function getTicketDetail(ticketId: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch ticket details");
  }
  return response.json();
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete ticket");
  }
}

export async function seedTickets(): Promise<Ticket[]> {
  const response = await fetch(`${API_BASE}/api/tickets/seed`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to seed sample tickets");
  }
  return response.json();
}

export async function clearTickets(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/tickets/clear`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to clear database");
  }
}

export async function getAnalytics(): Promise<DashboardAnalytics> {
  const response = await fetch(`${API_BASE}/api/analytics`);
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
}

export function getExportJsonUrl(): string {
  return `${API_BASE}/api/tickets/export/json`;
}

export function getExportCsvUrl(): string {
  return `${API_BASE}/api/tickets/export/csv`;
}
