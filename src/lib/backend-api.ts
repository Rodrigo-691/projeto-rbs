import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export interface BackendHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface SponsorPayload {
  id?: string;
  name: string;
  quota: "MASTER" | "SUBCOTA_G" | "SUBCOTA";
  segment?: string | null;
  cnpj?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface MediaImportResult {
  success: boolean;
  rowsProcessed: number;
  rowsImported: number;
  warnings: string[];
  errors: string[];
}

export interface SponsorRowError {
  rowNumber: number;
  sponsorName: string;
  cnpj: string;
  errorMessage: string;
}

export interface SponsorBatchImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdSponsors: SponsorPayload[];
  errors: SponsorRowError[];
}

/**
 * Retorna os headers de autenticação com o Bearer token do Supabase.
 */
export async function getAuthHeaders(extraHeaders: Record<string, string> = {}): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

/**
 * Verifica se a API Java (Spring Boot) está ativa e acessível.
 */
export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as BackendHealth;
  } catch {
    return null;
  }
}

/**
 * Envia uma planilha Excel (.xlsx) com múltiplos patrocinadores para cadastro em lote via Apache POI no backend Java.
 */
export async function importSponsorsSpreadsheet(file: File): Promise<SponsorBatchImportResult> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/sponsors/import-excel`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Falha ao importar planilha de patrocinadores (Status ${res.status})`);
  }

  return (await res.json()) as SponsorBatchImportResult;
}

/**
 * Envia uma planilha Excel (.xlsx) de veiculações para processamento via Apache POI no backend Java.
 */
export async function importMediaSpreadsheet(file: File): Promise<MediaImportResult> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/media/import-excel`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Falha ao importar planilha (Status ${res.status})`);
  }

  return (await res.json()) as MediaImportResult;
}

/**
 * Lista patrocinadores através do backend Java.
 */
export async function fetchSponsorsFromBackend(search?: string, quota?: string) {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (quota) params.set("quota", quota);

  const url = `${API_BASE}/sponsors${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erro ao listar patrocinadores: ${res.statusText}`);
  return await res.json();
}

/**
 * Cadastra novo patrocinador através do backend Java.
 */
export async function createSponsorInBackend(payload: SponsorPayload) {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const res = await fetch(`${API_BASE}/sponsors`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Erro ao cadastrar patrocinador.");
  }
  return await res.json();
}
