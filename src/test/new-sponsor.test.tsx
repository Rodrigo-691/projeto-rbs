import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewSponsor } from "@/components/NewSponsor";

const api = vi.hoisted(() => ({
  sponsorInsert: vi.fn(), fileInsert: vi.fn(), upload: vi.fn(), remove: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => table === "sponsors" ? {
      insert: (data: unknown) => { api.sponsorInsert(data); return { select: () => ({ single: async () => ({ data: { id: "sponsor-new" }, error: null }) }) }; },
    } : { insert: api.fileInsert },
    storage: { from: () => ({ upload: api.upload, remove: api.remove }) },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function openForm() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><NewSponsor /></QueryClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar novo patrocinador" }));
  fireEvent.change(screen.getByLabelText("Nome da marca"), { target: { value: "Marca Teste" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.upload.mockResolvedValue({ error: null });
  api.fileInsert.mockResolvedValue({ error: null });
  api.remove.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe("New sponsor registration", () => {
  it("saves profile data and attaches the commercial plan to the same sponsor", async () => {
    openForm();
    fireEvent.change(screen.getByLabelText("Cota"), { target: { value: "master" } });
    fireEvent.change(screen.getByLabelText("CNPJ"), { target: { value: "12.345.678/0001-90" } });
    fireEvent.change(screen.getByLabelText("Segmento"), { target: { value: "Alimentos" } });
    fireEvent.change(screen.getByLabelText("Contato principal"), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "51999999999" } });
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Plano anual" } });
    const file = new File(["plano"], "plano.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Plano comercial"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar patrocinador" }));
    await waitFor(() => expect(api.fileInsert).toHaveBeenCalledWith(expect.objectContaining({
      sponsor_id: "sponsor-new", category: "plano_comercial", tab: "perfil", file_name: "plano.pdf",
    })));
    expect(api.sponsorInsert).toHaveBeenCalledWith({ name: "Marca Teste", quota: "master", cnpj: "12.345.678/0001-90", segment: "Alimentos", contact_name: "Maria", contact_phone: "51999999999", notes: "Plano anual" });
    expect(api.upload.mock.calls[0]?.[0]).toMatch(/^sponsor-new\/plano_comercial\//);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not duplicate a sponsor when retrying a failed plan upload", async () => {
    api.upload.mockResolvedValueOnce({ error: new Error("Falha no envio") });
    openForm();
    fireEvent.change(screen.getByLabelText("Plano comercial"), { target: { files: [new File(["pdf"], "plano.pdf", { type: "application/pdf" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar patrocinador" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await waitFor(() => expect(api.fileInsert).toHaveBeenCalledTimes(1));
    expect(api.sponsorInsert).toHaveBeenCalledTimes(1);
    expect(api.upload).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("allows registration without a commercial-plan attachment", async () => {
    openForm();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar patrocinador" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.sponsorInsert).toHaveBeenCalledTimes(1);
    expect(api.upload).not.toHaveBeenCalled();
  });
});