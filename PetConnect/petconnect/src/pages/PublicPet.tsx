import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "../supabase";
import Loader from "../components/Loader";
import ThemeToggle from "../components/ThemeToggle";
import AlertMessage from "../components/AlertMessage";
import "../styles/PublicPet.css";

interface PublicPetData {
  petname: string;
  pettype: string;
  petbreed: string;
  petconditions: string;
  petpartsigns: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  othercontact: string | null;
}

const PublicPet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [petData, setPetData] = useState<PublicPetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("pettag_contactinfo")
        .select(
          "petname, pettype, petbreed, petconditions, petpartsigns, phone, email, address, othercontact"
        )
        .eq("id", id)
        .single();

      if (error) {
        setError("No se encontró la información de la mascota.");
      } else if (data) {
        setPetData(data as PublicPetData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <Loader />;

  if (error)
    return (
      <AlertMessage
        message={error}
        type="error"
        onClose={() => setError(null)}
      />
    );

  if (!petData) return null;

  return (
    <div>
      <ThemeToggle />
      <div className="public-pet-container">
        <h1 className="public-pet-title">{petData.petname}</h1>
        <p className="public-pet-title-p">
          <strong className="public-pet-title-p-strong">Tipo:</strong>{" "}
          {petData.pettype}
        </p>
        <p className="public-pet-title-p">
          <strong className="public-pet-title-p-strong">Raza:</strong>{" "}
          {petData.petbreed}
        </p>
        {petData.petconditions && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">Condiciones:</strong>{" "}
            {petData.petconditions}
          </p>
        )}
        {petData.petpartsigns && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">
              Señas particulares:
            </strong>{" "}
            {petData.petpartsigns}
          </p>
        )}
        <h2 className="public-pet-title-h2">Contacto</h2>
        {petData.phone && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">Teléfono:</strong>{" "}
            {petData.phone}
          </p>
        )}
        {petData.email && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">Email:</strong>{" "}
            {petData.email}
          </p>
        )}
        {petData.address && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">Dirección:</strong>{" "}
            {petData.address}
          </p>
        )}
        {petData.othercontact && (
          <p className="public-pet-title-p">
            <strong className="public-pet-title-p-strong">
              Otro contacto:
            </strong>{" "}
            {petData.othercontact}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicPet;
