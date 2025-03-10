import { useNavigate } from "react-router-dom";
import { FaPencilAlt } from "react-icons/fa";
import supabase from "../supabase"; // Importa tu cliente de Supabase
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";
import "../styles/Customise.css";
import { useState } from "react";

const Customise: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Manejo de la imagen seleccionada
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPetPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Enviar el formulario para guardar la mascota
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!petName || !petType || !petBreed || !petAge) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);

    // 1️⃣ OBTENER USUARIO DE SUPABASE AUTH
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) {
      alert("Debes iniciar sesión antes de agregar una mascota.");
      setLoading(false);
      return;
    }
    const supabaseEmail = sessionData.user.email;

    // 2️⃣ BUSCAR ID LOCAL EN TABLA "users"
    const { data: localUser, error: localUserError } = await supabase
      .from("Users")
      .select("id")
      .eq("email", supabaseEmail)
      .single();

    if (localUserError || !localUser?.id) {
      alert("No se encontró tu usuario local. Verifica la tabla 'users'.");
      setLoading(false);
      return;
    }

    let imageUrl = null;

    // 3️⃣ SUBIR IMAGEN A SUPABASE STORAGE (Opcional, si hay imagen)
    if (petPhoto) {
      const fileExt = petPhoto.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `pets/${fileName}`;

      // Subir al bucket "pet_images" (Crea y configura este bucket en Supabase)
      const { error: uploadError } = await supabase.storage
        .from("pet_images")
        .upload(filePath, petPhoto);

      if (uploadError) {
        console.error("Error subiendo la imagen:", uploadError);
        alert("Error subiendo la imagen.");
        setLoading(false);
        return;
      }

      // Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from("pet_images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // 4️⃣ INSERTAR DATOS EN LA TABLA "pets"
    const { error: insertError } = await supabase.from("Pets").insert([
      {
        user_id: localUser.id, // El ID local de la tabla "users"
        pet_name: petName,
        pet_type: petType,
        pet_breed: petBreed,
        pet_age: parseInt(petAge),
        image_pet: imageUrl,
      },
    ]);

    if (insertError) {
      console.error("Error insertando datos en Supabase:", insertError);
      alert("Error guardando los datos.");
    } else {
      alert("¡Mascota guardada con éxito!");
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="customise-page">
      <MenuButton isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />

      <button className="back-button" onClick={() => navigate("/dashboard")}>
        &#8592; Volver
      </button>

      <main className="dashboard">
        <div className="customise-container">
          <h1>Personaliza tu mascota</h1>

          {/* Imagen de la mascota */}
          <div className="pet-photo-wrapper">
            <label htmlFor="petPhoto" className="pet-photo-label">
              <div className="pet-photo-circle">
                {photoPreview ? (
                  <img src={photoPreview} alt="Mascota" className="pet-photo" />
                ) : (
                  <span className="upload-text">📷</span>
                )}
                <div className="edit-icon-customise">
                  <FaPencilAlt />
                </div>
              </div>
            </label>
            <input
              type="file"
              id="petPhoto"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden-file-input"
            />
          </div>

          <form className="customise-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="petName">Nombre</label>
              <input
                type="text"
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Nuevo nombre"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="petType">Tipo de Mascota</label>
              <select
                id="petType"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
              >
                <option value="">Selecciona un tipo</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Roedor">Roedor</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="petBreed">Raza</label>
              <input
                type="text"
                id="petBreed"
                value={petBreed}
                onChange={(e) => setPetBreed(e.target.value)}
                placeholder="Nueva raza"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="petAge">Edad</label>
              <input
                type="number"
                id="petAge"
                value={petAge}
                onChange={(e) => setPetAge(e.target.value)}
                placeholder="Edad en años"
              />
            </div>

            <button type="submit" className="save-button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Customise;
