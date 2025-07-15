import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../supabase";
import { User } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  FaPlay,
  FaStop,
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

  // Estados del componente (sin cambios)
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

  // **NUEVO**: Función para iniciar la lectura de etiquetas NFC
  const startNfcReading = async () => {
    if (!hasNfc) {
      setAlert({
        message: "Tu dispositivo no soporta NFC.",
        type: "error",
      });
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      setNfcReader(ndef);
      setIsReading(true);
      setReadResult(null);

      setAlert({
        message: "Acerca una etiqueta NFC para leerla...",
        type: "success",
      });

      // Configurar el listener para la lectura
      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        console.log(`NFC tag read with serial number: ${serialNumber}`);

        // Procesar los registros del mensaje NDEF
        for (const record of message.records) {
          if (record.recordType === "url") {
            const decoder = new TextDecoder();
            const url = decoder.decode(record.data);
            console.log("URL found in NFC tag:", url);

            setReadResult(url);
            setAlert({
              message: `URL detectada: ${url}`,
              type: "success",
            });

            // Preguntar al usuario si quiere ser redirigido
            setTimeout(() => {
              if (
                window.confirm(
                  `Se detectó una URL en la etiqueta NFC: ${url}\n\n¿Quieres ser redirigido a esta URL?`
                )
              ) {
                redirectToUrl(url);
              }
            }, 1000);

            break;
          } else if (record.recordType === "text") {
            const decoder = new TextDecoder();
            const text = decoder.decode(record.data);
            console.log("Text found in NFC tag:", text);

            // Verificar si el texto contiene una URL
            if (text.startsWith("http://") || text.startsWith("https://")) {
              setReadResult(text);
              setAlert({
                message: `URL detectada en texto: ${text}`,
                type: "success",
              });

              setTimeout(() => {
                if (
                  window.confirm(
                    `Se detectó una URL en la etiqueta NFC: ${text}\n\n¿Quieres ser redirigido a esta URL?`
                  )
                ) {
                  redirectToUrl(text);
                }
              }, 1000);
            } else {
              setReadResult(text);
              setAlert({
                message: `Texto detectado: ${text}`,
                type: "success",
              });
            }
            break;
          }
        }
      });

      // Configurar el listener para errores
      ndef.addEventListener("readingerror", () => {
        setAlert({
          message: "Error al leer la etiqueta NFC. Inténtalo de nuevo.",
          type: "error",
        });
      });

      // Iniciar el escaneo
      await ndef.scan();
    } catch (error) {
      console.error("Error starting NFC reading:", error);
      setIsReading(false);
      setAlert({
        message: "Error al iniciar la lectura NFC. Verifica los permisos.",
        type: "error",
      });
    }
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
          message: "Esta URL ya está vinculada a otro perfil. Debes desvincularla primero antes de asignarla a tu mascota.",
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
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        { qrbox: { width: 250, height: 250 }, fps: 5, facingMode: { exact: "environment" } },
        false
      );
      const onScanSuccess = async (result: string) => {
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

      scanner.render(onScanSuccess, () => {});
      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [modalView, isModalOpen, scanResult, user, localUserId]);

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
        .select("id")
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

      // 3. Realizar la operación de guardado
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
  const generatePublicUrl = async (): Promise<string> => {
    // Si ya hay un resultado de escaneo, usarlo
    if (scanResult) {
      return scanResult;
    }

    // Si no hay profileId, retornar cadena vacía
    if (!profileId) return "";

    try {
      // Obtener la URL asignada de la base de datos
      const { data: contactInfo, error } = await supabase
        .from("pettag_contactinfo")
        .select("url_asigned")
        .eq("id", profileId)
        .single();

      if (error) {
        console.error("Error al obtener la URL asignada:", error);
        return "";
      }

      return contactInfo?.url_asigned || "";
    } catch (error) {
      console.error("Error al obtener la URL asignada:", error);
      return "";
    }
  };

  // Handle view plate button click
  const handleViewPlate = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Si hay un resultado de escaneo, mostrarlo directamente
      if (scanResult) {
        setPublicUrl(scanResult);
        setModalView("view");
        setIsModalOpen(true);
        return;
      }

      // Si no hay resultado de escaneo, verificar el perfil
      if (!profileId) {
        setAlert({
          message:
            "Primero debes guardar la información de la placa o escanear un código QR.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      // Verificar si hay una URL asignada en la base de datos
      const { data: contactInfo, error } = await supabase
        .from("pettag_contactinfo")
        .select("url_asigned")
        .eq("id", profileId)
        .single();

      if (error) throw error;

      if (!contactInfo?.url_asigned) {
        setAlert({
          message:
            "No hay una URL asignada a esta mascota. Por favor, escanea un código QR primero.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      // Si hay URL asignada, mostrarla
      setPublicUrl(contactInfo.url_asigned || generatePublicUrl());
      setModalView("view");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al verificar la URL asignada:", error);
      setAlert({
        message:
          "Error al verificar la información de la placa. Intenta de nuevo.",
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

  // **MODIFICADO**: El modal de vinculación ahora depende de que exista un `profileId`.
  const handleOpenModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (form.checkValidity()) {
      const success = await saveData();
      if (success && profileId) {
        // Solo abre el modal si se guardó y tenemos un ID de perfil.
        setAlert({
          message: "Perfil guardado. Ahora puedes vincular una placa.",
          type: "success",
        });
        setIsModalOpen(true);
        setModalView("select");
      } else if (!profileId) {
        setAlert({
          message: "No se pudo obtener un ID de perfil para vincular.",
          type: "error",
        });
      }
    } else {
      form.reportValidity();
    }
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

      // Usar la URL escaneada si existe, de lo contrario mostrar error
      if (!scanResult) {
        setAlert({
          message: "No hay una URL escaneada. Primero escanea un código QR.",
          type: "error",
        });
        return;
      }

      // Validar la URL
      let urlToWrite = scanResult.trim();
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

        {/* **NUEVO**: Sección para lectura de etiquetas NFC */}
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
            <div className="nfc-reader-controls">
              {!isReading ? (
                <button
                  className="nfc-button primary"
                  onClick={startNfcReading}
                  disabled={isLoading}
                >
                  <FaPlay style={{ marginRight: 8 }} />
                  Iniciar Lectura NFC
                </button>
              ) : (
                <button
                  className="nfc-button secondary"
                  onClick={stopNfcReading}
                >
                  <FaStop style={{ marginRight: 8 }} />
                  Detener Lectura
                </button>
              )}
            </div>
            {readResult && (
              <div className="nfc-read-result">
                <h3>Resultado de la lectura:</h3>
                <p>
                  <strong>{readResult}</strong>
                </p>
              </div>
            )}
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

          <form onSubmit={handleOpenModal} className="nfc-form">
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
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={contactInfo.email}
                  onChange={handleContactInfoChange}
                  placeholder="Email"
                  required
                  autoComplete="off"
                />
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
                  type="submit"
                  className="nfc-button primary"
                  disabled={isLoading}
                  onClick={handleSaveOnly}
                >
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  className="nfc-button"
                  onClick={handleViewPlate}
                  disabled={!profileId}
                >
                  <FaEye /> Ver Placa
                </button>
                <button
                  type="button"
                  className="nfc-button"
                  onClick={() => {
                    setModalView("select");
                    setIsModalOpen(true);
                  }}
                  disabled={!profileId}
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
        <div className="modal-overlay" onClick={() => {
          // Si se cierra el modal mientras está en modo QR, limpiar scanResult para permitir reintentos
          if (modalView === "qr") setScanResult(null);
          setIsModalOpen(false);
        }}>
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
                  <button onClick={() => setModalView("qr")}>
                    <FaQrcode /> Escanear QR
                  </button>
                  {hasNfc && (
                    <>
                      <button
                        onClick={() => {
                          setModalView("nfc");
                          writeNfcTag();
                        }}
                        className="nfc-button"
                      >
                        <FaMicrochip /> Escribir en NFC
                      </button>
                      <button
                        onClick={() => {
                          setModalView("read");
                          startNfcReading();
                        }}
                        className="nfc-button secondary"
                      >
                        <FaSearch /> Leer Etiqueta NFC
                      </button>
                    </>
                  )}
                </div>
              )}
              {modalView === "qr" && !scanResult && (
                <div id="qr-scanner-container"></div>
              )}
              {modalView === "read" && (
                <div className="nfc-read-modal">
                  <div className="nfc-reading-status">
                    {isReading ? (
                      <div className="reading-active">
                        <FaSearch className="spinning-icon" />
                        <p>Esperando etiqueta NFC...</p>
                        <p className="reading-instruction">
                          Acerca tu dispositivo a una etiqueta NFC para leerla
                        </p>
                        <button
                          className="nfc-button secondary"
                          onClick={stopNfcReading}
                        >
                          <FaStop /> Detener Lectura
                        </button>
                      </div>
                    ) : (
                      <div className="reading-inactive">
                        <button
                          className="nfc-button primary"
                          onClick={startNfcReading}
                        >
                          <FaPlay /> Iniciar Lectura NFC
                        </button>
                      </div>
                    )}
                  </div>
                  {readResult && (
                    <div className="nfc-read-result-modal">
                      <h3>URL Detectada:</h3>
                      <div className="url-result">
                        <input
                          type="text"
                          value={readResult}
                          readOnly
                          className="url-input"
                        />
                        <button
                          className="redirect-button"
                          onClick={() => redirectToUrl(readResult)}
                        >
                          Ir a URL
                        </button>
                      </div>
                    </div>
                  )}
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
                  <div
                    className="public-url-note"
                    style={{ color: "#ffffff" }}
                  >
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
