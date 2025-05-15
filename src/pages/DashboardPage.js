import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { DxfViewer } from "../components/DxfViewer";

const DashboardPage = () => {
  const {
    sites,
    currentSite,
    selectSite,
    employees,
    assets,
    tags,
    tagAssociations,
    positions,
  } = useData();

  const [mapData, setMapData] = useState(null);
  const [tagPositions, setTagPositions] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(() => {
    if (!currentSite && sites.length > 0) {
      selectSite(sites[0].id);
    }
  }, [currentSite, sites, selectSite]);

  // Caricamento dei dati della mappa (simulato)
  useEffect(() => {
    if (currentSite) {
      // In un'implementazione reale, caricheresti il file DXF dal server
      // Per ora, simuliamo il caricamento con dati di esempio
      fetch("/example.dxf")
        .then((response) => response.text())
        .then((data) => {
          setMapData(data);
        })
        .catch((error) => {
          console.error("Errore nel caricamento della mappa:", error);
          // Usa dati di esempio per il test
          setMapData(`
0
SECTION
2
ENTITIES
0
LINE
8
Layer_1
10
0
20
0
30
0
11
100
21
0
31
0
0
LINE
8
Layer_1
10
100
20
0
30
0
11
100
21
100
31
0
0
LINE
8
Layer_1
10
100
20
100
30
0
11
0
21
100
31
0
0
LINE
8
Layer_1
10
0
20
100
30
0
11
0
21
0
31
0
0
ENDSEC
0
EOF
          `);
        });
    }
  }, [currentSite]);

  // Aggiorna le posizioni dei tag con informazioni aggiuntive
  useEffect(() => {
    const enhancedPositions = {};

    Object.entries(positions).forEach(([tagId, pos]) => {
      const association = tagAssociations.find((a) => a.tagId === tagId);
      if (!association) return;

      const entity =
        association.targetType === "employee"
          ? employees.find((e) => e.id === association.targetId)
          : assets.find((a) => a.id === association.targetId);

      if (entity) {
        enhancedPositions[tagId] = {
          ...pos,
          name: entity.name,
          type: association.targetType,
          entityId: association.targetId,
        };
      }
    });

    setTagPositions(enhancedPositions);
  }, [positions, tagAssociations, employees, assets]);

  // Gestisce la selezione di un tag
  const handleTagSelect = (tagId) => {
    setSelectedTag(tagId);

    const association = tagAssociations.find((a) => a.tagId === tagId);
    if (association) {
      const entity =
        association.targetType === "employee"
          ? employees.find((e) => e.id === association.targetId)
          : assets.find((a) => a.id === association.targetId);

      setSelectedEntity(entity);
    } else {
      setSelectedEntity(null);
    }
  };

  const countByType = (type) =>
    tagAssociations.filter((a) => a.targetType === type).length;

  const countUnassociated = () =>
    tags.filter((t) => !tagAssociations.find((a) => a.tagId === t.id)).length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Dashboard - {currentSite?.name}
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium">Dipendenti Presenti</h2>
          <p className="text-2xl">{countByType("employee")}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium">Asset Tracciati</h2>
          <p className="text-2xl">{countByType("asset")}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium">Tag Disponibili</h2>
          <p className="text-2xl">{countUnassociated()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map with real-time positions */}
        <div className="lg:col-span-3 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Mappa in tempo reale</h2>
          <div className="border rounded p-2 bg-gray-50">
            <div style={{ height: "500px" }}>
              <DxfViewer
                data={mapData}
                height="100%"
                tagPositions={tagPositions}
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
            Dipendenti
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-4 mr-1"></span>{" "}
            Asset
          </div>
        </div>

        {/* Tag list */}
        <div className="lg:col-span-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-2">Tag Attivi</h2>

          {selectedTag && selectedEntity ? (
            <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-800">
                {selectedEntity.name}
              </h3>
              <p className="text-sm text-blue-600">Tag: {selectedTag}</p>
              <p className="text-sm text-blue-600">
                Tipo: {selectedEntity.role || selectedEntity.type || "N/A"}
              </p>
              <p className="text-sm text-blue-600">
                Posizione: ({positions[selectedTag]?.x.toFixed(2)},{" "}
                {positions[selectedTag]?.y.toFixed(2)})
              </p>

              <button
                onClick={() => setSelectedTag(null)}
                className="mt-2 text-xs text-blue-800 hover:text-blue-600"
              >
                Chiudi
              </button>
            </div>
          ) : null}

          <div className="overflow-auto max-h-96">
            <ul className="divide-y divide-gray-200">
              {Object.entries(tagPositions).map(([tagId, info]) => (
                <li
                  key={tagId}
                  className={`py-3 px-2 cursor-pointer hover:bg-gray-50 ${
                    selectedTag === tagId ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleTagSelect(tagId)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        info.type === "employee"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <div>
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-gray-500">
                        {tagId} • ({info.x.toFixed(1)}, {info.y.toFixed(1)})
                      </div>
                    </div>
                  </div>
                </li>
              ))}

              {Object.keys(tagPositions).length === 0 && (
                <li className="py-3 px-2 text-gray-500">
                  Nessun tag attivo rilevato
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
