import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { PortalAccount, PortalBrand } from "@/components/PortalHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Shared classes so every sidebar link (admin and sponsor) reads the same. */
export const navItemClass =
  "group flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-muted transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0";
export const navItemActiveClass =
  "bg-sidebar-accent font-medium text-sidebar-accent-foreground [&_svg]:text-brand";

export function NavGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      {label && <p className="text-sidebar-muted px-3 pb-1 pt-2 text-xs">{label}</p>}
      {children}
    </div>
  );
}

function SidebarBody({ nav }: { nav: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <PortalBrand />
      </div>
      <nav aria-label="Navegação principal" className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {nav}
      </nav>
      <div className="border-sidebar-border border-t px-4 py-3">
        <PortalAccount />
      </div>
    </div>
  );
}

/**
 * Signed-in frame: graphite sidebar on desktop, top bar with a drawer on small screens.
 * `nav` holds the screen's navigation; `mobileTitle` names the context in the top bar.
 */
export function AppShell({ nav, mobileTitle, children }: { nav: ReactNode; mobileTitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody nav={nav} />
      </aside>

      <header className="bg-sidebar text-sidebar-foreground sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring -ml-1.5 grid h-9 w-9 cursor-pointer place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              aria-describedby={undefined}
              className="bg-sidebar text-sidebar-foreground border-sidebar-border w-72 p-0 sm:max-w-72 [&>button]:text-sidebar-muted [&>button]:right-3 [&>button]:top-5"
              onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarBody nav={nav} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            {mobileTitle ? <p className="truncate text-[15px] font-semibold">{mobileTitle}</p> : <PortalBrand compact />}
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
