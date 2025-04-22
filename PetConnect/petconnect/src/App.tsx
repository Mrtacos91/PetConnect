import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customise from "./pages/Customise";
import CarnetPage from "./pages/CarnetPage";
import Calendar from "./pages/Calendar";
import Recardatorios from "./pages/Recardatorios";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/customise" element={<Customise />} />
          <Route path="/carnet" element={<CarnetPage />} />
          <Route path="/recordatorios" element={<Recardatorios />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
