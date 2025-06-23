                </div >

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
            </main >

    { showDeleteModal && (
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
        </div >
    );
};

export default MiCuenta;