import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/micuenta.css";
import {
    FaChevronLeft,
    FaEdit,
    FaTimes,
    FaCheck,
    FaSignOutAlt,
    FaTrash
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import BackButton from '../components/BackButton';
import MenuButton from '../components/MenuButton';
import ThemeToggle from '../components/ThemeToggle';

const Account = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+1 234 567 890'
    });

    const [editMode, setEditMode] = useState(false);
    const [password, setPassword] = useState("");

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEditMode(false);
        console.log('Datos actualizados:', user, 'Nueva contraseña:', password);
    };

    const handleLogout = () => {
        console.log("Cerrando sesión...");
    };

    const handleDeleteAccount = () => {
        console.log("Cuenta eliminada.");
    };

    return (
        <div className="mi-cuenta-container">
            <button className="mi-cuenta-back-btn" onClick={() => navigate(-1)}>
                <FaChevronLeft /> Volver
            </button>

            <div className="mi-cuenta-content">
                <div className="customise-page">
                    <div className="BackBt-CP">
                        <BackButton />
                    </div>
                    <ThemeToggle />
                    <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <Sidebar isOpen={isSidebarOpen} />
                </div>

                <div className="mi-cuenta-profile-section">
                    <div className="mi-cuenta-section-header">
                        <h2>Perfil de Usuario</h2>
                        {!editMode && (
                            <button className="mi-cuenta-edit-btn" onClick={() => setEditMode(true)}>
                                <FaEdit /> Editar
                            </button>
                        )}
                    </div>

                    {editMode ? (
                        <form onSubmit={handleSubmit}>
                            <div className="mi-cuenta-form-group">
                                <label>Nombre completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={user.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="mi-cuenta-form-group">
                                <label>Correo electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="mi-cuenta-form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={user.phone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="mi-cuenta-form-group">
                                <label>Nueva contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="mi-cuenta-form-actions">
                                <button type="button" className="mi-cuenta-cancel-btn" onClick={() => setEditMode(false)}>
                                    <FaTimes /> Cancelar
                                </button>
                                <button type="submit" className="mi-cuenta-save-btn">
                                    <FaCheck /> Guardar cambios
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mi-cuenta-profile-info">
                            <div className="mi-cuenta-info-row">
                                <span className="mi-cuenta-info-label">Nombre:</span>
                                <span className="mi-cuenta-info-value">{user.name}</span>
                            </div>
                            <div className="mi-cuenta-info-row">
                                <span className="mi-cuenta-info-label">Email:</span>
                                <span className="mi-cuenta-info-value">{user.email}</span>
                            </div>
                            <div className="mi-cuenta-info-row">
                                <span className="mi-cuenta-info-label">Teléfono:</span>
                                <span className="mi-cuenta-info-value">{user.phone}</span>
                            </div>
                        </div>
                    )}

                    <div className="mi-cuenta-actions">
                        <button className="mi-cuenta-logout-btn" onClick={handleLogout}>
                            <FaSignOutAlt /> Cerrar sesión
                        </button>
                        <button className="mi-cuenta-delete-btn" onClick={handleDeleteAccount}>
                            <FaTrash /> Eliminar cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;