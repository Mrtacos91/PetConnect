import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheck } from "react-icons/fi";
import supabase from "../supabase";
import "../styles/ForgotPassword.css";
import logo from "../assets/images/Logo.png";

type MessageType = "success" | "error" | "info";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: MessageType;
    text: string;
  } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const resetSuccess = searchParams.get("reset_success");
    if (resetSuccess === "true") {
      setMessage({
        type: "success",
        text: "¡Contraseña actualizada con éxito! Ahora puedes iniciar sesión con tu nueva contraseña.",
      });
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!validateEmail(email)) {
      setMessage({
        type: "error",
        text: "Por favor ingresa un correo electrónico válido.",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      setMessage({
        type: "success",
        text: `Se ha enviado un correo electrónico a ${email} con instrucciones para restablecer tu contraseña.`,
      });
    } catch (error: any) {
      console.error("Error al enviar el correo de recuperación:", error);
      setMessage({
        type: "error",
        text:
          error.error_description ||
          "Ocurrió un error al enviar el correo. Por favor, verifica el correo e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setLoading(true);
    setMessage({
      type: "info",
      text: "Reenviando correo de recuperación...",
    });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Se ha reenviado el correo de recuperación a ${email}. Por favor, revisa tu bandeja de entrada.`,
      });
    } catch (error: any) {
      console.error("Error al reenviar el correo:", error);
      setMessage({
        type: "error",
        text: "Ocurrió un error al reenviar el correo. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="logo-container">
          <img
            src={logo}
            alt="PetConnect Logo"
            className="logo"
            onClick={() => navigate("/")}
          />
        </div>

        <h2>Recuperar Contraseña</h2>
        <p>
          {emailSent
            ? "Revisa tu bandeja de entrada para restablecer tu contraseña."
            : "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."}
        </p>

        {message && (
          <div
            className={`message ${message.type} ${
              message.type === "info" ? "info" : ""
            }`}
          >
            {message.text}
            {message.type === "error" && email && (
              <button
                className="resend-link"
                onClick={handleResendEmail}
                disabled={loading}
              >
                Reenviar correo
              </button>
            )}
          </div>
        )}

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="input-container">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="reset-button"
              disabled={loading || !email}
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        ) : (
          <div className="email-sent-message">
            <div className="checkmark-circle">
              <FiCheck size={32} />
            </div>
            <p>
              Hemos enviado un correo a <strong>{email}</strong> con
              instrucciones para restablecer tu contraseña.
            </p>
            <p className="check-spam">
              ¿No ves el correo? Revisa tu carpeta de spam o{" "}
              <button
                className="resend-link"
                onClick={handleResendEmail}
                disabled={loading}
              >
                vuelve a enviar el enlace
              </button>
            </p>
          </div>
        )}

        <div className="back-to-login">
          <Link to="/login" className="back-link">
            <FiArrowLeft size={16} style={{ marginRight: "8px" }} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
