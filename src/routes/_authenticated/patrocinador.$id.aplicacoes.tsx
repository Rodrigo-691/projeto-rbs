import { createFileRoute } from "@tanstack/react-router";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { portalHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/aplicacoes")({
  head: () => portalHead("Aplicações de marca", "Identidade visual e comprovação das aplicações da marca no Planeta Atlântida."),
  component: () => {
    const { id } = Route.useParams();
    return (
      <TabGate id={id} tab="aplicacoes" title="Aplicações de marca no evento" intro="Envie o MIV e a logo. Após o festival, a RBS sobe as fotos que comprovam a marca aplicada.">
        <FileSection sponsorId={id} tab="aplicacoes" category="miv" title="MIV (manual de identidade visual)" uploader="all" />
        <FileSection sponsorId={id} tab="aplicacoes" category="logo" title="Logo" uploader="all" />
        <FileSection sponsorId={id} tab="aplicacoes" category="fotos_comprovacao" title="Fotos de comprovação" description="Enviadas pela RBS após o evento." uploader="admin" />
      </TabGate>
    );
  },
});
