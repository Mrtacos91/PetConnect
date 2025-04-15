import supabase from "../supabase";

/**
 * Interfaz para los datos de mascota
 */
export interface PetData {
  id?: string;
  user_id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  pet_age: number;
  image_pet?: string | null;
}

/**
 * Obtiene el usuario autenticado de Supabase Auth
 * @returns Datos del usuario autenticado o null si no hay sesión
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  return data.user;
};

/**
 * Obtiene el ID del usuario local desde la tabla Users
 * @param email Email del usuario
 * @returns ID del usuario local o null si no existe
 */
export const getLocalUserId = async (email: string) => {
  const { data, error } = await supabase
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !data) {
    return null;
  }
  return data.id;
};

/**
 * Obtiene los datos de la mascota del usuario
 * @param userId ID del usuario local
 * @returns Datos de la mascota o null si no existe
 */
export const getPetByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("Pets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
};

/**
 * Sube una imagen de mascota al almacenamiento
 * @param userId ID del usuario
 * @param file Archivo de imagen
 * @param currentImageUrl URL de la imagen actual (si existe)
 * @returns URL de la nueva imagen o null si hay error
 */
export const uploadPetImage = async (
  userId: string,
  file: File,
  currentImageUrl: string | null
) => {
  try {
    // Si hay una imagen anterior, intentar borrarla primero
    if (currentImageUrl) {
      const oldPath = currentImageUrl.split("/").slice(-2).join("/"); // Obtener "userId/filename"
      await supabase.storage.from("petimage").remove([oldPath]);
    }

    // Preparar la nueva imagen
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Subir la nueva imagen
    const { error: uploadError } = await supabase.storage
      .from("petimage")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Error subiendo la imagen: ${uploadError.message}`);
    }

    // Obtener la URL pública
    const { data: publicUrlData } = await supabase.storage
      .from("petimage")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error en el proceso de imagen:", error);
    return null;
  }
};

/**
 * Guarda o actualiza los datos de una mascota
 * @param petData Datos de la mascota a guardar
 * @returns Objeto con éxito o error
 */
export const savePetData = async (petData: PetData) => {
  try {
    const { error } = await supabase.from("Pets").upsert([petData]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido" };
  }
};