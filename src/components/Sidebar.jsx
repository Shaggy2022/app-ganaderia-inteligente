import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Beef, Wheat, DollarSign, TrendingUp, Archive } from "lucide-react";

const menu = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Animales", icon: Beef, path: "/animals" },
  { name: "Alimentación", icon: Wheat, path: "/feeding" },
  { name: "Costos", icon: DollarSign, path: "/costs" },
  { name: "Inventario", icon: Archive, path: "/inventory" },
  { name: "Rentabilidad", icon: TrendingUp, path: "/reporte-financiero" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 h-screen p-6 bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-600 shadow-lg"
    >
      <h1 className="text-3xl font-bold mb-10 text-white tracking-wide">🐄 GanadApp</h1>

      <nav className="flex flex-col gap-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.name} to={item.path}>
              <motion.div
                whileHover={{
                  scale: 1.1,
                  x: 5,
                  transition: { type: "spring", stiffness: 300 },
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer text-white font-medium
                  ${isActive ? "bg-white/20" : "hover:bg-white/10"} shadow-md hover:shadow-xl`}
              >
                <Icon size={20} />
                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}