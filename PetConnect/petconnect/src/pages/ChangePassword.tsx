import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import supabase from "../supabase";
import "../styles/ChangePassword.css";

interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasSpecialChar: boolean;
}

const ChangePassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we have an access token in the URL (for password reset flow)
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");

  // Check password requirements
  const [passwordRequirements, setPasswordRequirements] =
    useState<PasswordRequirements>({
      minLength: false,
      hasNumber: false,
      hasUppercase: false,
      hasSpecialChar: false,
    });

  // Check if passwords match
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const isFormValid =
    Object.values(passwordRequirements).every(Boolean) && passwordsMatch;

  // Handle password input change and validate requirements
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    setPasswordRequirements({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasUppercase: /[A-Z]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isFormValid) {
      setMessage({
        type: "error",
        text: "Por favor completa todos los campos correctamente.",
      });
      return;
    }

    try {
      setLoading(true);

      if (accessToken && refreshToken && type === "recovery") {
        // This is a password reset flow
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        // Update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) throw updateError;

        // Sign out after password reset
        await supabase.auth.signOut();
        setPasswordChanged(true);
        setMessage({
          type: "success",
          text: "¡Contraseña actualizada con éxito! Por favor inicia sesión con tu nueva contraseña.",
        });
      } else {
        // This is a logged-in user changing their password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) throw updateError;

        setPasswordChanged(true);
        setMessage({
          type: "success",
          text: "¡Contraseña actualizada con éxito!",
        });
      }
    } catch (error: any) {
      console.error("Error al actualizar la contraseña:", error);
      setMessage({
        type: "error",
        text:
          error.error_description ||
          "Ocurrió un error al actualizar la contraseña. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login after password change in recovery flow
  useEffect(() => {
    if (passwordChanged && accessToken) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordChanged, accessToken, navigate]);

  // Check if we're in a password reset flow
  useEffect(() => {
    if (accessToken && type === "recovery") {
      // We have a valid password reset token
      setMessage({
        type: "success",
        text: "Por favor ingresa y confirma tu nueva contraseña.",
      });
    } else if (accessToken && type !== "recovery") {
      // Invalid token or flow
      setMessage({
        type: "error",
        text: "Enlace inválido o expirado. Por favor solicita un nuevo enlace de recuperación.",
      });
    }
  }, [accessToken, type]);

  // Password requirement component
  const PasswordRequirement = ({
    isValid,
    text,
  }: {
    isValid: boolean;
    text: string;
  }) => (
    <div className={`requirement ${isValid ? "valid" : ""}`}>
      {isValid ? (
        <FiCheck className="requirement-icon" />
      ) : (
        <FiX className="requirement-icon" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="change-password-page">
      <div className="change-password-container">
        <div className="logo-container">
          <img
            src="public/images/Logo.png"
            alt="PetConnect Logo"
            className="logo"
            onClick={() => navigate("/")}
          />
        </div>
        <h2>{accessToken ? "Restablecer Contraseña" : "Cambiar Contraseña"}</h2>
        <p>
          {accessToken
            ? "Ingresa y confirma tu nueva contraseña."
            : "Crea una nueva contraseña segura para tu cuenta."}
        </p>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {!passwordChanged ? (
          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="input-container">
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>

              <div className="password-requirements">
                <PasswordRequirement
                  isValid={passwordRequirements.minLength}
                  text="Mínimo 8 caracteres"
                />
                <PasswordRequirement
                  isValid={passwordRequirements.hasNumber}
                  text="Al menos un número"
                />
                <PasswordRequirement
                  isValid={passwordRequirements.hasUppercase}
                  text="Al menos una mayúscula"
                />
                <PasswordRequirement
                  isValid={passwordRequirements.hasSpecialChar}
                  text="Al menos un carácter especial"
                />
              </div>
            </div>

            <div className="input-container">
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
              {!passwordsMatch && confirmPassword.length > 0 && (
                <div className="error-message">
                  Las contraseñas no coinciden
                </div>
              )}
            </div>

            <button
              type="submit"
              className="change-password-button"
              disabled={!isFormValid || loading}
            >
              {loading ? "Procesando..." : "Cambiar contraseña"}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <p>¡Tu contraseña ha sido actualizada con éxito!</p>
            {!accessToken && (
              <button
                className="back-to-dashboard"
                onClick={() => navigate("/login")}
              >
                Volver al inicio
              </button>
            )}
          </div>
        )}

        {!accessToken && !passwordChanged && (
          <div className="back-to-login">
            <button className="back-button" onClick={() => navigate(-1)}>
              Volver atrás
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
