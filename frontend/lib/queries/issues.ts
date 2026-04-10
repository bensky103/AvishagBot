import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { issues as api } from "../api";
import type { ActionItemCreate, IssueCreate, IssueReport, IssueUpdate } from "../types";

export function useIssues(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => api.list(filters),
  });
}

export function useIssue(id: number) {
  return useQuery({
    queryKey: ["issues", id],
    queryFn: () => api.get(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IssueUpdate }) => api.update(id, data),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["issues", id] });
    },
  });
}

export function useResolveIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.resolve(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["issues", id] });
      const prev = qc.getQueryData<IssueReport>(["issues", id]);
      if (prev) {
        qc.setQueryData(["issues", id], { ...prev, status: "resolved" });
      }
      return { prev };
    },
    onError: (_err, id, context) => {
      if (context?.prev) qc.setQueryData(["issues", id], context.prev);
    },
    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["issues", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: number; data: ActionItemCreate }) =>
      api.addActionItem(issueId, data),
    onSettled: (_data, _err, { issueId }) => {
      qc.invalidateQueries({ queryKey: ["issues", issueId] });
    },
  });
}

export function useToggleActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      isCompleted ? api.uncompleteActionItem(id) : api.completeActionItem(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
