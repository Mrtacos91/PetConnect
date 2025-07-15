import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";
import Loader from "./components/Loader";
import Customise from "./pages/Customise";
import Nfc from "./pages/Nfc";
import PublicPet from "./pages/PublicPet";
import Shop from "./pages/Shop";

// Lazy load page components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CarnetPage = lazy(() => import("./pages/CarnetPage"));
const Recardatorios = lazy(() => import("./pages/Recardatorios"));
const Config = lazy(() => import("./pages/Config"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Micuenta = lazy(() => import("./pages/Micuenta"));
const PetHealthControl = lazy(() => import("./pages/PetHealthControl"));

// Loading component for Suspense fallback
const LoadingFallback = () => <Loader />;

const App: React.FC = () => {
  // Asegura que el tema se aplique correctamente al recargar
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ChangePassword />
            </Suspense>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/pet-health"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PetHealthControl />
              </Suspense>
            }
          />
          <Route
            path="/calendar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </Suspense>
            }
          />
          <Route
            path="/customise"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Customise />
              </Suspense>
            }
          />
          <Route
            path="/carnet"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CarnetPage />
              </Suspense>
            }
          />
          <Route
            path="/recordatorios"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Recardatorios />
              </Suspense>
            }
          />
          <Route
            path="/config"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Config />
              </Suspense>
            }
          />
          <Route
            path="/Micuenta"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Micuenta />
              </Suspense>
            }
          />
          <Route
            path="/nfc"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Nfc />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/shop"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Shop />
            </Suspense>
          }
        />
        {/* Ruta pública para ver la placa */}
        <Route
          path="/public/pet/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PublicPet />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
