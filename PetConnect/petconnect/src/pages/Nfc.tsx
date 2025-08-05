import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabase";
import { User } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import NfcLink from "./NfcLink";
import {
  getCurrentUser,
  getLocalUserId as getLocalUserIdFromService,
  getAllPetsByUserId,
} from "../services/pet-service";
import BackButton from "../components/BackButton";
import AlertMessage from "../components/AlertMessage";
import "../styles/Nfc.css";

import {
  FaDog,
  FaUserAlt,
  FaExclamationCircle,
  FaMicrochip,
  FaQrcode,
  FaEye,
  FaSearch,
} from "react-icons/fa";

// Interfaces de datos (sin cambios)
interface PetInfo {
  petname: string;
  pettype: string;
  petbreed: string;
  petconditions: string;
  petpartsigns: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  othercontact: string;
}

const Nfc: React.FC = () => {
  // El 'tagId' de la URL ahora solo se usa para mostrar un ID específico si existe.
  const { id: tagId } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);

  // **NUEVO**: Almacenará el ID del perfil de contacto del usuario una vez cargado o creado.
  const [profileId, setProfileId] = useState<number | null>(
    tagId ? parseInt(tagId, 10) : null
  );

  // Estados del componente
  const [hasNfc, setHasNfc] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalView, setModalView] = useState<
    "select" | "qr" | "nfc" | "view" | "read"
  >("select");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Estado para el selector de correo
  const [emailOption, setEmailOption] = useState<"saved" | "custom">("saved");
  const [userEmail, setUserEmail] = useState<string>("");

  // **NUEVO**: Estados para la funcionalidad de lectura NFC
  const [isReading, setIsReading] = useState<boolean>(false);
  const [nfcReader, setNfcReader] = useState<any>(null);
  const [readResult, setReadResult] = useState<string | null>(null);

  // Estados del formulario (sin cambios)
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [petInfo, setPetInfo] = useState<PetInfo>({
    petname: "",
    pettype: "",
    petbreed: "",
    petconditions: "",
    petpartsigns: "",
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: "",
    email: "",
    address: "",
    othercontact: "",
  });

  // Helper para obtener el ID del usuario desde la tabla 'Users' usando el email
  const getLocalUserId = async (): Promise<string | null> => {
    try {
      const user = await getCurrentUser();
      if (!user || !user.email) {
        console.error("No user logged in or email not available");
        return null;
      }
      return await getLocalUserIdFromService(user.email);
    } catch (error) {
      console.error("Error getting local user ID:", error);
      return null;
    }
  };

  // Función para manejar el éxito de vinculación NFC
  const handleNfcLinkSuccess = (url: string) => {
    setScanResult(url);
    setPublicUrl(url);
    setAlert({
      message: "URL de la etiqueta NFC vinculada exitosamente a tu perfil.",
      type: "success",
    });

    // Cerrar el modal después de un momento
    setTimeout(() => {
      setIsModalOpen(false);
    }, 1500);
  };

  // **NUEVO**: Función para detener la lectura de etiquetas NFC
  const stopNfcReading = () => {
    if (nfcReader) {
      try {
        // Remover todos los listeners
        nfcReader.removeEventListener("reading", () => {});
        nfcReader.removeEventListener("readingerror", () => {});
        setNfcReader(null);
      } catch (error) {
        console.error("Error stopping NFC reader:", error);
      }
    }
    setIsReading(false);
    setAlert({
      message: "Lectura NFC detenida.",
      type: "success",
    });
  };

  // **NUEVO**: Función para redirigir a una URL
  const redirectToUrl = (url: string) => {
    try {
      // Limpiar la URL si es necesario
      let cleanUrl = url.trim();

      // Agregar protocolo si no lo tiene
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }

      // Redirigir
      window.location.href = cleanUrl;
    } catch (error) {
      console.error("Invalid URL:", error);
      setAlert({
        message: "La URL detectada no es válida.",
        type: "error",
      });
    }
  };

  // **MODIFICADO**: La inicialización ahora se basa en el usuario, no en el ID de la URL.
  useEffect(() => {
    if ("NDEFReader" in window) {
      setHasNfc(true);
    }

    const initialize = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const userId = await getLocalUserId();
        if (!userId) {
          setAlert({
            message:
              "No se pudo verificar tu usuario. Por favor inicia sesión nuevamente.",
            type: "error",
          });
          setIsLoading(false);
          return;
        }
        setLocalUserId(userId);

        // Intenta cargar el perfil de contacto existente usando el user_id.
        const { data, error } = await supabase
          .from("pettag_contactinfo")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (data) {
          // Si se encuentra, rellena el formulario y guarda el ID del perfil.
          setPetInfo({
            petname: data.petname || "",
            pettype: data.pettype || "",
            petbreed: data.petbreed || "",
            petconditions: data.petconditions || "",
            petpartsigns: data.petpartsigns || "",
          });
          setContactInfo({
            phone: data.phone?.toString() || "", // Convertir a string para el input
            email: data.email || "",
            address: data.address || "",
            othercontact: data.othercontact || "",
          });
          setProfileId(data.id); // Guarda el ID del perfil existente.
        }

        if (error && error.code !== "PGRST116") {
          // Ignora el error "no rows found"
          setAlert({
            message: "Error al cargar tu perfil de contacto.",
            type: "error",
          });
        }
      }
      setIsLoading(false);
    };

    initialize();
  }, []);

  // **NUEVO**: Cleanup effect para detener la lectura NFC cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (isReading && nfcReader) {
        stopNfcReading();
      }
    };
  }, [isReading, nfcReader]);

  // Función para actualizar la URL asignada en la base de datos
  const updateUrlAsigned = async (url: string) => {
    if (!user || !localUserId) return;
    try {
      // Verificar si la URL ya está asignada a otro usuario
      const { data: existing, error: checkError } = await supabase
        .from("pettag_contactinfo")
        .select("user_id, id")
        .eq("url_asigned", url)
        .maybeSingle();
      if (checkError) {
        throw checkError;
      }
      if (existing && existing.user_id !== localUserId) {
        setAlert({
          message:
            "Esta URL ya está vinculada a otro perfil. Debes desvincularla primero antes de asignarla a tu mascota.",
          type: "error",
        });
        return false;
      }
      await supabase
        .from("pettag_contactinfo")
        .update({ url_asigned: url, updated_at: new Date().toISOString() })
        .eq("user_id", localUserId);
      return true;
    } catch (error) {
      console.error("Error actualizando url_asigned:", error);
      setAlert({
        message: "Error al guardar la URL escaneada en la base de datos.",
        type: "error",
      });
      return false;
    }
  };

  // Función para desvincular la URL
  const unlinkUrl = async () => {
    if (!user || !localUserId) return;
    setIsLoading(true);
    try {
      await supabase
        .from("pettag_contactinfo")
        .update({ url_asigned: null, updated_at: new Date().toISOString() })
        .eq("user_id", localUserId);
      setAlert({
        message: "URL desvinculada exitosamente.",
        type: "success",
      });
      setPublicUrl("");
      setScanResult(null);
    } catch (error) {
      setAlert({
        message: "Error al desvincular la URL.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica del escáner QR
  useEffect(() => {
    if (modalView === "qr" && isModalOpen && !scanResult) {
      // Bandera para controlar el ciclo de vida del componente
      let isMounted = true;
      
      // Retraso para asegurar que el DOM esté listo
      setTimeout(() => {
        if (!isMounted) return;
        
        const scanner = new Html5QrcodeScanner(
          "qr-scanner-container",
          {
            qrbox: { width: 200, height: 200 }, // Tamaño reducido para mejor detección de QRs pequeños
            fps: 10, // Aumentado para mejor respuesta
            facingMode: { exact: "environment" },
            aspectRatio: 1.0, // Relación de aspecto cuadrada para mejor enfoque
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true, // Usar detector de códigos de barras nativo si está disponible
            },
            rememberLastUsedCamera: true, // Recordar la última cámara usada
            // Eliminamos supportedScanTypes que causaba el error
            focusMode: "continuous", // Enfoque continuo para mejor detección
            videoConstraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              advanced: [{ focusMode: "continuous" }]
            }
          },
          false
        );
        
        // Función para mostrar instrucciones dinámicas al usuario
        const showDynamicInstructions = () => {
          if (!isMounted) return;
          
          const container = document.getElementById("qr-scanner-container");
          if (!container) return;
          
          const instructionsDiv = document.createElement("div");
          instructionsDiv.className = "qr-instructions";
          instructionsDiv.style.position = "absolute";
          instructionsDiv.style.bottom = "10px";
          instructionsDiv.style.left = "0";
          instructionsDiv.style.right = "0";
          instructionsDiv.style.textAlign = "center";
          instructionsDiv.style.color = "white";
          instructionsDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
          instructionsDiv.style.padding = "10px";
          instructionsDiv.style.zIndex = "1000";
          instructionsDiv.innerHTML = "Acerca la cámara al código QR y mantén estable";
          
          container.appendChild(instructionsDiv);
          
          // Actualizar instrucciones basadas en la detección
          let lastUpdate = Date.now();
          const updateInterval = setInterval(() => {
            if (!isMounted) {
              clearInterval(updateInterval);
              return;
            }
            
            const now = Date.now();
            if (now - lastUpdate > 1000) { // Actualizar cada segundo
              lastUpdate = now;
              const videoElement = container.querySelector("video");
              if (videoElement) {
                // Alternar entre diferentes consejos
                const tips = [
                  "Acerca la cámara al código QR y mantén estable",
                  "Asegúrate de tener buena iluminación",
                  "Evita sombras sobre el código QR",
                  "Mantén la cámara paralela al código"
                ];
                const tipIndex = Math.floor((now / 3000) % tips.length);
                instructionsDiv.innerHTML = tips[tipIndex];
              }
            }
          }, 1000);
        };
        
        // Mostrar instrucciones después de un breve retraso
        setTimeout(showDynamicInstructions, 1000);
        
        const onScanSuccess = async (result: string) => {
          if (!isMounted) return;
          
          scanner.clear();

          // Guardar la URL absoluta escaneada
          const urlToSet = result.trim();

          // Validar que sea una URL absoluta válida
          try {
            new URL(urlToSet);
          } catch (e) {
            setAlert({
              message: `El QR debe contener una URL absoluta válida, por ejemplo: https://petconnectmx.netlify.app/public/pet/1`,
              type: "error",
            });
            return;
          }

          setScanResult(urlToSet);
          setAlert({
            message: `URL escaneada exitosamente y guardada en tu perfil.`,
            type: "success",
          });

          setPublicUrl(urlToSet);

          // Guardar la URL absoluta en la base de datos
          await updateUrlAsigned(urlToSet);

          setTimeout(() => {
            setIsModalOpen(false);
          }, 1500);
        };
        
        const onScanFailure = (error: any) => {
          // Solo registrar errores críticos, no los normales de detección
          if (error && error.name !== "NotFoundException") {
            console.error("Error de escaneo QR:", error);
          }
        };

        scanner.render(onScanSuccess, onScanFailure);
      }, 500); // Retraso para asegurar que el DOM esté listo
      
      return () => {
        isMounted = false;
        // Intentar limpiar el escáner si existe
        const scannerElement = document.getElementById("qr-scanner-container");
        if (scannerElement) {
          // Limpiar cualquier contenido dinámico
          const instructions = scannerElement.querySelector(".qr-instructions");
          if (instructions) {
            instructions.remove();
          }
          
          try {
            const html5QrcodeScanner = new Html5QrcodeScanner(
              "qr-scanner-container",
              { fps: 1 },
              false
            );
            html5QrcodeScanner.clear();
          } catch (error) {
            console.error("Error al limpiar el escáner:", error);
          }
        }
      };
    }
  }, [modalView, isModalOpen, scanResult, user, localUserId]);

  // Verificar soporte NFC
  const checkNfcSupport = () => {
    // @ts-ignore - La API de Web NFC no está tipada por defecto
    const nfcSupport = "NDEFReader" in window;
    setHasNfc(nfcSupport);
    return nfcSupport;
  };

  // Cargar perfil del usuario
  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userId = localUserId || (await getLocalUserId());
      if (!userId) return;

      const { data, error } = await supabase
        .from("pettag_contactinfo")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = No se encontraron resultados
        throw error;
      }

      if (data) {
        setProfileId(data.id);
        setPetInfo({
          petname: data.petname || "",
          pettype: data.pettype || "",
          petbreed: data.petbreed || "",
          petconditions: data.petconditions || "",
          petpartsigns: data.petpartsigns || "",
        });
        setContactInfo({
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          othercontact: data.othercontact || "",
        });
      }
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
      setAlert({
        message: "Error al cargar el perfil. Por favor, inténtalo de nuevo.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos del perfil existente al montar el componente
  useEffect(() => {
    checkNfcSupport();
    loadUserProfile();

    // Cargar el correo del usuario actual
    const loadUserEmail = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser?.email) {
        setUserEmail(currentUser.email);
        // Establecer el correo guardado como valor predeterminado
        setContactInfo((prev) => ({
          ...prev,
          email: currentUser.email || "",
        }));
      }
    };

    loadUserEmail();
  }, [user]);

  // Cargar las mascotas del usuario
  useEffect(() => {
    const loadPets = async () => {
      if (!localUserId) return;

      try {
        const userPets = await getAllPetsByUserId(localUserId);
        setPets(userPets);

        // Si solo hay una mascota, seleccionarla por defecto
        if (userPets.length === 1) {
          handlePetSelect(userPets[0].id);
        }
      } catch (error) {
        console.error("Error al cargar las mascotas:", error);
        setAlert({
          message:
            "Error al cargar las mascotas. Por favor, inténtalo de nuevo.",
          type: "error",
        });
      }
    };

    loadPets();
  }, [localUserId]);

  // Manejador para cuando se selecciona una mascota
  const handlePetSelect = (petId: string) => {
    setSelectedPet(petId);
    // Actualizar inmediatamente la info de la mascota para reflejarla en los inputs
    const pet = pets.find((p) => p.id?.toString() === petId);
    if (pet) {
      setPetInfo((prev) => ({
        ...prev,
        petname: pet.pet_name,
        pettype: pet.pet_type,
        petbreed: pet.pet_breed,
      }));
    }
  };

  // Sincronizar la información de la mascota seleccionada en tiempo real
  useEffect(() => {
    if (!selectedPet) {
      // Limpiar campos si no hay mascota seleccionada
      setPetInfo((prev) => ({
        ...prev,
        petname: "",
        pettype: "",
        petbreed: "",
      }));
      return;
    }

    const pet = pets.find((p) => p.id?.toString() === selectedPet);
    if (pet) {
      setPetInfo((prev) => ({
        ...prev,
        petname: pet.pet_name,
        pettype: pet.pet_type,
        petbreed: pet.pet_breed,
      }));
    }
  }, [selectedPet, pets]); // Mantiene sincronización si cambia lista de mascotas o selección

  // Manejador para los demás campos del formulario
  const handlePetInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPetInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Manejador para cambiar entre correo guardado y personalizado
  const handleEmailOptionChange = (option: "saved" | "custom") => {
    setEmailOption(option);
    if (option === "saved") {
      // Restaurar el correo guardado
      setContactInfo((prev) => ({
        ...prev,
        email: userEmail,
      }));
    } else {
      // Limpiar el campo de correo para entrada personalizada
      setContactInfo((prev) => ({
        ...prev,
        email: "",
      }));
    }
  };

  // Función mejorada para guardar los datos del perfil
  const saveData = async (): Promise<boolean> => {
    // Verificar autenticación
    if (!user) {
      setAlert({
        message: "Debes iniciar sesión para guardar.",
        type: "error",
      });
      return false;
    }

    // Obtener el ID de usuario local si no está disponible
    const userId = localUserId || (await getLocalUserId());
    if (!userId) {
      setAlert({
        message:
          "No se pudo verificar tu usuario. Por favor inicia sesión nuevamente.",
        type: "error",
      });
      return false;
    }
    setLocalUserId(userId);

    setIsLoading(true);
    setAlert(null);

    try {
      // Validar y formatear el teléfono
      let phoneNumber: number | null = null;
      if (contactInfo.phone) {
        const cleanPhone = contactInfo.phone.replace(/\D/g, "");
        phoneNumber = parseInt(cleanPhone, 10);
        if (isNaN(phoneNumber)) {
          throw new Error("El número de teléfono no es válido.");
        }
      }

      // 1. Verificar si ya existe un perfil para este usuario
      const { data: existingProfile } = await supabase
        .from("pettag_contactinfo")
        .select("id, url_asigned")
        .eq("user_id", userId)
        .maybeSingle();

      // 2. Preparar los datos para guardar
      const dataToSave = {
        ...(existingProfile?.id && { id: existingProfile.id }), // Solo incluir ID si existe
        user_id: userId,
        ...petInfo,
        email: contactInfo.email || user.email || "",
        address: contactInfo.address,
        othercontact: contactInfo.othercontact,
        ...(phoneNumber !== null && { phone: phoneNumber }),
        updated_at: new Date().toISOString(),
      };

      // 3. Si hay una URL para asignar, verificar que no esté en uso
      if (publicUrl) {
        // Verificar si la URL ya está asignada a otro usuario
        const { data: existingUrl, error: urlError } = await supabase
          .from("pettag_contactinfo")
          .select("user_id, id")
          .eq("url_asigned", publicUrl)
          .neq("user_id", userId) // Excluir al usuario actual
          .maybeSingle();

        if (urlError) {
          throw new Error("Error al verificar la URL asignada");
        }

        if (existingUrl) {
          setAlert({
            message:
              "Esta URL ya está en uso por otro perfil. Por favor, utiliza una URL única.",
            type: "error",
          });
          return false;
        }

        // Si la validación es exitosa, asignar la URL
        dataToSave.url_asigned = publicUrl;
      } else if (existingProfile?.url_asigned) {
        // Mantener la URL existente si no se está cambiando
        dataToSave.url_asigned = existingProfile.url_asigned;
      }

      // 4. Realizar la operación de guardado
      let query = supabase.from("pettag_contactinfo");

      // Usar update si existe el perfil, insert si no
      const { data, error } = existingProfile?.id
        ? await query
            .update(dataToSave)
            .eq("id", existingProfile.id)
            .select()
            .single()
        : await query.insert([dataToSave]).select().single();

      if (error) throw error;

      // Actualizar el ID del perfil si es un nuevo registro
      if (data && !existingProfile?.id) {
        setProfileId(data.id);
      }

      // Mostrar mensaje de éxito
      setAlert({
        message: "Perfil guardado exitosamente.",
        type: "success",
      });

      return true;
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      setAlert({
        message:
          error instanceof Error
            ? error.message
            : "Error al guardar la información.",
        type: "error",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja el clic del botón "Guardar Cambios"
  // Obtener la URL asignada de la base de datos

  const handleViewPlate = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Botón Ver placa clickeado");
    setIsLoading(true);

    try {
      if (scanResult) {
        console.log("Usando scanResult:", scanResult);
        setPublicUrl(scanResult);
        setModalView("view");
        setIsModalOpen(true);
        setIsLoading(false);
        return;
      }

      // Si no hay resultado de escaneo, verificar el perfil
      if (!profileId) {
        console.log("No hay profileId");
        setAlert({
          message:
            "Primero debes guardar la información de la placa o escanear un código QR.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      console.log("Buscando URL asignada para profileId:", profileId);

      // Verificar si hay una URL asignada en la base de datos
      const { data: contactInfo, error } = await supabase
        .from("pettag_contactinfo")
        .select("url_asigned")
        .eq("id", profileId)
        .single();

      console.log("Resultado de la consulta:", { contactInfo, error });

      if (error) {
        console.error("Error al consultar la URL asignada:", error);
        throw error;
      }

      if (!contactInfo?.url_asigned) {
        console.log("No se encontró URL asignada");
        setAlert({
          message:
            "No hay una URL asignada a esta mascota. Por favor, escanea un código QR primero.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      console.log("URL asignada encontrada:", contactInfo.url_asigned);

      // Si hay URL asignada, mostrarla
      setPublicUrl(contactInfo.url_asigned);
      setModalView("view");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error en handleViewPlate:", error);
      setAlert({
        message:
          "Error al cargar la información de la placa. Intenta de nuevo.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setAlert({
        message: "¡URL copiada al portapapeles!",
        type: "success",
      });
    } catch (error) {
      console.error("Error al copiar la URL:", error);
      setAlert({
        message: "Error al copiar la URL. Intenta de nuevo.",
        type: "error",
      });
    }
  };

  // Handle save button click
  const handleSaveOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await saveData();
    if (success) {
      setAlert({
        message: "Información guardada correctamente.",
        type: "success",
      });
    } else {
      setAlert({
        message: "Error al guardar la información.",
        type: "error",
      });
    }
    setIsLoading(false);
  };

  // **MODIFICADO**: La escritura NFC ahora usa la URL escaneada
  const writeNfcTag = async () => {
    if (!hasNfc) {
      setAlert({ message: "Tu dispositivo no soporta NFC.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar si hay un perfil guardado
      if (!profileId) {
        setAlert({
          message: "Primero debes guardar la información de la mascota.",
          type: "error",
        });
        return;
      }

      // Obtener la URL desde el QR o la lectura NFC
      const detectedUrl = scanResult || readResult;
      if (!detectedUrl) {
        setAlert({
          message:
            "No se ha detectado ninguna URL aún. Acerca tu dispositivo a la etiqueta NFC o escanea un QR para obtener la URL.",
          type: "error",
        });
        return;
      }

      // Validar la URL
      let urlToWrite = detectedUrl.trim();
      if (!urlToWrite.match(/^https?:\/\//i)) {
        urlToWrite = "https://" + urlToWrite;
      }

      try {
        new URL(urlToWrite);
      } catch (e) {
        setAlert({
          message: "La URL escaneada no es válida.",
          type: "error",
        });
        return;
      }

      // Actualizar la URL asignada en la base de datos
      const { error: updateError } = await supabase
        .from("pettag_contactinfo")
        .update({
          url_asigned: urlToWrite,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (updateError) {
        console.error("Error al actualizar la URL asignada:", updateError);
        throw updateError;
      }

      setAlert({
        message: "Acerca la etiqueta NFC para escribir...",
        type: "success",
      });

      const ndef = new (window as any).NDEFReader();

      // Escribir la URL en la etiqueta NFC
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: urlToWrite,
          },
        ],
      });

      setAlert({
        message: "¡Etiqueta NFC escrita exitosamente!",
        type: "success",
      });

      // Cerrar el modal después de escribir exitosamente
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Error al escribir en la etiqueta NFC:", error);
      setAlert({
        message: "No se pudo escribir en la etiqueta NFC.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizado del componente (JSX)
  return (
    <div className="nfc-root">
      <BackButton />
      <div className="nfc-page-container">
        <div
          className="nfc-status-banner"
          style={{
            background: hasNfc
              ? "var(--accent-positive-bg)"
              : "var(--accent-negative-bg)",
            color: hasNfc
              ? "var(--accent-positive-text)"
              : "var(--accent-negative-text)",
          }}
        >
          {hasNfc ? (
            <span>
              <FaMicrochip
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Tu dispositivo soporta NFC
            </span>
          ) : (
            <span>
              <FaExclamationCircle
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Este dispositivo no soporta NFC
            </span>
          )}
        </div>

        {/* Sección para lectura de etiquetas NFC */}
        {hasNfc && (
          <div className="nfc-reader-section">
            <h2>
              <FaSearch style={{ verticalAlign: "middle", marginRight: 8 }} />
              Leer Etiquetas NFC
            </h2>
            <p>
              Usa esta función para leer etiquetas NFC y ser redirigido
              automáticamente.
            </p>
            <div className="nfc-reader-wrapper">
              <NfcLink
                readOnly={true}
                onLinkSuccess={(url) => {
                  // Abrir la URL en una nueva pestaña cuando se lea exitosamente
                  window.open(url, "_blank");
                }}
                onClose={() => {}} // No necesitamos hacer nada al cerrar en este caso
              />
            </div>
          </div>
        )}

        <div className="nfc-form-container">
          <h1>
            <FaUserAlt style={{ verticalAlign: "middle", marginRight: 8 }} />
            Perfil de Contacto de Emergencia
          </h1>
          <p className="nfc-id">
            {profileId
              ? `ID de Perfil: ${profileId}`
              : "Crea tu perfil para obtener un ID."}
          </p>

          {alert && (
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={(e) => e.preventDefault()} className="nfc-form">
            {/* Secciones del formulario (sin cambios en los inputs) */}
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaDog style={{ verticalAlign: "middle", marginRight: 8 }} />
                Información de la Mascota
              </h2>
              {/* Inputs para petname, pettype, etc. */}
              <div className="form-group">
                <label htmlFor="pet-select">
                  <FaDog className="input-icon" /> Selecciona una Mascota
                </label>
                <select
                  id="pet-select"
                  value={selectedPet}
                  onChange={(e) => handlePetSelect(e.target.value)}
                  className="pet-select"
                  required
                >
                  <option value="">-- Selecciona una mascota --</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.pet_name} ({pet.pet_breed} - {pet.pet_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaDog className="input-icon" /> Nombre de la Mascota
                </label>
                <input
                  type="text"
                  value={petInfo.petname}
                  readOnly
                  className="read-only"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaDog className="input-icon" /> Tipo de Animal
                </label>
                <input
                  type="text"
                  value={petInfo.pettype}
                  readOnly
                  className="read-only"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaDog className="input-icon" /> Raza
                </label>
                <input
                  type="text"
                  value={petInfo.petbreed}
                  readOnly
                  className="read-only"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="petconditions">
                  Condiciones médicas o especiales
                </label>
                <textarea
                  id="petconditions"
                  name="petconditions"
                  value={petInfo.petconditions}
                  onChange={handlePetInfoChange}
                  placeholder="Condiciones médicas o especiales"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="petpartsigns">Señas particulares</label>
                <textarea
                  id="petpartsigns"
                  name="petpartsigns"
                  value={petInfo.petpartsigns}
                  onChange={handlePetInfoChange}
                  placeholder="Señas particulares"
                />
              </div>
            </section>
            <section className="nfc-section">
              <h2 className="nfc-section-title">
                <FaUserAlt
                  style={{ verticalAlign: "middle", marginRight: 8 }}
                />
                Información de Contacto
              </h2>
              {/* Inputs para phone, email, etc. */}
              <div className="nfc-form-group">
                <label htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={contactInfo.phone}
                  onChange={handleContactInfoChange}
                  placeholder="Teléfono"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="email">Email</label>
                <div className="email-selector">
                  <div className="email-options">
                    <button
                      type="button"
                      className={`email-option ${
                        emailOption === "saved" ? "active" : ""
                      }`}
                      onClick={() => handleEmailOptionChange("saved")}
                    >
                      Usar mi correo
                    </button>
                    <button
                      type="button"
                      className={`email-option ${
                        emailOption === "custom" ? "active" : ""
                      }`}
                      onClick={() => handleEmailOptionChange("custom")}
                    >
                      Otro correo
                    </button>
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={contactInfo.email}
                    onChange={handleContactInfoChange}
                    placeholder={
                      emailOption === "saved" ? userEmail : "Ingresa el correo"
                    }
                    required
                    autoComplete="off"
                    disabled={emailOption === "saved"}
                    className={emailOption === "saved" ? "disabled-email" : ""}
                  />
                </div>
              </div>
              <div className="nfc-form-group">
                <label htmlFor="address">Dirección</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={contactInfo.address}
                  onChange={handleContactInfoChange}
                  placeholder="Dirección"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="nfc-form-group">
                <label htmlFor="othercontact">
                  Otro método de contacto (ej: Instagram)
                </label>
                <input
                  id="othercontact"
                  type="text"
                  name="othercontact"
                  value={contactInfo.othercontact}
                  onChange={handleContactInfoChange}
                  placeholder="Otro método de contacto (ej: Instagram)"
                  autoComplete="off"
                />
              </div>
            </section>

            <div className="nfc-button-container">
              <div className="nfc-button-group">
                <button
                  type="button"
                  className="nfc-button primary"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveOnly(e);
                  }}
                >
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
              <div className="nfc-button-group" style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="nfc-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPlate(e);
                  }}
                  disabled={isLoading}
                >
                  <FaEye /> Ver Placa
                </button>
                <button
                  type="button"
                  className="nfc-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log("Botón Vincular Placa clickeado");
                    try {
                      // Asegurar que el perfil esté guardado antes de abrir el modal
                      if (!profileId) {
                        saveData().then((success) => {
                          if (success) {
                            setModalView("select");
                            setIsModalOpen(true);
                          } else {
                            setAlert({
                              message: "Debes guardar la información primero.",
                              type: "error",
                            });
                          }
                        });
                      } else {
                        setModalView("select");
                        setIsModalOpen(true);
                      }
                    } catch (error) {
                      console.error(
                        "Error al abrir modal de vinculación:",
                        error
                      );
                      setAlert({
                        message:
                          "Error al abrir la ventana de vinculación. Intenta de nuevo.",
                        type: "error",
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  <FaMicrochip /> Vincular Placa NFC/QR
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal (sin cambios en la estructura, pero la lógica que lo llama sí cambió) */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            // Si se cierra el modal mientras está en modo QR, limpiar scanResult para permitir reintentos
            if (modalView === "qr") setScanResult(null);
            setIsModalOpen(false);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: "#ffffff" }}>
                {modalView === "select"
                  ? "Vincular Placa"
                  : modalView === "qr"
                  ? "Escanear QR"
                  : modalView === "nfc"
                  ? "Acercar Placa NFC"
                  : modalView === "read"
                  ? "Leer Etiqueta NFC"
                  : "Ver Placa"}
              </h2>
              <button
                className="modal-close-button"
                onClick={() => {
                  // Si se cierra el modal desde la X en modo QR, limpiar scanResult
                  if (modalView === "qr") setScanResult(null);
                  setIsModalOpen(false);
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {modalView === "select" && (
                <div className="link-options">
                  <button
                    onClick={() => setModalView("qr")}
                    className="nfc-button primary"
                  >
                    <FaQrcode /> Escanear QR
                  </button>
                  {hasNfc && (
                    <>
                      <button
                        onClick={() => setModalView("nfc")}
                        className="nfc-button primary"
                      >
                        <FaMicrochip /> Vincular con NFC
                      </button>
                      <button
                        onClick={writeNfcTag}
                        className="nfc-button primary"
                        disabled={isLoading}
                      >
                        {isLoading ? "Escribiendo..." : "Escribir en NFC"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {modalView === "nfc" && (
                <div className="nfc-link-container">
                  <NfcLink
                    onLinkSuccess={(url) => {
                      handleNfcLinkSuccess(url);
                      setModalView("view");
                    }}
                    onClose={() => setModalView("select")}
                  />
                </div>
              )}
              {modalView === "qr" && !scanResult && (
                <div id="qr-scanner-container"></div>
              )}
              {modalView === "read" && (
                <div className="nfc-read-modal">
                  <NfcLink
                    readOnly={true}
                    onLinkSuccess={(url) => {
                      setReadResult(url);
                      if (url) {
                        redirectToUrl(url);
                      }
                    }}
                    onClose={() => setModalView("select")}
                  />
                </div>
              )}
              {modalView === "view" && (
                <div className="nfc-modal-body">
                  <h2>URL Pública de la Placa</h2>
                  <p style={{ color: "#ffffff" }}>
                    Comparte este enlace para que otros vean la información de
                    contacto de tu mascota:
                  </p>
                  <div className="public-url-container">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="public-url-input"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      className="copy-url-button"
                      onClick={handleCopyUrl}
                      title="Copiar al portapapeles"
                    >
                      Copiar
                    </button>
                  </div>
                  <button
                    className="unlink-url-button"
                    onClick={unlinkUrl}
                    disabled={isLoading || !publicUrl}
                  >
                    Desvincular URL
                  </button>
                  <div className="public-url-note" style={{ color: "#ffffff" }}>
                    <FaExclamationCircle /> Esta URL es pública. Cualquiera con
                    este enlace podrá ver la información de contacto de tu
                    mascota.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nfc;
