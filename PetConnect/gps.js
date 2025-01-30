const locationForm = document.getElementById("locationForm");
const locationInput = document.getElementById("locationInput");
const coordinatesElement = document.getElementById("coordinates");
const mapIframe = document.getElementById("map");

locationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = locationInput.value.trim();

  if (input.includes(",")) {
    // Si el input tiene una coma, asumimos que son coordenadas (lat, lng)
    const [lat, lng] = input
      .split(",")
      .map((coord) => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      updateMap(lat, lng);
    } else {
      alert("Por favor ingresa coordenadas válidas.");
    }
  } else {
    // Si no hay coma, asumimos que es una dirección
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        input
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const { lat, lon } = data[0];
          updateMap(parseFloat(lat), parseFloat(lon));
        } else {
          alert("No se encontró la ubicación.");
        }
      })
      .catch((error) => {
        console.error("Error al buscar la ubicación:", error);
        alert("Hubo un problema al buscar la ubicación.");
      });
  }
});

function updateMap(lat, lng) {
  // Actualizar las coordenadas en pantalla
  coordinatesElement.textContent = `Latitud: ${lat}, Longitud: ${lng}`;

  // Actualizar el iframe para mostrar el mapa en la nueva ubicación
  mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    lng - 0.01
  },${lat - 0.01},${lng + 0.01},${
    lat + 0.01
  }&layer=mapnik&marker=${lat},${lng}`;
}
