export const darkMapStyle = [
  // --- Baza ---
  {
    elementType: "geometry",
    stylers: [{ color: "#0d0d0d" }],
  },
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  // --- Administracja ---
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5a5a5a" }, { visibility: "on" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2 }],
  },

  // --- Teren ---
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#111111" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#141414" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#101510" }],
  },

  // --- POI – domyślnie ukryte ---
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },

  // --- POI – sklepy / biznesy ---
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#1a1410" }, { visibility: "on" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b08d55" }, { visibility: "on" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2.5 }, { visibility: "on" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -80 }, { lightness: -40 }],
  },

  // --- POI – miejsca kultu (kościoły, meczety itp.) ---
  {
    featureType: "poi.place_of_worship",
    elementType: "geometry",
    stylers: [{ color: "#181418" }, { visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a7a6a" }, { visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2.5 }, { visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -90 }, { lightness: -50 }],
  },

  // --- POI – medyczne (szpitale, apteki) ---
  {
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [{ color: "#0e1414" }, { visibility: "on" }],
  },
  {
    featureType: "poi.medical",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6a9a8a" }, { visibility: "on" }],
  },
  {
    featureType: "poi.medical",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2.5 }, { visibility: "on" }],
  },
  {
    featureType: "poi.medical",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -70 }, { lightness: -40 }],
  },

  // --- POI – szkoły ---
  {
    featureType: "poi.school",
    elementType: "geometry",
    stylers: [{ color: "#131318" }, { visibility: "on" }],
  },
  {
    featureType: "poi.school",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7a7a8a" }, { visibility: "on" }],
  },
  {
    featureType: "poi.school",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2.5 }, { visibility: "on" }],
  },
  {
    featureType: "poi.school",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -90 }, { lightness: -50 }],
  },

  // --- POI – parki ---
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0b1a0b" }, { visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3a5a3a" }, { visibility: "on" }],
  },

  // --- Drogi ---
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f1f1f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#161616" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#252525" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2e2e2e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },

  // --- Transport publiczny ---
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#141414" }, { visibility: "on" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6a6a7a" }, { visibility: "on" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { weight: 2 }, { visibility: "on" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }, { saturation: -100 }, { lightness: -60 }],
  },

  // --- Woda ---
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1a10" }],
  },
  {
    featureType: "water",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
];
