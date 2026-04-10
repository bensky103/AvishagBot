export type Urgency = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  urgency: Urgency;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact_info: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActionItem {
  id: number;
  issue_report_id: number;
  task_id: number | null;
  description: string;
  is_completed: boolean;
  created_at: string;
}

export interface IssueReport {
  id: number;
  supplier_id: number;
  product_name: string;
  sku: string | null;
  arrival_date: string;
  problem_description: string;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
  action_items: ActionItem[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
}

export interface SupplierCreate {
  name: string;
  contact_info?: string;
  notes?: string;
}

export interface SupplierUpdate {
  name?: string;
  contact_info?: string;
  notes?: string;
}

export interface IssueCreate {
  supplier_id: number;
  product_name: string;
  sku?: string;
  arrival_date: string;
  problem_description: string;
}

export interface IssueUpdate {
  product_name?: string;
  sku?: string;
  problem_description?: string;
  status?: IssueStatus;
}

export interface ActionItemCreate {
  description: string;
  create_task?: boolean;
}
