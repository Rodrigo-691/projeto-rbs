import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Panel } from "@/components/Panel";
import { TabGate, Placeholder } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/credenciamento")({
  head: () => portalHead("Credenciamento", "Credenciamento da equipe do patrocinador no Planeta Atlântida."),
  component: () => {
    const { id } = Route.useParams();
    return (
      <TabGate id={id} tab="credenciamento" title="Credenciamento (dezembro)" intro="Cadastro das pessoas que vão trabalhar no evento.">
        <Panel
          title="Plataforma Open Staff"
          description="O cadastro nominal da equipe de montagem, operação e ativação é realizado diretamente no sistema oficial de credenciamento."
          actions={
            <Button asChild>
              <a href="https://www.openstaff.com.br" target="_blank" rel="noreferrer">
                Abrir Open Staff <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          }
        >
          <Placeholder text="Em breve: tabela com quantidade e setor de credenciais da sua marca." />
        </Panel>
      </TabGate>
    );
  },
});
