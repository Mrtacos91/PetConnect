import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase"; // Cliente de Supabase
import bcrypt from "bcryptjs"; // Para hashear la contraseña
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

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate(); // Hook de navegación

  // Validación en tiempo real
  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "fullName":
        if (value.length < 3) {
          error = "El nombre debe tener al menos 3 caracteres";
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = "Ingresa un correo electrónico válido";
        }
        break;
      case "phone":
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(value)) {
          error = "Ingresa un número de teléfono válido (10 dígitos)";
        }
        break;
      case "password":
        if (value.length < 6) {
          error = "La contraseña debe tener al menos 6 caracteres";
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          error = "Las contraseñas no coinciden";
        }
        break;
    }
    return error;
  };

  // Manejo de cambios en los inputs con validación
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Validar confirmPassword cuando cambia password
    if (name === "password") {
      const confirmError = validateField("confirmPassword", formData.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const newErrors = {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    };

    setErrors(newErrors);

    // Verificar si hay errores
    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    try {
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

      // Obtenemos el ID del usuario creado en Supabase
      const userId = data?.user?.id;
      if (!userId) {
        alert("Error: No se pudo obtener el ID del usuario");
        return;
      }

      // Insertar la información en la tabla 'Users' con el UUID correcto
      const { error: insertError } = await supabase.from("Users").insert([
        {
          UUID: userId, // 🔹 Asignamos el UUID del usuario creado en Supabase Auth
          email: formData.email,
          password_hash: hashedPassword,
          full_name: formData.fullName,
          phone: formData.phone,
          created_at: new Date().toISOString(), // Registrar la fecha de creación
        },
      ]);

      if (insertError) {
        alert(`Error al guardar el perfil: ${insertError.message}`);
      } else {
        alert("Registro exitoso! Revisa tu correo para verificar tu cuenta.");
        navigate("/login"); 
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("Ocurrió un error inesperado. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit} autoComplete="off">
        <h2>Unete a PetConnect</h2>

        <div className="input-container">
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder=""
            className={errors.fullName ? "error" : ""}
          />
          <label>Nombre</label>
          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
        </div>

        <div className="input-container">
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder=""
            className={errors.email ? "error" : ""}
          />
          <label>Correo electrónico</label>
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="input-container">
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder=""
            className={errors.phone ? "error" : ""}
          />
          <label>Teléfono</label>
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="input-container">
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder=""
            className={errors.password ? "error" : ""}
          />
          <label>Contraseña</label>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="input-container">
          <input
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder=""
            className={errors.confirmPassword ? "error" : ""}
          />
          <label>Confirma tu contraseña</label>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
