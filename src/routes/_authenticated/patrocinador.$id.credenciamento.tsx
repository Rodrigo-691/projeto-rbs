import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { TabGate, Placeholder } from "@/components/TabGate";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/credenciamento")({
  component: () => {
    const { id } = Route.useParams();
    return (
      <TabGate id={id} tab="credenciamento" title="Credenciamento (dezembro)" intro="Cadastro das pessoas que vão trabalhar no evento.">
        <Placeholder text="Em breve: tabela com quantidade e setor de credenciais da sua marca." />
        <Button asChild>
          <a href="https://www.openstaff.com.br" target="_blank" rel="noreferrer">
            Abrir Open Staff <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </TabGate>
    );
  },
});
