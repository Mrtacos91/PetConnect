import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/global.css";
import Loader from "./components/Loader";
import Customise from "./pages/Customise";
import Nfc from "./pages/Nfc";

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
const Account = lazy(() => import("./pages/micuenta"));

// Loading component for Suspense fallback
const LoadingFallback = () => <Loader />;

const App: React.FC = () => {
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
            path="/calendar"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </Suspense>
            }
          />
          <Route path="/customise" element={<Customise />} />
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
            path="/micuenta"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Account />
              </Suspense>
            }
          />
        </Route>
        <Route path="/nfc" element={<Nfc />} />
      </Routes>
    </Router>
  );
};

export default App;
