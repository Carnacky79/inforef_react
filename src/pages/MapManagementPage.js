import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { DxfViewer } from "../components/DxfViewer";

const MapManagementPage = () => {
  const { currentSite, updateSite } = useData();
  const [serverIp, setServerIp] = useState(currentSite?.serverIp || "");
  const [serverPort, setServerPort] = useState(
    currentSite?.serverPort || 48300
  );
  const [mapFile, setMapFile] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [message, setMessage] = useState("");

  // Carica la configurazione salvata quando la pagina viene caricata
  useEffect(() => {
    loadSavedConfiguration();
  }, []);

  // Carica la configurazione salvata
  const loadSavedConfiguration = () => {
    // Tenta di caricare la mappa dal localStorage
    try {
      const savedMapData = localStorage.getItem("blueiot_mapData");
      const savedMapName = localStorage.getItem("blueiot_mapName");
      const savedServerIp = localStorage.getItem("blueiot_serverIp");
      const savedServerPort = localStorage.getItem("blueiot_serverPort");

      if (savedMapData) {
        setMapData(savedMapData);

        if (savedMapName) {
          setMapFile({ name: savedMapName });
          setMessage("Configurazione caricata automaticamente.");
        }

        if (savedServerIp) {
          setServerIp(savedServerIp);
        }

        if (savedServerPort) {
          setServerPort(parseInt(savedServerPort) || 48300);
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento della configurazione:", error);
    }
  };

  // Salva la configurazione corrente
  const saveCurrentConfiguration = () => {
    try {
      if (mapData) {
        localStorage.setItem("blueiot_mapData", mapData);
      }

      if (mapFile?.name) {
        localStorage.setItem("blueiot_mapName", mapFile.name);
      }

      localStorage.setItem("blueiot_serverIp", serverIp);
      localStorage.setItem("blueiot_serverPort", serverPort.toString());

      // Se l'API updateSite è disponibile nel contesto, aggiorna anche lì
      if (updateSite && currentSite) {
        updateSite({
          ...currentSite,
          serverIp,
          serverPort,
          mapFile: mapFile?.name || currentSite.mapFile,
        });
      }

      setMessage("Configurazione salvata con successo!");
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione:", error);
      setMessage("Errore nel salvataggio della configurazione.");
    }
  };

  // Gestisce il caricamento dei file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".dxf")) {
      setMapFile(file);

      // Usa FileReader per leggere il contenuto del file
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;

        // Verifica che il file sia un DXF valido (dovrebbe iniziare con 0\nSECTION o simile)
        if (
          typeof result === "string" &&
          (result.trim().startsWith("0") || result.includes("SECTION"))
        ) {
          setMapData(result);
          setMessage("Mappa caricata correttamente.");

          // Salva automaticamente il file caricato nel localStorage
          localStorage.setItem("blueiot_mapData", result);
          localStorage.setItem("blueiot_mapName", file.name);
        } else {
          console.warn(
            "Il file potrebbe non essere un file DXF valido:",
            result.substring(0, 100)
          );
          setMessage(
            "Avviso: Il file potrebbe non essere un DXF valido. Controllare il formato."
          );
        }
      };

      // Leggi come testo per i file DXF
      reader.readAsText(file);
    } else {
      setMessage("Formato file non valido. Caricare un file DXF (.dxf).");
    }
  };

  const handleSave = () => {
    // Salva la configurazione
    saveCurrentConfiguration();

    // In una implementazione reale, dovresti inviare i dati al server
    // const formData = new FormData();
    // formData.append('mapFile', mapFile);
    // formData.append('serverIp', serverIp);
    // formData.append('serverPort', serverPort);
    // formData.append('siteId', currentSite.id);
    // fetch('/api/map-file', { method: 'POST', body: formData });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Gestione Mappa</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Configuration Form */}
        <div className="bg-white p-4 rounded shadow space-y-4 lg:col-span-1">
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
              onChange={(e) => setServerPort(parseInt(e.target.value) || 48300)}
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

        {/* DXF Viewer */}
        <div className="bg-white p-4 rounded shadow lg:col-span-3">
          <h2 className="text-lg font-medium mb-2">Planimetria</h2>
          <div className="h-[600px] overflow-hidden">
            <DxfViewer data={mapData} height="100%" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapManagementPage;
