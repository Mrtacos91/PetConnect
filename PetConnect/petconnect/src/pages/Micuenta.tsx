import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaTrash,
  FaPencilAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import "/src/styles/Micuenta.css";

const MiCuenta = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: "",
    email: "",
    full_name: "",
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("No autenticado");

        const { data, error } = await supabase
          .from("Users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Usuario no encontrado");

        setUserData({
          id: data.id,
          email: data.email,
          full_name: data.full_name || "",
          phone: data.phone || "",
        });
      } catch (error) {
        console.error("Error cargando datos:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("Users")
        .update({
          full_name: userData.full_name,
          phone: userData.phone,
        })
        .eq("id", userData.id);

      if (error) throw error;

      setEditMode(false);
      alert("Datos actualizados correctamente");
    } catch (error) {
      console.error("Error actualizando datos:", {
        error,
        userData,
      });
      if (error instanceof Error) {
        alert(`Error al actualizar: ${error.message}`);
      } else {
        alert("Error al actualizar: error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // 1. Eliminar de la tabla Users
      const { error: deleteUserError } = await supabase
        .from("Users")
        .delete()
        .eq("id", userData.id);

      if (deleteUserError) throw deleteUserError;

      // 2. Eliminar la cuenta de autenticación
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      alert("Cuenta eliminada correctamente");
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error al eliminar la cuenta");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="mi-cuenta-container">
      <BackButton />
      <ThemeToggle />
      <header className="mi-cuenta-header">
        <h1>Mi Cuenta</h1>
      </header>

      <main className="mi-cuenta-content">
        <div className="mi-cuenta-profile-section">
          {editMode ? (
            <form onSubmit={handleSubmit} className="mi-cuenta-form">
              <div className="mi-cuenta-form-group">
                <label>
                  <FaUser /> Nombre completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={userData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mi-cuenta-form-group">
                <label>
                  <FaEnvelope /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>

              <div className="mi-cuenta-form-group">
                <label>
                  <FaPhone /> Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mi-cuenta-form-actions">
                <button
                  type="button"
                  className="mi-cuenta-cancel-button"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="mi-cuenta-save-button"
                  disabled={loading}
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <FaSave /> Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mi-cuenta-profile-info">
              <h2>{userData.full_name}</h2>
              <div className="mi-cuenta-info-item">
                <FaEnvelope />
                <span>{userData.email}</span>
              </div>
              <div className="mi-cuenta-info-item">
                <FaPhone />
                <span>{userData.phone || "No especificado"}</span>
              </div>

              <div className="mi-cuenta-profile-actions">
                <button
                  onClick={() => setEditMode(true)}
                  className="mi-cuenta-edit-button"
                >
                  <FaPencilAlt /> Editar perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="mi-cuenta-logout-button"
                >
                  <FaSignOutAlt /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mi-cuenta-danger-zone">
          <h3>Zona peligrosa</h3>
          <p>Estas acciones no pueden deshacerse</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="mi-cuenta-delete-account-button"
          >
            <FaTrash /> Eliminar cuenta permanentemente
          </button>
        </div>
      </main>

      {showDeleteModal && (
        <div className="mi-cuenta-modal-overlay">
          <div className="mi-cuenta-confirmation-modal">
            <h3>¿Estás seguro de eliminar tu cuenta?</h3>
            <p>Esta acción eliminará todos tus datos y no podrá revertirse.</p>
            <div className="mi-cuenta-modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="mi-cuenta-cancel-button"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="mi-cuenta-confirm-delete-button"
                disabled={loading}
              >
                {loading ? "Eliminando..." : "Sí, eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiCuenta;
