import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import supabase from "../supabase";
import AlertMessage from "../components/AlertMessage";
import "../styles/style.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  // 🔹 Aplica los estilos correctos al cargar la pantalla de login
  useEffect(() => {
    document.body.classList.add("auth-background");

    return () => {
      document.body.classList.remove("auth-background");
    };
  }, []);

  // 🔹 Verificar si hay una sesión activa y redirigir al Dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigate("/dashboard");
      }
    };

    checkSession();

    // 🔹 Detectar cambios en la sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          navigate("/dashboard");
        } else if (event === "SIGNED_OUT") {
          navigate("/login"); // 🔹 Solo redirige sin recargar
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // 🔹 Inicio de sesión con email y contraseña
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setAlert({ type: "error", message: error.message });
      return;
    }

    setAlert({ type: "success", message: "Inicio de sesión exitoso!" });

    // No es necesario un timeout, `useEffect` redirigirá automáticamente
  };

  // 🔹 Inicio de sesión con Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setAlert({
        type: "error",
        message: "Error al iniciar sesión con Google",
      });
    }
  };

  return (
    <div className="login-container">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      <form className="login-box" onSubmit={handleLogin} autoComplete="off">
        <h2>Bienvenido a PetConnect</h2>

        <div className="input-container">
          <input
            type="email"
            name="email"
            placeholder=""
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label>Ingresa tu email</label>
        </div>

        <div className="input-container password-container">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder=""
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Ingresa tu contraseña</label>
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </span>
        </div>

        <button type="submit">Iniciar sesión</button>

        {/* 🔹 Botón para iniciar sesión con Google */}
        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
        >
          <img src="../google-icon.png" alt="Google" className="google-icon" />
          Iniciar sesión con Google
        </button>

        <p>
          ¿No tienes una cuenta?{" "}
          <button
            type="button"
            className="link"
            onClick={() => navigate("/register")}
          >
            Registrate
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
