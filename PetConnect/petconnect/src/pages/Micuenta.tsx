import { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaSave, FaTrash, FaPencilAlt, FaSignOutAlt } from "react-icons/fa";
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
        phone: ""
    });
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Cargar datos del usuario
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) throw new Error("No autenticado");

                const { data, error } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Usuario no encontrado");

                setUserData({
                    id: data.id,
                    email: data.email,
                    full_name: data.full_name || "",
                    phone: data.phone || ""
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
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('Users')
                .update({
                    full_name: userData.full_name,
                    phone: userData.phone
                })
                .eq('id', userData.id);

            if (error) throw error;

            setEditMode(false);
            alert("Datos actualizados correctamente");
        } catch (error) {
            console.error("Error actualizando datos:", {
                error,
                userData
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
                .from('Users')
                .delete()
                .eq('id', userData.id);

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
        <div className="account-container">
            <header className="account-header">
                <BackButton />
                <h1>Mi Cuenta</h1>
                <ThemeToggle />
            </header>

            <main className="account-content">
                <div className="profile-section">
                    {editMode ? (
                        <form onSubmit={handleSubmit} className="account-form">
                            <div className="form-group">
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

                            <div className="form-group">
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

                            <div className="form-group">
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

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setEditMode(false)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={loading}
                                >
                                    {loading ? "Guardando..." : (
                                        <>
                                            <FaSave /> Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-info">
                            <h2>{userData.full_name}</h2>
                            <div className="info-item">
                                <FaEnvelope />
                                <span>{userData.email}</span>
                            </div>
                            <div className="info-item">
                                <FaPhone />
                                <span>{userData.phone || "No especificado"}</span>
                            </div>

                            <div className="profile-actions">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="edit-button"
                                >
                                    <FaPencilAlt /> Editar perfil
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="logout-button"
                                >
                                    <FaSignOutAlt /> Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="danger-zone">
                    <h3>Zona peligrosa</h3>
                    <p>Estas acciones no pueden deshacerse</p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="delete-account-button"
                    >
                        <FaTrash /> Eliminar cuenta permanentemente
                    </button>
                </div>
            </main>

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="confirmation-modal">
                        <h3>¿Estás seguro de eliminar tu cuenta?</h3>
                        <p>Esta acción eliminará todos tus datos y no podrá revertirse.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="cancel-button"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="confirm-delete-button"
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