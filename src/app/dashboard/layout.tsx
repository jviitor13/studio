
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
  Bell,
  Settings,
  Package,
  MapPin,
} from "lucide-react";
import { Logo, ShipWheel } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

// Mock role, in a real app this would come from session/auth context
const userRole = "gestor"; // can be 'motorista', 'mecanico', 'gestor'

const getMenuItems = (role: string) => {
  const baseItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, group: 'home' },
  ];
  
  const roleItems: Record<string, { href: string; label: string; icon: React.ElementType, group: string }[]> = {
    motorista: [
      { href: "/carga", label: "Controle de Carga", icon: Package, group: 'operacao' },
      { href: "/ocorrencias", label: "Registrar Ocorrência", icon: Bell, group: 'operacao' },
      { href: "/consultas", label: "Consultar Checklists", icon: Search, group: 'gerenciamento' },
      { href: "/documentos", label: "Meus Documentos", icon: FileText, group: 'gerenciamento' },
    ],
    gestor: [
      // Operação
      { href: "/checklist/manutencao", label: "Checklist de Manutenção", icon: ClipboardCheck, group: 'operacao' },
      { href: "/carga", label: "Controle de Carga", icon: Package, group: 'operacao' },
      { href: "/consultas", label: "Consultar Checklists", icon: Search, group: 'operacao' },
      { href: "/posicao-frota", label: "Posição da Frota", icon: ShipWheel, group: 'operacao' },
      // Gerenciamento
      { href: "/manutencoes", label: "Manutenções", icon: Wrench, group: 'gerenciamento' },
      { href: "/pneus", label: "Pneus", icon: CircleDot, group: 'gerenciamento' },
      { href: "/relatorios", label: "Gerar Relatórios", icon: BarChart3, group: 'gerenciamento' },
      { href: "/veiculos", label: "Veículos", icon: Truck, group: 'gerenciamento' },
      // Cadastros e Configurações
      { href: "/checklist-templates", label: "Modelos de Checklist", icon: ListChecks, group: 'cadastros' },
      { href: "/usuarios", label: "Usuários", icon: Users, group: 'cadastros' },
    ],
    mecanico: [
      { href: "/checklist/manutencao", label: "Checklist de Manutenção", icon: ClipboardCheck, group: 'operacao' },
      { href: "/manutencoes", label: "Ordens de Serviço", icon: Wrench, group: 'operacao' },
      { href: "/pneus/manutencao", label: "Manutenção de Pneus", icon: CircleDot, group: 'operacao' },
      { href: "/consultas", label: "Consultar Checklists", icon: Search, group: 'gerenciamento' },
      { href: "/veiculos", label: "Veículos", icon: Truck, group: 'gerenciamento' },
    ]
  };

  const selectedRoleItems = roleItems[role] || [];
  
  const sortedItems = selectedRoleItems.sort((a, b) => a.label.localeCompare(b.label));

  return [...baseItems, ...sortedItems];
};


const getBottomNavItems = (role: string) => {
    const gestorItems = [
        { href: "/dashboard", label: "Início", icon: Home },
        { href: "/posicao-frota", label: "Frota", icon: ShipWheel },
        { href: "/carga", label: "Carga", icon: Package },
        { href: "/consultas", label: "Busca", icon: Search },
        { href: "/manutencoes", label: "Serviços", icon: Wrench },
    ];
    
    const motoristaItems = [
        { href: "/dashboard", label: "Início", icon: Home },
        { href: "/checklist/manutencao", label: "Checklist", icon: ClipboardCheck },
        { href: "/carga", label: "Carga", icon: Package },
        { href: "/ocorrencias", label: "Ocorrências", icon: Bell },
        { href: "/documentos", label: "Docs", icon: FileText },
    ];

    const mecanicoItems = [
        { href: "/dashboard", label: "Início", icon: Home },
        { href: "/checklist/manutencao", label: "Checklist", icon: ClipboardCheck },
        { href: "/pneus/manutencao", label: "Pneus", icon: CircleDot },
        { href: "/manutencoes", label: "Serviços", icon: Wrench },
        { href: "/consultas", label: "Busca", icon: Search },
    ];

    if (role === 'gestor') return gestorItems;
    if (role === 'motorista') return motoristaItems;
    return mecanicoItems;
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const menuItems = getMenuItems(userRole);
  const bottomNavItems = getBottomNavItems(userRole);

  const renderMenuItems = (items: ReturnType<typeof getMenuItems>) => {
    const grouped = items.reduce((acc, item) => {
      acc[item.group] = acc[item.group] || [];
      acc[item.group].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    return (
      <>
        {/* Home */}
        {grouped['home']?.map(item => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        ))}
        <SidebarSeparator />
        
        {/* Operação */}
        {grouped['operacao'] && (
            <SidebarGroup>
                <SidebarGroupLabel>Operação</SidebarGroupLabel>
                {grouped['operacao'].map(item => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarGroup>
        )}
        
        {/* Gerenciamento */}
        {grouped['gerenciamento'] && (
            <SidebarGroup>
                <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
                {grouped['gerenciamento'].map(item => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarGroup>
        )}

        {/* Cadastros */}
         {grouped['cadastros'] && (
            <SidebarGroup>
                <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
                {grouped['cadastros'].map(item => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarGroup>
        )}
      </>
    );
  }

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
              {renderMenuItems(menuItems)}
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
