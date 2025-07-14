
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { usePathname } from "next/navigation";
import { BottomNavItem } from "./bottom-nav";

const getTitleFromPath = (path: string, menuItems: BottomNavItem[]) => {
    const item = menuItems.find(i => i.href === path);
    if(item) return item.label;

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    const lastSegment = segments[segments.length - 1];
    
    // Capitalize and replace dashes
    const formattedTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');

    // Handle special cases if necessary
    if(formattedTitle === 'Pneus visualizacao') return 'Visualização de Pneus';
    
    return formattedTitle;
}

export function AppHeader({ menuItems }: { menuItems: BottomNavItem[] }) {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname, menuItems);

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-primary px-4 text-primary-foreground lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" />
        <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
      </div>
      <h1 className="text-lg font-semibold md:hidden absolute left-1/2 -translate-x-1/2">{title}</h1>
      <div className="flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  );
}
