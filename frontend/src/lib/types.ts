export interface Entities {
  order_id: string;
  amount: string;
  email: string;
  phone: string;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  raw_text: string;
  summary: string;
  language: string;
  translated_text: string;
  cleaned_text: string;
  intent: string;
  sentiment: string;
  priority: string;
  department: string;
  sla_hours: number;
  confidence_score: number;
  human_review_required: boolean;
  out_of_scope: boolean;
  duplicate_ticket: boolean;
  duplicate_ticket_id?: string | null;
  matched_ticket_id?: string | null;
  spam: boolean;
  spam_score: number;
  spam_reason?: string | null;
  retries_count: number;
  reason: string;
  human_intervention?: string;
  human_intervention_reason?: string | null;
  entities: Entities;
  status: string;
  created_at: string;
  timeline_data?: Record<string, any> | null;
}

export interface MetricSummary {
  total_tickets: number;
  critical_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  duplicate_tickets: number;
  duplicate_rate: number;
  spam_tickets_blocked: number;
  failed_ai_requests_recovered: number;
  languages_processed: number;
  average_sla: number;
  human_review_count: number;
  out_of_scope_count: number;
  human_intervention_required_count?: number;
  human_intervention_required_percentage?: number;
}


export interface TrendData {
  date: string;
  total: number;
  duplicates: number;
  spam: number;
  retries: number;
}

export interface SentimentTrendData {
  date: string;
  Positive: number;
  Neutral: number;
  Negative: number;
}

export interface DashboardAnalytics {
  summary: MetricSummary;
  sentiment_breakdown: Record<string, number>;
  intent_distribution: Record<string, number>;
  language_distribution: Record<string, number>;
  department_workload: Record<string, number>;
  priority_distribution: Record<string, number>;
  trends: TrendData[];
  sentiment_trends: SentimentTrendData[];
}
