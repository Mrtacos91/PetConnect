import { Bell, Home, BarChart, Settings } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="flex justify-between p-4 bg-white shadow-md fixed bottom-0 w-full">
      <Home className="text-gray-500" />
      <BarChart className="text-gray-500" />
      <Settings className="text-gray-500" />
      <Bell className="text-gray-500" />
    </nav>
  );
};
