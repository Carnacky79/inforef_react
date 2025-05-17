import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * Componente DxfViewer con qualità migliorata
 * Ottimizzato per una visualizzazione chiara delle planimetrie
 */
export function DxfViewer({ data, width = "100%", height = "400px" }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const animationFrameRef = useRef(null);

  // Inizializza il renderer Three.js con alta qualità
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      setLoading(true);

      // Ottieni le dimensioni del container
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Inizializza la scena Three.js
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff); // Sfondo bianco per maggiore chiarezza
      sceneRef.current = scene;

      // Inizializza la camera
      const camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        10000
      );
      camera.position.set(0, 0, 100);
      cameraRef.current = camera;

      // Inizializza il renderer con alta qualità
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(width, height);
      // Usa un pixel ratio più alto per maggiore nitidezza
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Aggiungi controlli per navigazione
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = true;
      controls.minDistance = 10;
      controls.maxDistance = 5000;
      controls.maxPolarAngle = Math.PI / 2;
      controls.enableRotate = false; // Disabilita rotazione per planimetrie 2D
      controlsRef.current = controls;

      // Aggiungi luci
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Luce piena per planimetrie
      scene.add(ambientLight);

      // Funzione di animazione
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      // Gestione ridimensionamento finestra
      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current)
          return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();

        rendererRef.current.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      setLoading(false);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        if (rendererRef.current) {
          containerRef.current?.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }

        // Pulisci la scena
        if (sceneRef.current) {
          sceneRef.current.clear();
        }
      };
    } catch (error) {
      console.error("Errore nell'inizializzazione del visualizzatore:", error);
      setError(`Errore nell'inizializzazione: ${error.message}`);
      setLoading(false);
    }
  }, []);

  // Carica e visualizza i dati DXF
  useEffect(() => {
    if (!sceneRef.current || !data) return;

    setLoading(true);

    try {
      console.log("Inizio parsing DXF...");

      // Rimuovi geometrie DXF precedenti
      sceneRef.current.children = sceneRef.current.children.filter(
        (child) => !(child instanceof THREE.Line && child.userData.isDxf)
      );

      // Parser DXF
      const result = parseDxfToThree(data, sceneRef.current);

      if (result.entitiesCount > 0) {
        // Centra la vista sui contenuti
        centerView();
        console.log(
          "Parsing DXF completato con successo:",
          result.entitiesCount,
          "entità"
        );
      } else {
        console.warn("Nessuna entità DXF trovata da visualizzare");
      }

      setLoading(false);
    } catch (err) {
      console.error("Errore durante il caricamento del DXF:", err);
      setError(`Errore durante il parsing DXF: ${err.message}`);
      setLoading(false);
    }
  }, [data]);

  // Parser DXF migliorato con supporto per più entità e miglior rendering
  const parseDxfToThree = (dxfContent, scene) => {
    // Info di debug e conteggio
    const result = {
      entitiesCount: 0,
      errors: [],
    };

    // Verifica se è un file DXF valido
    if (!dxfContent || !dxfContent.includes("SECTION")) {
      throw new Error("File DXF non valido o formato non riconosciuto");
    }

    // Estrai la sezione ENTITIES
    let entitiesSection = "";
    try {
      const entitiesMatch = dxfContent.match(/ENTITIES([\s\S]*?)ENDSEC/);
      if (entitiesMatch) {
        entitiesSection = entitiesMatch[1];
      } else {
        result.errors.push("Sezione ENTITIES non trovata");
        return result;
      }
    } catch (err) {
      result.errors.push(
        `Errore nell'estrazione della sezione ENTITIES: ${err.message}`
      );
      return result;
    }

    // Funzione helper per creare una linea
    const createLine = (points, layer) => {
      // Materiale per linee più spesse e più scure
      const material = new THREE.LineBasicMaterial({
        color: 0x000000, // Nero per planimetrie
        linewidth: 1.5, // Più spesso per maggiore visibilità (nota: il valore effettivo dipende dal browser)
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.userData = { isDxf: true, layer };
      scene.add(line);
      result.entitiesCount++;
      return line;
    };

    // Analizza le entità
    try {
      // LINES - Linee semplici
      parseEntityType(entitiesSection, "LINE", (entityData) => {
        try {
          const x1 = getCoord(entityData, 10);
          const y1 = getCoord(entityData, 20);
          const z1 = getCoord(entityData, 30, 0);
          const x2 = getCoord(entityData, 11);
          const y2 = getCoord(entityData, 21);
          const z2 = getCoord(entityData, 31, 0);
          const layer = getLayerName(entityData);

          const points = [
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2),
          ];

          createLine(points, layer);
        } catch (err) {
          console.log(`Errore nel parsing di LINE: ${err.message}`);
        }
      });

      // CIRCLES - Cerchi
      parseEntityType(entitiesSection, "CIRCLE", (entityData) => {
        try {
          const x = getCoord(entityData, 10);
          const y = getCoord(entityData, 20);
          const z = getCoord(entityData, 30, 0);
          const radius = getCoord(entityData, 40);
          const layer = getLayerName(entityData);

          // Più segmenti per cerchi più lisci
          const segments = Math.max(48, Math.floor(radius * 3));
          const points = [];

          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(
              new THREE.Vector3(
                x + radius * Math.cos(theta),
                y + radius * Math.sin(theta),
                z
              )
            );
          }

          createLine(points, layer);
        } catch (err) {
          console.log(`Errore nel parsing di CIRCLE: ${err.message}`);
        }
      });

      // ARCS - Archi
      parseEntityType(entitiesSection, "ARC", (entityData) => {
        try {
          const x = getCoord(entityData, 10);
          const y = getCoord(entityData, 20);
          const z = getCoord(entityData, 30, 0);
          const radius = getCoord(entityData, 40);
          const startAngle = getCoord(entityData, 50) * (Math.PI / 180);
          const endAngle = getCoord(entityData, 51) * (Math.PI / 180);
          const layer = getLayerName(entityData);

          // Più segmenti per archi più lisci
          const segments = Math.max(32, Math.floor(radius * 2));
          const points = [];

          const angle =
            endAngle > startAngle
              ? endAngle - startAngle
              : Math.PI * 2 + endAngle - startAngle;

          for (let i = 0; i <= segments; i++) {
            const theta = startAngle + (i / segments) * angle;
            points.push(
              new THREE.Vector3(
                x + radius * Math.cos(theta),
                y + radius * Math.sin(theta),
                z
              )
            );
          }

          createLine(points, layer);
        } catch (err) {
          console.log(`Errore nel parsing di ARC: ${err.message}`);
        }
      });

      // POLYLINES
      parseEntityType(entitiesSection, "POLYLINE", (entityData) => {
        try {
          const layer = getLayerName(entityData);
          const vertices = [];
          let currentVertex = entityData.indexOf("VERTEX");

          while (currentVertex !== -1) {
            const endVertex = entityData.indexOf("VERTEX", currentVertex + 1);
            const vertexData =
              endVertex !== -1
                ? entityData.substring(currentVertex, endVertex)
                : entityData.substring(currentVertex);

            try {
              const x = getCoord(vertexData, 10);
              const y = getCoord(vertexData, 20);
              const z = getCoord(vertexData, 30, 0);
              vertices.push(new THREE.Vector3(x, y, z));
            } catch (err) {
              // Ignora errori nei vertici
            }

            currentVertex = endVertex;
          }

          if (vertices.length >= 2) {
            createLine(vertices, layer);
          }
        } catch (err) {
          console.log(`Errore nel parsing di POLYLINE: ${err.message}`);
        }
      });

      // LWPOLYLINES
      parseEntityType(entitiesSection, "LWPOLYLINE", (entityData) => {
        try {
          const layer = getLayerName(entityData);
          const vertices = [];

          // Trova tutte le coppie di coordinate
          const coordPattern = /10\s+([-\d.]+)[\s\S]*?20\s+([-\d.]+)/g;
          let coordMatch;

          while ((coordMatch = coordPattern.exec(entityData)) !== null) {
            const x = parseFloat(coordMatch[1]);
            const y = parseFloat(coordMatch[2]);
            vertices.push(new THREE.Vector3(x, y, 0));
          }

          if (vertices.length >= 2) {
            // Verifica se è chiusa (flag 70 contiene un valore con bit 1 impostato)
            const closedMatch = entityData.match(/70\s+(\d+)/);
            const isClosed =
              closedMatch && (parseInt(closedMatch[1]) & 1) !== 0;

            if (isClosed && vertices.length > 1) {
              vertices.push(vertices[0].clone());
            }

            createLine(vertices, layer);
          }
        } catch (err) {
          console.log(`Errore nel parsing di LWPOLYLINE: ${err.message}`);
        }
      });

      // INSERT (blocchi)
      parseEntityType(entitiesSection, "INSERT", (entityData) => {
        try {
          const x = getCoord(entityData, 10, 0);
          const y = getCoord(entityData, 20, 0);
          const z = getCoord(entityData, 30, 0);
          const layer = getLayerName(entityData);

          // Crea un piccolo quadrato per rappresentare l'inserimento
          const points = [
            new THREE.Vector3(x - 0.2, y - 0.2, z),
            new THREE.Vector3(x + 0.2, y - 0.2, z),
            new THREE.Vector3(x + 0.2, y + 0.2, z),
            new THREE.Vector3(x - 0.2, y + 0.2, z),
            new THREE.Vector3(x - 0.2, y - 0.2, z),
          ];

          createLine(points, layer);
        } catch (err) {
          console.log(`Errore nel parsing di INSERT: ${err.message}`);
        }
      });
    } catch (err) {
      result.errors.push(`Errore generale nel parsing: ${err.message}`);
    }

    return result;
  };

  // Funzione helper per estrarre coordinate
  const getCoord = (entityData, groupCode, defaultValue = null) => {
    const match = entityData.match(new RegExp(`${groupCode}\\s+([-\\d.]+)`));
    if (!match && defaultValue !== null) return defaultValue;
    if (!match) throw new Error(`Gruppo ${groupCode} non trovato`);
    return parseFloat(match[1]);
  };

  // Funzione helper per estrarre il nome del layer
  const getLayerName = (entityData) => {
    const match = entityData.match(/8\s+([^\s]+)/);
    return match ? match[1] : "0";
  };

  // Funzione helper per analizzare le entità di un tipo specifico
  const parseEntityType = (data, entityType, callback) => {
    let startIdx = data.indexOf(entityType);

    while (startIdx !== -1) {
      // Cerca l'inizio della prossima entità o la fine della sezione
      let endIdx = data.indexOf("\n 0", startIdx + entityType.length);
      if (endIdx === -1) endIdx = data.length;

      // Estrai i dati dell'entità
      const entityData = data.substring(startIdx, endIdx);

      // Processa l'entità
      callback(entityData);

      // Passa alla prossima entità
      startIdx = data.indexOf(entityType, endIdx);
    }
  };

  // Centra la vista sui contenuti
  const centerView = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    // Calcola il bounding box di tutte le geometrie
    const box = new THREE.Box3();

    sceneRef.current.children.forEach((child) => {
      if (child instanceof THREE.Line && child.userData.isDxf) {
        box.expandByObject(child);
      }
    });

    if (box.isEmpty()) {
      console.warn("Impossibile centrare la vista: nessun oggetto trovato");
      return;
    }

    // Calcola il centro e la dimensione del bounding box
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);

    console.log("Limiti del disegno:", {
      min: box.min,
      max: box.max,
      center,
      size,
    });

    // Calcola la distanza per vedere tutto il contenuto
    const maxDim = Math.max(size.x, size.y);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let distance = maxDim / (2 * Math.tan(fov / 2));

    // Aggiungi un po' di spazio extra
    distance *= 1.2;

    // Posiziona la camera
    cameraRef.current.position.set(center.x, center.y, distance);
    cameraRef.current.lookAt(center);
    cameraRef.current.updateProjectionMatrix();

    // Aggiorna i controlli
    controlsRef.current.target.set(center.x, center.y, 0);
    controlsRef.current.update();
  };

  // Controlli di zoom
  const zoomIn = () => {
    if (!cameraRef.current) return;

    cameraRef.current.position.z *= 0.8;

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (!cameraRef.current) return;

    cameraRef.current.position.z *= 1.2;

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  };

  const zoomReset = () => {
    centerView();
  };

  // Stili per il container
  const containerStyle = {
    width,
    height,
    position: "relative",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Errore!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div style={containerStyle} ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="text-blue-600 flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Caricamento...
          </div>
        </div>
      )}

      {!data && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">
            Carica un file DXF per visualizzare la planimetria
          </div>
        </div>
      )}

      {/* Controlli di zoom */}
      <div className="absolute bottom-2 right-2 bg-white rounded-md shadow-md p-2 z-20 flex space-x-2">
        <button
          onClick={zoomIn}
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          title="Zoom In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          title="Zoom Out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={zoomReset}
          className="bg-gray-200 hover:bg-gray-300 p-1 rounded"
          title="Centra Planimetria"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
