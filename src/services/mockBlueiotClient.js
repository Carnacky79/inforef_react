// Versione corretta di mockBlueiotClient.js
let listeners = {
  tagPosition: [],
  batteryInfo: [],
  alarm: [],
  heartInfo: [],
  dmData: [],
  baseStData: [],
  personInfo: [],
  areaInfo: [],
  tagIotInfo: [],
  videoChange: [],
  open: [],
  error: [],
  close: [],
};

export const MockBlueiotClient = {
  connect: () => {
    console.log("🔌 Connessione simulata a BlueIOT avviata");
    const interval = setInterval(() => {
      if (listeners.tagPosition.length === 0) return; // Non fare nulla se non ci sono listener

      const simulatedTags = [
        { id: "TAG001", x: Math.random() * 100, y: Math.random() * 80, z: 0 },
        { id: "TAG002", x: Math.random() * 100, y: Math.random() * 80, z: 0 },
      ];

      // Notifica tutti i listener registrati per tagPosition
      simulatedTags.forEach((tag) => {
        listeners.tagPosition.forEach((callback) => {
          if (typeof callback === "function") {
            callback(tag);
          }
        });
      });
    }, 3000);

    // Simula l'evento "open"
    setTimeout(() => {
      listeners.open.forEach((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    }, 500);

    // Memorizza l'intervallo per poterlo pulire in disconnect
    MockBlueiotClient._interval = interval;
  },

  on: (event, callback) => {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  },

  // Rimuove un listener specifico
  off: (event, callback) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    }
  },

  // Rimuove tutti i listener
  clearListeners: () => {
    Object.keys(listeners).forEach((key) => {
      listeners[key] = [];
    });
  },

  disconnect: () => {
    console.log("🔌 Disconnessione simulata da BlueIOT");
    // Interrompi la simulazione
    if (MockBlueiotClient._interval) {
      clearInterval(MockBlueiotClient._interval);
      MockBlueiotClient._interval = null;
    }

    // Notifica tutti i listener di chiusura
    listeners.close.forEach((callback) => {
      if (typeof callback === "function") {
        callback();
      }
    });

    // Pulisci i listener
    clearListeners();
  },

  // Proprietà privata per memorizzare l'interval
  _interval: null,
};

// Helper per pulire i listener
function clearListeners() {
  Object.keys(listeners).forEach((key) => {
    listeners[key] = [];
  });
}
