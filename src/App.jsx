import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Animals from "./pages/Animals";
import Costs from "./pages/Costs";
import Inventory from "./pages/Inventory";
import ReporteFinanciero from "./pages/ReporteFinanciero";


function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/animals" element={<Animals />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reporte-financiero" element={<ReporteFinanciero />} />
          
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;