import type { ReactNode } from 'react';

import { LogOut } from 'lucide-react';
import {
  Sidebar,
  Tooltip,
  IconButton,
  SidebarMenu,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarTrigger,
  TooltipContent,
  TooltipTrigger,
  SidebarMenuItem,
  SidebarProvider,
  SidebarMenuButton,
} from '@bhubai/bhub-design-system';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';

import { useAuthContext } from 'src/auth/context';

import { navData } from '../nav-config-dashboard';

// ----------------------------------------------------------------------

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const { signOut, user } = useAuthContext();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
            <Logo isSingle className="size-8" />
            <span className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              SPED RPA
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2 py-2">
            {navData.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <RouterLink href={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center justify-between gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
            <span className="truncate text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {user?.email}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton aria-label="Sair" variant="ghost" size="sm" onClick={signOut}>
                  <LogOut />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
        </header>

        <main className="flex min-w-0 flex-1 flex-col overflow-auto bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
