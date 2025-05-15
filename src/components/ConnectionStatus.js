import React, { useState, useEffect } from "react";
import { BlueiotClient } from "../services/blueiotClient";

const ConnectionStatus = () => {
  const [status, setStatus] = useState("disconnected");
  const [lastError, setLastError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Funzioni di callback
    const handleOpen = () => {
      setStatus("connected");
      setLastError(null);
    };

    const handleError = (error) => {
      setStatus("error");
      setLastError(error.message || "Errore sconosciuto");
    };

    const handleClose = () => {
      setStatus("disconnected");
    };

    // Registra i listener
    BlueiotClient.on("open", handleOpen);
    BlueiotClient.on("error", handleError);
    BlueiotClient.on("close", handleClose);

    // Cleanup - ora usiamo BlueiotClient.off correttamente
    return () => {
      // Rimuovi i singoli listener per evitare memory leak
      BlueiotClient.off("open", handleOpen);
      BlueiotClient.off("error", handleError);
      BlueiotClient.off("close", handleClose);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-red-500";
      case "error":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Connesso a BlueIOT";
      case "disconnected":
        return "Disconnesso da BlueIOT";
      case "error":
        return "Errore di connessione";
      default:
        return "Stato sconosciuto";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-white mr-2"></div>
          <span>{getStatusText()}</span>
        </div>

        {expanded && lastError && (
          <div className="mt-2 text-sm">
            <p>Ultimo errore:</p>
            <p className="font-mono">{lastError}</p>
          </div>
        )}

        {expanded && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              className="bg-white text-gray-800 px-2 py-1 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation();
                BlueiotClient.disconnect();
              }}
            >
              Disconnetti
            </button>
            <button
              className="bg-white text-gray-800 px-2 py-1 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation();
                BlueiotClient.connect();
              }}
            >
              Riconnetti
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
