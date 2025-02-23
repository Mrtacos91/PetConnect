import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi"; // Importamos los iconos de React Icons
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
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar la contraseña
  const navigate = useNavigate(); // Hook para la navegación

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
    navigate("/dashboard"); // Redirige a Dashboard
  };

  return (
    <div className="login-container">
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
            type={showPassword ? "text" : "password"} // Cambia entre texto y contraseña
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
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}{" "}
            {/* Ícono de ojo */}
          </span>
        </div>

        <button type="submit">Iniciar sesión</button>

        <p>
          ¿No tienes una cuenta?{" "}
          <span className="link" onClick={() => navigate("/register")}>
            <button type="submit">Registrate</button>
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
