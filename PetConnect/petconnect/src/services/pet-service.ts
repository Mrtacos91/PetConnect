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
  device_id?: string | null;
  image_pet?: string | null;
}

/*
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
 * Obtiene los datos de la mascota del usuario por ID específico
 * @param petId ID de la mascota
 * @returns Datos de la mascota o null si no existe
 */
export const getPetById = async (petId: string) => {
  const { data, error } = await supabase
    .from("Pets")
    .select("*")
    .eq("id", petId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
};

/**
 * Obtiene todas las mascotas del usuario
 * @param userId ID del usuario local
 * @returns Array con todas las mascotas del usuario o array vacío si no tiene
 */
export const getAllPetsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("Pets")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: true });

  if (error || !data) {
    return [];
  }
  return data;
};

/**
 * Obtiene los datos de la mascota principal del usuario (para compatibilidad)
 * @param userId ID del usuario local
 * @returns Datos de la primera mascota o null si no existe
 */
export const getPetByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("Pets")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
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

/**
 * Elimina una mascota por su ID
 * @param petId ID de la mascota a eliminar
 * @returns Objeto con éxito o error
 */
export const deletePet = async (petId: string) => {
  try {
    // Primero obtenemos la mascota para eliminar su imagen si existe
    const { data: pet, error: fetchError } = await supabase
      .from("Pets")
      .select("image_pet")
      .eq("id", petId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Si la mascota tiene una imagen, la eliminamos del almacenamiento
    if (pet?.image_pet) {
      const imagePath = pet.image_pet.split("/").slice(-2).join("/");
      await supabase.storage.from("petimage").remove([imagePath]);
    }

    // Eliminamos el registro de la mascota
    const { error: deleteError } = await supabase
      .from("Pets")
      .delete()
      .eq("id", petId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar la mascota",
    };
  }
};
