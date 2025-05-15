import React, { useEffect, useRef, useState } from "react";

/**
 * Visualizzatore DXF personalizzato che non dipende da librerie esterne
 * Supporta visualizzazione base di entità DXF come linee e cerchi
 */
export function DxfViewer({
  data,
  width = "100%",
  height = "400px",
  tagPositions = {},
  onAreaDefined = null,
}) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaPoints, setAreaPoints] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({
    minX: 0,
    minY: 0,
    maxX: 100,
    maxY: 100,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Impostazioni di visualizzazione
  const [viewSettings, setViewSettings] = useState({
    gridSize: 10,
    padding: 20,
    showGrid: true,
    backgroundColor: "#f8f8f8",
    lineColor: "#3b82f6",
    circleColor: "#3b82f6",
    gridColor: "#e0e0e0",
  });

  // Stato per il rendering
  const dxfElements = useRef([]);

  // Attiva la modalità di definizione area
  useEffect(() => {
    setIsAreaMode(!!onAreaDefined);
  }, [onAreaDefined]);

  // Analizza il file DXF
  const parseDxf = (dxfContent) => {
    try {
      setLoading(true);

      // Verifica se è un file DXF valido
      if (!dxfContent.includes("ENTITIES") || !dxfContent.includes("SECTION")) {
        throw new Error("File DXF non valido o non supportato");
      }

      // Estrai sezioni ENTITIES che contengono gli elementi da disegnare
      const entitiesMatch = dxfContent.match(/ENTITIES([\s\S]*?)ENDSEC/);
      if (!entitiesMatch) {
        throw new Error("Nessuna entità trovata nel file DXF");
      }

      const entitiesSection = entitiesMatch[1];
      const elements = [];

      // Limiti per calcolare il riquadro di delimitazione
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      // Cerca linee nel DXF
      const linePattern =
        /LINE[\s\S]*?10\s+([-\d.]+)[\s\S]*?20\s+([-\d.]+)[\s\S]*?11\s+([-\d.]+)[\s\S]*?21\s+([-\d.]+)/g;
      let lineMatch;

      while ((lineMatch = linePattern.exec(entitiesSection)) !== null) {
        const x1 = parseFloat(lineMatch[1]);
        const y1 = parseFloat(lineMatch[2]);
        const x2 = parseFloat(lineMatch[3]);
        const y2 = parseFloat(lineMatch[4]);

        // Aggiorna i limiti
        minX = Math.min(minX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxX = Math.max(maxX, x1, x2);
        maxY = Math.max(maxY, y1, y2);

        elements.push({
          type: "line",
          x1,
          y1,
          x2,
          y2,
        });
      }

      // Cerca archi nel DXF
      const arcPattern =
        /ARC[\s\S]*?10\s+([-\d.]+)[\s\S]*?20\s+([-\d.]+)[\s\S]*?40\s+([-\d.]+)[\s\S]*?50\s+([-\d.]+)[\s\S]*?51\s+([-\d.]+)/g;
      let arcMatch;

      while ((arcMatch = arcPattern.exec(entitiesSection)) !== null) {
        const x = parseFloat(arcMatch[1]);
        const y = parseFloat(arcMatch[2]);
        const radius = parseFloat(arcMatch[3]);
        const startAngle = parseFloat(arcMatch[4]) * (Math.PI / 180);
        const endAngle = parseFloat(arcMatch[5]) * (Math.PI / 180);

        // Aggiorna i limiti
        minX = Math.min(minX, x - radius);
        minY = Math.min(minY, y - radius);
        maxX = Math.max(maxX, x + radius);
        maxY = Math.max(maxY, y + radius);

        elements.push({
          type: "arc",
          x,
          y,
          radius,
          startAngle,
          endAngle,
        });
      }

      // Cerca cerchi nel DXF
      const circlePattern =
        /CIRCLE[\s\S]*?10\s+([-\d.]+)[\s\S]*?20\s+([-\d.]+)[\s\S]*?40\s+([-\d.]+)/g;
      let circleMatch;

      while ((circleMatch = circlePattern.exec(entitiesSection)) !== null) {
        const x = parseFloat(circleMatch[1]);
        const y = parseFloat(circleMatch[2]);
        const radius = parseFloat(circleMatch[3]);

        // Aggiorna i limiti
        minX = Math.min(minX, x - radius);
        minY = Math.min(minY, y - radius);
        maxX = Math.max(maxX, x + radius);
        maxY = Math.max(maxY, y + radius);

        elements.push({
          type: "circle",
          x,
          y,
          radius,
        });
      }

      // Se non abbiamo trovato elementi, usa valori predefiniti
      if (elements.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 100;
        maxY = 100;
      }

      // Imposta i limiti con un margine
      setBounds({
        minX: minX - 10,
        minY: minY - 10,
        maxX: maxX + 10,
        maxY: maxY + 10,
      });

      // Memorizza gli elementi
      dxfElements.current = elements;

      setLoading(false);
      return elements;
    } catch (err) {
      console.error("Errore durante l'analisi del DXF:", err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  };

  // Calcola la trasformazione da coordinate DXF a canvas
  const getTransform = (canvasWidth, canvasHeight, bounds) => {
    const { minX, minY, maxX, maxY } = bounds;
    const dxfWidth = maxX - minX;
    const dxfHeight = maxY - minY;

    const padding = viewSettings.padding;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;

    // Calcola scala preservando le proporzioni
    const scaleX = availableWidth / dxfWidth;
    const scaleY = availableHeight / dxfHeight;
    const scale = Math.min(scaleX, scaleY);

    // Centra il disegno
    const offsetX = padding + (availableWidth - dxfWidth * scale) / 2;
    const offsetY = padding + (availableHeight - dxfHeight * scale) / 2;

    setScale(scale);
    setOffset({ x: offsetX - minX * scale, y: offsetY - minY * scale });

    return {
      scale,
      offsetX: offsetX - minX * scale,
      offsetY: offsetY - minY * scale,
    };
  };

  // Funzione per trasformare coordinate DXF in coordinate canvas
  const dxfToCanvas = (x, y, transform) => {
    return {
      x: x * transform.scale + transform.offsetX,
      y: canvasRef.current.height - (y * transform.scale + transform.offsetY),
    };
  };

  // Funzione per trasformare coordinate canvas in coordinate DXF
  const canvasToDxf = (x, y, transform) => {
    return {
      x: (x - transform.offsetX) / transform.scale,
      y: (canvasRef.current.height - y - transform.offsetY) / transform.scale,
    };
  };

  // Disegna la griglia
  const drawGrid = (ctx, transform) => {
    const { minX, minY, maxX, maxY } = bounds;
    const gridSize = viewSettings.gridSize;

    ctx.strokeStyle = viewSettings.gridColor;
    ctx.lineWidth = 0.5;

    // Disegna linee verticali
    for (
      let x = Math.floor(minX / gridSize) * gridSize;
      x <= maxX;
      x += gridSize
    ) {
      const pos = dxfToCanvas(x, 0, transform);
      ctx.beginPath();
      ctx.moveTo(pos.x, 0);
      ctx.lineTo(pos.x, ctx.canvas.height);
      ctx.stroke();
    }

    // Disegna linee orizzontali
    for (
      let y = Math.floor(minY / gridSize) * gridSize;
      y <= maxY;
      y += gridSize
    ) {
      const pos = dxfToCanvas(0, y, transform);
      ctx.beginPath();
      ctx.moveTo(0, pos.y);
      ctx.lineTo(ctx.canvas.width, pos.y);
      ctx.stroke();
    }
  };

  // Disegna gli elementi DXF
  const drawDxfElements = (ctx, elements, transform) => {
    ctx.strokeStyle = viewSettings.lineColor;
    ctx.lineWidth = 1;

    elements.forEach((element) => {
      switch (element.type) {
        case "line":
          const start = dxfToCanvas(element.x1, element.y1, transform);
          const end = dxfToCanvas(element.x2, element.y2, transform);

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;

        case "circle":
          const center = dxfToCanvas(element.x, element.y, transform);
          const radiusPixels = element.radius * transform.scale;

          ctx.beginPath();
          ctx.arc(center.x, center.y, radiusPixels, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case "arc":
          const arcCenter = dxfToCanvas(element.x, element.y, transform);
          const arcRadiusPixels = element.radius * transform.scale;
          // DXF usa angoli in senso antiorario, canvas usa angoli in senso orario
          const startAngle = Math.PI * 2 - element.endAngle;
          const endAngle = Math.PI * 2 - element.startAngle;

          ctx.beginPath();
          ctx.arc(
            arcCenter.x,
            arcCenter.y,
            arcRadiusPixels,
            startAngle,
            endAngle,
            true
          );
          ctx.stroke();
          break;

        default:
          break;
      }
    });
  };

  // Disegna i tag
  const drawTags = (ctx, tagPositions, transform) => {
    Object.entries(tagPositions).forEach(([tagId, pos]) => {
      // Colore in base al tipo
      const tagColor = pos.type === "employee" ? "#3b82f6" : "#10b981";
      const tagSize = 5;

      // Converti le coordinate del tag
      const tagPos = dxfToCanvas(pos.x, pos.y, transform);

      // Disegna cerchio
      ctx.fillStyle = tagColor;
      ctx.beginPath();
      ctx.arc(tagPos.x, tagPos.y, tagSize, 0, Math.PI * 2);
      ctx.fill();

      // Disegna etichetta
      ctx.fillStyle = "#000000";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(pos.name || tagId, tagPos.x, tagPos.y - 10);
    });
  };

  // Disegna i punti dell'area in definizione
  const drawAreaPoints = (ctx, points, transform) => {
    if (points.length === 0) return;

    ctx.fillStyle = "#ff0000";
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;

    // Disegna i punti
    points.forEach((point, index) => {
      const pos = dxfToCanvas(point.x, point.y, transform);

      // Disegna cerchio
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Disegna linea se non è il primo punto
      if (index > 0) {
        const prevPos = dxfToCanvas(
          points[index - 1].x,
          points[index - 1].y,
          transform
        );
        ctx.beginPath();
        ctx.moveTo(prevPos.x, prevPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    });

    // Chiudi il poligono se ci sono più di 2 punti
    if (points.length > 2) {
      const firstPos = dxfToCanvas(points[0].x, points[0].y, transform);
      const lastPos = dxfToCanvas(
        points[points.length - 1].x,
        points[points.length - 1].y,
        transform
      );

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(firstPos.x, firstPos.y);
      ctx.stroke();

      // Riempi il poligono con trasparenza
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      points.forEach((point, index) => {
        const pos = dxfToCanvas(point.x, point.y, transform);
        if (index === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  };

  // Render completo
  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Imposta le dimensioni del canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Pulisci il canvas
    ctx.fillStyle = viewSettings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calcola la trasformazione
    const transform = getTransform(canvas.width, canvas.height, bounds);

    // Disegna la griglia
    if (viewSettings.showGrid) {
      drawGrid(ctx, transform);
    }

    // Disegna gli elementi DXF
    drawDxfElements(ctx, dxfElements.current, transform);

    // Disegna i tag
    drawTags(ctx, tagPositions, transform);

    // Disegna i punti dell'area in definizione
    drawAreaPoints(ctx, areaPoints, transform);

    // Disegna informazioni sulla scala
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Scala: 1:${(1 / transform.scale).toFixed(2)}`, 10, 20);
  };

  // Gestione eventi del mouse
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.buttons === 1) {
      // Click sinistro
      if (isAreaMode) {
        // Calcola le coordinate DXF
        const transform = getTransform(
          canvasRef.current.width,
          canvasRef.current.height,
          bounds
        );
        const dxfPoint = canvasToDxf(x, y, transform);

        // Aggiungi il punto
        setAreaPoints([...areaPoints, dxfPoint]);

        // Se è un doppio clic, completa l'area
        if (e.detail === 2 && areaPoints.length >= 2) {
          if (onAreaDefined) {
            onAreaDefined([...areaPoints, dxfPoint]);
          }
          setAreaPoints([]);
        }
      } else {
        // Modalità pan
        setIsPanning(true);
        setLastPos({ x, y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcola spostamento
    const deltaX = x - lastPos.x;
    const deltaY = y - lastPos.y;

    // Aggiorna offset
    setOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y - deltaY,
    }));

    // Aggiorna ultima posizione
    setLastPos({ x, y });

    // Renderizza
    renderCanvas();
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcola coordinate DXF del punto di zoom
    const transform = getTransform(
      canvasRef.current.width,
      canvasRef.current.height,
      bounds
    );
    const dxfPoint = canvasToDxf(x, y, transform);

    // Calcola il fattore di zoom
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    // Aggiorna bounds per lo zoom
    setBounds((prev) => {
      const centerX = dxfPoint.x;
      const centerY = dxfPoint.y;

      // Calcola nuovi limiti
      const newWidth = (prev.maxX - prev.minX) / zoomFactor;
      const newHeight = (prev.maxY - prev.minY) / zoomFactor;

      // Mantieni il punto sotto il cursore fisso
      const offsetX = (centerX - prev.minX) / (prev.maxX - prev.minX);
      const offsetY = (centerY - prev.minY) / (prev.maxY - prev.minY);

      const newMinX = centerX - newWidth * offsetX;
      const newMinY = centerY - newHeight * offsetY;

      return {
        minX: newMinX,
        minY: newMinY,
        maxX: newMinX + newWidth,
        maxY: newMinY + newHeight,
      };
    });

    // Renderizza
    renderCanvas();
  };

  // Inizializza e carica DXF
  useEffect(() => {
    if (!data) return;

    parseDxf(data);
  }, [data]);

  // Renderizza quando cambiano elementi rilevanti
  useEffect(() => {
    renderCanvas();
  }, [tagPositions, bounds, areaPoints, viewSettings]);

  // Gestione ridimensionamento
  useEffect(() => {
    const handleResize = () => renderCanvas();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Controlli di zoom
  const zoomIn = () => {
    setBounds((prev) => {
      const centerX = (prev.minX + prev.maxX) / 2;
      const centerY = (prev.minY + prev.maxY) / 2;
      const width = (prev.maxX - prev.minX) * 0.8;
      const height = (prev.maxY - prev.minY) * 0.8;

      return {
        minX: centerX - width / 2,
        minY: centerY - height / 2,
        maxX: centerX + width / 2,
        maxY: centerY + height / 2,
      };
    });
  };

  const zoomOut = () => {
    setBounds((prev) => {
      const centerX = (prev.minX + prev.maxX) / 2;
      const centerY = (prev.minY + prev.maxY) / 2;
      const width = (prev.maxX - prev.minX) * 1.25;
      const height = (prev.maxY - prev.minY) * 1.25;

      return {
        minX: centerX - width / 2,
        minY: centerY - height / 2,
        maxX: centerX + width / 2,
        maxY: centerY + height / 2,
      };
    });
  };

  const zoomReset = () => {
    // Resetta allo zoom iniziale
    const { minX, minY, maxX, maxY } = bounds;
    const dxfWidth = maxX - minX;
    const dxfHeight = maxY - minY;

    setBounds({
      minX: minX - dxfWidth * 0.1,
      minY: minY - dxfHeight * 0.1,
      maxX: maxX + dxfWidth * 0.1,
      maxY: maxY + dxfHeight * 0.1,
    });
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
    <div style={{ width, height, position: "relative" }}>
      <canvas
        ref={canvasRef}
        width="100%"
        height="100%"
        className="border rounded w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

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
            Carica un file DXF per visualizzare la mappa
          </div>
        </div>
      )}

      {isAreaMode && (
        <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm">
          Modalità definizione area: Clicca per aggiungere punti, doppio clic
          per completare
        </div>
      )}

      {/* Controlli */}
      <div className="absolute bottom-2 right-2 bg-white rounded-md shadow-md p-2 z-10 flex space-x-2">
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
          title="Zoom Reset"
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
