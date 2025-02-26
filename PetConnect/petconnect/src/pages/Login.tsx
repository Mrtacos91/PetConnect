import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import supabase from "../supabase"; // Asegúrate de que supabaseClient.ts esté configurado correctamente
import AlertMessage from "../components/AlertMessage";
import "../styles/style.css";

const Login: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("auth-background");
    return () => {
      document.body.classList.remove("auth-background");
    };
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normalizar el email a minúsculas
    const normalizedEmail = email.toLowerCase();

    // Autenticamos al usuario con Supabase Auth
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInError) {
      setAlert({ type: "error", message: signInError.message });
      return;
    }

    // Verificamos que el usuario exista en la tabla "users"
    const { data: userData, error: userError } = await supabase
      .from("Users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (userError || !userData) {
      setAlert({
        type: "error",
        message: "El usuario no se encuentra registrado en la base de datos.",
      });
      return;
    }

    // Si todo es correcto, mostramos un mensaje de éxito y redirigimos
    setAlert({ type: "success", message: "Inicio de sesión exitoso!" });
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
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
