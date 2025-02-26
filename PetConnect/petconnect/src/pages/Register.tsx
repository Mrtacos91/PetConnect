import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase"; // Importamos el cliente de Supabase
import bcrypt from "bcryptjs"; // Importamos bcryptjs para hashear la contraseña
import "../styles/style.css";

const Register: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("auth-background");
    return () => {
      document.body.classList.remove("auth-background");
    };
  }, []);

  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate(); // Hook de navegación

  // Manejo de cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Hashear la contraseña con bcryptjs
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(formData.password, salt);

    // Registrar al usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
        },
      },
    });

    if (error) {
      alert(`Error al crear la cuenta: ${error.message}`);
      return;
    }

    // Obtenemos el id del usuario creado (si existe)
    const userId = data?.user?.id;
    if (!userId) {
      alert("Error: No se pudo obtener el ID del usuario");
      return;
    }

    // Insertar la información en la tabla 'users'
    const { error: insertError } = await supabase.from("Users").insert([
      {
        // Suponemos que la columna 'id' se genera automáticamente
        email: formData.email,
        password_hash: hashedPassword,
        full_name: formData.fullName,
        phone: formData.phone,
      },
    ]);

    if (insertError) {
      alert(`Error al guardar el perfil: ${insertError.message}`);
    } else {
      alert("Registro exitoso! Revisa tu correo para verificar tu cuenta.");
      navigate("/login"); // Redirige al login
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit} autoComplete="off">
        <h2>Unete a Petconnect</h2>

        <div className="input-container">
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder=""
          />
          <label>Nombre</label>
        </div>

        <div className="input-container">
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder=""
          />
          <label>Correo electrónico</label>
        </div>

        <div className="input-container">
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder=""
          />
          <label>Teléfono</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder=""
          />
          <label>Contraseña</label>
        </div>

        <div className="input-container">
          <input
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder=""
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
            Inicia Sesión
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register;
