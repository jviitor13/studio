
"use client";

import Link from "next/link";
import {
  Home,
  Truck,
  Wrench,
  FileText,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  ShieldCheck,
  ListChecks,
  CircleDot,
  ClipboardCheck,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

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
      { href: "/consultas", label: "Consultas", icon: Search },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/escalas", label: "Escalas", icon: Calendar },
      { href: "/manutencoes", label: "Manutenções", icon: Wrench },
      { href: "/checklist-templates", label: "Modelos de Checklist", icon: ListChecks },
      { href: "/checklist/manutencao", label: "Checklist de Manutenção", icon: ClipboardCheck },
      { href: "/veiculos", label: "Veículos", icon: Truck },
      { href: "/pneus", label: "Gestão de Pneus", icon: CircleDot },
      { href: "/usuarios", label: "Usuários", icon: Users },
    ],
    mecanico: [
      { href: "/manutencoes", label: "Manutenções", icon: Wrench },
      { href: "/checklist/manutencao", label: "Checklist de Manutenção", icon: ClipboardCheck },
      { href: "/veiculos", label: "Veículos", icon: Truck },
    ]
  };

  const combined = [...baseItems, ...(roleItems[role] || [])];
  // Remove duplicates just in case
  return combined.filter((item, index, self) => 
    index === self.findIndex((t) => t.href === item.href)
  );
};


const getBottomNavItems = (role: string) => {
    const commonItems = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/checklist/viagem", label: "Checklists", icon: ShieldCheck },
    ];

    const gestorItems = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/checklist/viagem", label: "Checklist", icon: ShieldCheck },
        { href: "/veiculos", label: "Frota", icon: Truck },
        { href: "/consultas", label: "Busca", icon: Search },
        { href: "/usuarios", label: "Perfil", icon: Users },
    ];
    
    // Example for other roles, can be customized
    const motoristaItems = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/checklist/viagem", label: "Checklist", icon: ShieldCheck },
        { href: "/veiculos", label: "Veículo", icon: Truck },
        { href: "/ocorrencias", label: "Ocorrências", icon: Bell },
        { href: "/usuarios", label: "Perfil", icon: Users },
    ];

    if (role === 'gestor') return gestorItems;
    if (role === 'motorista') return motoristaItems;
    
    return commonItems;
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const menuItems = getMenuItems(userRole);
  const bottomNavItems = getBottomNavItems(userRole);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40 flex-col md:flex-row">
        
        <Sidebar className="border-r hidden md:flex" side="left">
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2 p-2">
              <Logo className="h-8 w-8 text-primary" />
              <h2 className="text-xl font-headline font-semibold">RodoCheck</h2>
            </Link>
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
          <AppHeader menuItems={menuItems} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
          <BottomNav items={bottomNavItems} />
        </div>
      </div>
    </SidebarProvider>
  );
}
