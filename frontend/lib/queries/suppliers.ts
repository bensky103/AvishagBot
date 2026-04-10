import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliers as api } from "../api";
import type { SupplierCreate, SupplierUpdate } from "../types";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.list(),
  });
}

export function useSupplier(id: number | undefined) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => api.get(id!),
    enabled: id !== undefined && id > 0,
    staleTime: 60 * 1000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierUpdate }) => api.update(id, data),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["suppliers", id] });
    },
  });
}
