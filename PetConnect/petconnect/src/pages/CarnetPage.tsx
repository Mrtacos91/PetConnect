import React, { useState } from "react";
import Carnet from "../components/Carnet";
import { FaPlus } from "react-icons/fa";
import BackButton from "../components/BackButton";

interface CarnetData {
  id: number;
  petName: string;
  petSpecies: string;
}

const CarnetPage: React.FC = () => {
  const [carnets, setCarnets] = useState<CarnetData[]>([
    { id: 1, petName: "Firulais", petSpecies: "Canino" },
  ]);

  const handleCreateNewCarnet = () => {
    const newId =
      carnets.length > 0 ? Math.max(...carnets.map((c) => c.id)) + 1 : 1;
    const newCarnet: CarnetData = {
      id: newId,
      petName: `Nueva Mascota ${newId}`,
      petSpecies: "Sin especificar",
    };
    setCarnets([...carnets, newCarnet]);

    // Desplazar al final de la página para ver el nuevo carnet
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleUpdateCarnet = (
    id: number,
    petName: string,
    petSpecies: string
  ) => {
    setCarnets(
      carnets.map((carnet) => {
        if (carnet.id === id) {
          return { ...carnet, petName, petSpecies };
        }
        return carnet;
      })
    );
  };

  const handleDeleteCarnet = (id: number) => {
    setCarnets(carnets.filter((carnet) => carnet.id !== id));
  };

  return (
    <div className="carnets-page-container">
      <BackButton />
      <div className="carnets-header">
        <h1>Mis Carnets de Vacunación</h1>
        <button
          className="carnet-action-button add-button"
          onClick={handleCreateNewCarnet}
        >
          <FaPlus /> <span>Nuevo Carnet</span>
        </button>
      </div>

      <div className="carnets-list">
        {carnets.map((carnet) => (
          <div key={carnet.id} className="carnet-wrapper">
            <Carnet
              carnetId={carnet.id}
              petName={carnet.petName}
              petSpecies={carnet.petSpecies}
              onCreateNewCarnet={handleCreateNewCarnet}
              onUpdateCarnet={handleUpdateCarnet}
              onDeleteCarnet={handleDeleteCarnet}
            />
          </div>
        ))}
      </div>

    </div>
  );
};

export default CarnetPage;
