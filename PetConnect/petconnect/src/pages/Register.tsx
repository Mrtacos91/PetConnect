import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";

const Register: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("auth-background");
    return () => {
      document.body.classList.remove("auth-background");
    };
  }, []);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate(); // Hook de navegación

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    console.log("Datos de registro:", formData);
    navigate("/login"); // Redirige a Login
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit} autoComplete="off">
        <h2>Join PetConnect</h2>

        <div className="input-container">
          <input
            type="text"
            name="fullName"
            required
            placeholder=""
            value={formData.fullName}
            onChange={handleChange}
          />
          <label>Nombre</label>
        </div>

        <div className="input-container">
          <input
            type="email"
            name="email"
            placeholder=""
            required
            value={formData.email}
            onChange={handleChange}
          />
          <label>Correo electrónico</label>
        </div>

        <div className="input-container">
          <input
            type="text"
            name="phone"
            placeholder=""
            required
            value={formData.phone}
            onChange={handleChange}
          />
          <label>Teléfono</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            name="password"
            placeholder=""
            required
            value={formData.password}
            onChange={handleChange}
          />
          <label>Contraseña</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            name="confirmPassword"
            placeholder=""
            required
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <label>Confirma tu contraseña</label>
        </div>

        <button type="submit">Crear cuenta</button>

        <p>
          ¿Ya tienes una cuenta?{" "}
          <button
            type="button"
            className="link"
            onClick={() => navigate("/login")}
          >
            Inicia Sesion
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register;
