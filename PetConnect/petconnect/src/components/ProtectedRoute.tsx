import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import supabase from "../supabase";
import Loader from "../components/Loader";

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    // You can replace this with a loading spinner or component
    return <Loader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
