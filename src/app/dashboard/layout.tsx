"use client";

import Link from "next/link";
import {
  Bell,
  Home,
  Truck,
  Wrench,
  FileText,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// Mock role, in a real app this would come from session/auth context
const userRole = "gestor"; // can be 'motorista', 'mecanico', 'gestor'

const getMenuItems = (role: string) => {
  const baseItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
  ];
  
  const roleItems: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
    motorista: [
      { href: "/checklist/viagem", label: "Checklist de Viagem", icon: ShieldCheck },
      { href: "/ocorrencias", label: "Ocorrências", icon: Bell },
      { href: "/documentos", label: "Documentos", icon: FileText },
    ],
    gestor: [
      { href: "/veiculos", label: "Veículos", icon: Truck },
      { href: "/manutencoes", label: "Manutenções", icon: Wrench },
      { href: "/usuarios", label: "Usuários", icon: Users },
      { href: "/escalas", label: "Escalas", icon: Calendar },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
    mecanico: [
      { href: "/manutencoes", label: "Manutenções", icon: Wrench },
      { href: "/veiculos", label: "Veículos", icon: Truck },
    ]
  };

  return [...baseItems, ...(roleItems[role] || [])];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const menuItems = getMenuItems(userRole);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r" side="left">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo className="h-8 w-8 text-primary" />
              <h2 className="text-xl font-headline font-semibold">RodoCheck</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/login">
                        <SidebarMenuButton>
                            <LogOut />
                            <span>Sair</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
              {/* Maybe a breadcrumb or search bar here later */}
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            <UserNav />
          </header>
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
