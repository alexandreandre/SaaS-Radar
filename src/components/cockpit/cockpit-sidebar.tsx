"use client";

import { PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resolveNavForOpportunity,
  type CockpitModuleDef,
  type CockpitModuleId,
} from "@/lib/cockpit-modules";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitAlert } from "@/lib/cockpit-alerts";
import { CockpitProjectIdentity } from "@/components/cockpit/cockpit-project-identity";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CockpitSidebarProps = {
  activeModule: CockpitModuleId;
  onModuleChange: (module: CockpitModuleId) => void;
  alerts: CockpitAlert[];
  opportunity?: Opportunity;
  project?: UserProject;
  allowedModules?: CockpitModuleId[];
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  showCollapseToggle?: boolean;
};

function ModuleButton({
  mod,
  active,
  count,
  onModuleChange,
  collapsed = false,
  featured = false,
}: {
  mod: CockpitModuleDef;
  active: boolean;
  count: number;
  onModuleChange: (module: CockpitModuleId) => void;
  collapsed?: boolean;
  featured?: boolean;
}) {
  const Icon = mod.icon;

  const button = (
    <button
      type="button"
      onClick={() => onModuleChange(mod.id)}
      aria-label={collapsed ? mod.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-lg text-left text-sm transition-colors",
        collapsed ? "w-full justify-center px-2 py-2.5" : "w-full gap-3 px-3 py-2",
        active
          ? cn(
              "bg-primary/10 text-primary",
              featured ? "font-semibold" : "font-medium"
            )
          : featured
            ? "font-semibold text-foreground hover:bg-background/80"
            : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{mod.label}</span>
          {count > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-800">
              {count}
            </span>
          ) : null}
        </>
      ) : count > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-medium text-white">
          {count}
        </span>
      ) : null}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{button}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {mod.label}
          {count > 0 ? ` (${count})` : ""}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function NavSection({
  label,
  children,
  collapsed = false,
  className,
}: {
  label: string;
  children: React.ReactNode;
  collapsed?: boolean;
  className?: string;
}) {
  if (collapsed) {
    return (
      <div className={cn("space-y-0.5", className)}>
        <Separator className="my-2" />
        {children}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-muted/25",
        className
      )}
    >
      <div className="border-b border-border/60 bg-muted/40 px-3 py-2.5">
        <p className="font-data text-[11px] font-semibold uppercase tracking-data text-foreground/75">
          {label}
        </p>
      </div>
      <div className="space-y-0.5 p-1.5">{children}</div>
    </section>
  );
}

export function CockpitSidebar({
  activeModule,
  onModuleChange,
  alerts,
  opportunity,
  project,
  allowedModules,
  collapsed = false,
  onCollapsedChange,
  showCollapseToggle = true,
}: CockpitSidebarProps) {
  const nav = resolveNavForOpportunity(opportunity, allowedModules, project);

  const alertCountByModule = alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.actionModule] = (acc[alert.actionModule] ?? 0) + 1;
    return acc;
  }, {});

  const renderModule = (mod: CockpitModuleDef, featured = false) => (
    <ModuleButton
      key={mod.id}
      mod={mod}
      active={activeModule === mod.id}
      count={alertCountByModule[mod.id] ?? 0}
      onModuleChange={onModuleChange}
      collapsed={collapsed}
      featured={featured}
    />
  );

  const navContent = (
    <nav className={cn("flex flex-col", collapsed ? "gap-2" : "gap-4")}>
      {nav.overview ? (
        <section
          className={cn(
            collapsed
              ? "space-y-0.5"
              : "rounded-xl border border-border/80 bg-card p-1.5 shadow-sm"
          )}
        >
          {renderModule(nav.overview, true)}
        </section>
      ) : null}

      {nav.projet.modules.length > 0 ? (
        <NavSection label={nav.projet.label} collapsed={collapsed}>
          {nav.projet.modules.map((mod) => renderModule(mod))}
        </NavSection>
      ) : null}

      {nav.pilotage.modules.length > 0 ? (
        <NavSection label={nav.pilotage.label} collapsed={collapsed}>
          {nav.pilotage.modules.map((mod) => renderModule(mod))}
        </NavSection>
      ) : null}
    </nav>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {project && opportunity ? (
          <CockpitProjectIdentity
            project={project}
            opportunity={opportunity}
            collapsed={collapsed}
          />
        ) : null}

        <div className="min-h-0 flex-1">{navContent}</div>

        {showCollapseToggle && onCollapsedChange ? (
          <div className={cn("mt-4 shrink-0", collapsed ? "px-0" : "px-1")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onCollapsedChange(!collapsed)}
                  aria-label={collapsed ? "Déplier la navigation" : "Replier la navigation"}
                  className={cn(
                    "flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground",
                    collapsed
                      ? "mx-auto h-9 w-9 justify-center"
                      : "w-full gap-3 px-3 py-2"
                  )}
                >
                  {collapsed ? (
                    <PanelLeft className="h-4 w-4 shrink-0" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4 shrink-0" />
                      <span>Réduire</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed ? (
                <TooltipContent side="right">Déplier la navigation</TooltipContent>
              ) : null}
            </Tooltip>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
