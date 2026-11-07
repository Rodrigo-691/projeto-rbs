import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MaterialReplies } from "@/components/MaterialReplies";
import type { MediaItem } from "@/lib/media";
import type { MaterialReply } from "@/lib/material-replies";

const api = vi.hoisted(() => ({ insert: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ insert: api.insert }),
  storage: { from: () => ({ upload: api.upload, remove: api.remove }) },
} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
const material: MediaItem = { id: "material-a", sponsor_id: "marca-a", kind: "material", title: "Campanha", body: "Texto", created_at: "2026-11-07", created_by: "cliente", created_by_email: null, channel: null, reach: null, url: null };
beforeEach(() => {
  vi.clearAllMocks();
  api.upload.mockResolvedValue({ error: null });
  api.insert.mockResolvedValue({ error: null });
  api.remove.mockResolvedValue({ error: null });
});
afterEach(cleanup);

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const draw = (replies: MaterialReply[], isAdmin = true) => <QueryClientProvider client={client}><MaterialReplies material={material} replies={replies} viewer={{ isAdmin }} /></QueryClientProvider>;
  const result = render(draw([]));
  fireEvent.click(screen.getByRole("button", { name: "Responder" }));
  fireEvent.change(screen.getByLabelText("Resposta da RBS"), { target: { value: "Veiculação confirmada" } });
  const input = result.container.querySelector('input[type="file"]');
  if (!input) throw new Error("Campo de comprovação ausente");
  fireEvent.change(input, { target: { files: [new File(["prova"], "prova.pdf", { type: "application/pdf" })] } });
  return { ...result, draw };
}

it("envia texto e comprovação juntos e permite leitura pelo patrocinador", async () => {
  const result = setup();
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await waitFor(() => expect(api.insert).toHaveBeenCalledTimes(1));
  const submitted = api.insert.mock.calls[0]?.[0];
  expect(submitted).toMatchObject({ sponsor_id: "marca-a", media_item_id: "material-a", body: "Veiculação confirmada", file_name: "prova.pdf", mime_type: "application/pdf" });
  expect(submitted.storage_path).toMatch(/^marca-a\/comprovacao\//);
  const saved: MaterialReply = { ...submitted, id: "reply", title: "Resposta RBS", created_at: "2026-11-07", created_by: "rbs", created_by_email: "rbs@example.com" };
  result.rerender(result.draw([saved], false));
  expect(screen.getByText("Veiculação confirmada")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Baixar prova.pdf" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Responder" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Excluir resposta RBS" })).not.toBeInTheDocument();
});

it("limpa o upload quando a resposta falha e mantém dados para tentar novamente", async () => {
  api.insert.mockResolvedValueOnce({ error: new Error("Falha") });
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await waitFor(() => expect(api.remove).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText("Resposta da RBS")).toHaveValue("Veiculação confirmada");
  fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));
  await waitFor(() => expect(api.insert).toHaveBeenCalledTimes(2));
});