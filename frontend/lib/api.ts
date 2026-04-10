const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = options?.body
    ? { "Content-Type": "application/json", ...options?.headers }
    : { ...options?.headers };
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Tasks
export const tasks = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").Task[]>(`/tasks/${qs}`);
  },
  get: (id: number) => request<import("./types").Task>(`/tasks/${id}`),
  create: (data: import("./types").TaskCreate) =>
    request<import("./types").Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").TaskUpdate) =>
    request<import("./types").Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  complete: (id: number) =>
    request<import("./types").Task>(`/tasks/${id}/complete`, { method: "POST" }),
  reopen: (id: number) =>
    request<import("./types").Task>(`/tasks/${id}/reopen`, { method: "POST" }),
};

// Suppliers
export const suppliers = {
  list: () => request<import("./types").Supplier[]>("/suppliers/"),
  get: (id: number) => request<import("./types").Supplier>(`/suppliers/${id}`),
  create: (data: import("./types").SupplierCreate) =>
    request<import("./types").Supplier>("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").SupplierUpdate) =>
    request<import("./types").Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// Issues
export const issues = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<import("./types").IssueReport[]>(`/issues/${qs}`);
  },
  get: (id: number) => request<import("./types").IssueReport>(`/issues/${id}`),
  create: (data: import("./types").IssueCreate) =>
    request<import("./types").IssueReport>("/issues/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: import("./types").IssueUpdate) =>
    request<import("./types").IssueReport>(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resolve: (id: number) =>
    request<import("./types").IssueReport>(`/issues/${id}/resolve`, { method: "POST" }),
  reopen: (id: number) =>
    request<import("./types").IssueReport>(`/issues/${id}/reopen`, { method: "POST" }),
  addActionItem: (issueId: number, data: import("./types").ActionItemCreate) =>
    request<import("./types").ActionItem>(`/issues/${issueId}/action-items`, { method: "POST", body: JSON.stringify(data) }),
  completeActionItem: (actionItemId: number) =>
    request<import("./types").ActionItem>(`/issues/action-items/${actionItemId}/complete`, { method: "POST" }),
  uncompleteActionItem: (actionItemId: number) =>
    request<import("./types").ActionItem>(`/issues/action-items/${actionItemId}/uncomplete`, { method: "POST" }),
};
