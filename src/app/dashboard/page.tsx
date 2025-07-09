"use client";

import { ManagerDashboard } from "@/components/dashboards/manager-dashboard";
import { DriverDashboard } from "@/components/dashboards/driver-dashboard";
import { MechanicDashboard } from "@/components/dashboards/mechanic-dashboard";

// In a real app, this would be determined from the user's session
const useUserRole = () => {
  return "gestor"; // Switch between 'gestor', 'motorista', 'mecanico' to test
};

export default function DashboardPage() {
  const role = useUserRole();

  const renderDashboard = () => {
    switch (role) {
      case "gestor":
        return <ManagerDashboard />;
      case "motorista":
        return <DriverDashboard />;
      case "mecanico":
        return <MechanicDashboard />;
      default:
        return <div>Papel de usuário desconhecido.</div>;
    }
  };

  return <div className="w-full">{renderDashboard()}</div>;
}
