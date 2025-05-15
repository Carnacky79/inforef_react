import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { DxfViewer } from "../components/DxfViewer";

const MapManagementPage = () => {
  const { currentSite } = useData();
  const [serverIp, setServerIp] = useState(currentSite?.serverIp || "");
  const [serverPort, setServerPort] = useState(
    currentSite?.serverPort || 48300
  );
  const [mapFile, setMapFile] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [message, setMessage] = useState("");
  const [definedAreas, setDefinedAreas] = useState([]);
  const [areaName, setAreaName] = useState("");
  const [areaType, setAreaType] = useState("geofence");
  const [isDefiningArea, setIsDefiningArea] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".dxf")) {
      setMapFile(file);

      // Leggi il contenuto del file
      const reader = new FileReader();
      reader.onload = (event) => {
        setMapData(event.target.result);
        setMessage("Mappa caricata localmente.");
      };
      reader.readAsText(file);
    } else {
      setMessage("Formato file non valido. Caricare un file DXF.");
    }
  };

  const handleSave = () => {
    if (!mapFile) {
      setMessage("Caricare prima un file DXF.");
      return;
    }

    setMessage("Salvataggio in corso...");

    // Mock API call to save the configuration
    setTimeout(() => {
      setMessage("Configurazione salvata con successo!");
    }, 1000);

    // In a real implementation, you would send the data to the server
    // const formData = new FormData();
    // formData.append('mapFile', mapFile);
    // formData.append('serverIp', serverIp);
    // formData.append('serverPort', serverPort);
    // formData.append('siteId', currentSite.id);

    // fetch('/api/map-file', {
    //   method: 'POST',
    //   body: formData
    // }).then(...)
  };

  const handleAreaDefined = (points) => {
    if (areaName.trim() === "") {
      setMessage("Inserire un nome per l'area prima di definirla.");
      return;
    }

    const newArea = {
      id: Date.now(),
      name: areaName,
      type: areaType,
      points: points,
    };

    setDefinedAreas([...definedAreas, newArea]);
    setAreaName("");
    setIsDefiningArea(false);
    setMessage(`Area "${newArea.name}" definita con successo.`);
  };

  const startDefiningArea = () => {
    if (areaName.trim() === "") {
      setMessage("Inserire un nome per l'area prima di definirla.");
      return;
    }

    setIsDefiningArea(true);
    setMessage(
      "Fare clic sulla mappa per definire i punti dell'area. Doppio clic per completare."
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Gestione Mappa</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Configuration Form */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-medium">Configurazione Server</h2>
          <div>
            <label className="block mb-1 font-medium">Carica file DXF:</label>
            <input
              type="file"
              accept=".dxf"
              onChange={handleFileChange}
              className="w-full border rounded p-2"
            />
            {mapFile && (
              <p className="mt-2 text-sm text-green-600">
                File selezionato: {mapFile.name}
              </p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Indirizzo IP Server:
            </label>
            <input
              className="w-full p-2 border rounded"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Porta Server:</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="48300"
            />
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Salva Configurazione
          </button>
          {message && (
            <div className="mt-4 text-green-700 font-medium">{message}</div>
          )}
        </div>

        {/* Area Definition */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-medium">Definizione Aree</h2>
          <div>
            <label className="block mb-1 font-medium">Nome Area:</label>
            <input
              className="w-full p-2 border rounded"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="Area 1"
              disabled={isDefiningArea}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Tipo Area:</label>
            <select
              className="w-full p-2 border rounded"
              value={areaType}
              onChange={(e) => setAreaType(e.target.value)}
              disabled={isDefiningArea}
            >
              <option value="geofence">Geo-fence</option>
              <option value="attendance">Area presenze</option>
              <option value="restricted">Area ristretta</option>
            </select>
          </div>
          <button
            onClick={startDefiningArea}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={isDefiningArea || !mapData}
          >
            {isDefiningArea ? "Definizione in corso..." : "Definisci Area"}
          </button>

          <div className="mt-4">
            <h3 className="font-medium">Aree Definite:</h3>
            {definedAreas.length === 0 ? (
              <p className="text-gray-500 text-sm mt-2">
                Nessuna area definita
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-200">
                {definedAreas.map((area) => (
                  <li key={area.id} className="py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{area.name}</span>
                      <span className="text-sm text-gray-500">{area.type}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {area.points.length} punti definiti
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* DXF Viewer */}
        <div className="bg-white p-4 rounded shadow lg:col-span-1">
          <h2 className="text-lg font-medium mb-2">Anteprima Mappa</h2>
          <div className="h-96 overflow-hidden">
            <DxfViewer
              data={mapData}
              height="100%"
              onAreaDefined={isDefiningArea ? handleAreaDefined : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapManagementPage;
