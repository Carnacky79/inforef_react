// BlueIOT Backend Server - Node.js (Express + SQLite)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const COMPANY_NAME = process.env.COMPANY_NAME;
const COMPANY_ID = process.env.COMPANY_ID;

app.use(cors());
app.use(express.json());

// === Database setup ===
const dbFile = path.resolve(__dirname, 'database.sqlite');
const dbExists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

if (!dbExists) {
	console.log('📦 Inizializzazione nuovo database SQLite...');
	db.serialize(() => {
		db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      role TEXT,
      companyId TEXT
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY,
      name TEXT,
      type TEXT,
      companyId TEXT
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      serverIp TEXT,
      serverPort INTEGER,
      mapFile TEXT,
      mapWidth REAL,
      mapHeight REAL,
      mapCorners TEXT,
      company TEXT,
      companyId TEXT
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      battery INTEGER
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS associations (
      tagId TEXT,
      targetType TEXT,
      targetId INTEGER,
      siteId INTEGER,
      PRIMARY KEY (tagId, siteId)
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT,
      message TEXT,
      siteId INTEGER
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS anchors (
      id TEXT PRIMARY KEY,
      x REAL,
      y REAL,
      z REAL,
      siteId INTEGER,
      status TEXT,
      lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS tag_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tagId TEXT,
      x REAL,
      y REAL,
      z REAL,
      siteId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS tag_power (
      tagId TEXT PRIMARY KEY,
      battery INTEGER,
      updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

		db.run(`CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tagId TEXT,
      type TEXT,
      level TEXT,
      message TEXT,
      siteId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

		if (COMPANY_NAME && COMPANY_ID) {
			db.run(
				`INSERT INTO sites (name, serverIp, serverPort, mapFile, mapWidth, mapHeight, mapCorners, company, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					'Cantiere Milano',
					'192.168.1.100',
					48300,
					'mappa.dxf',
					100,
					80,
					JSON.stringify([
						{ x: 0, y: 0 },
						{ x: 100, y: 0 },
						{ x: 100, y: 80 },
						{ x: 0, y: 80 },
					]),
					COMPANY_NAME,
					COMPANY_ID,
				]
			);
		} else {
			console.warn(
				'⚠️ Variabili COMPANY_NAME o COMPANY_ID non definite. Nessun sito demo inserito.'
			);
		}
	});
}

// === Routes ===

// Avvio server dopo inizializzazione DB
app.listen(PORT, () => {
	console.log(`✅ BlueIOT backend listening on http://localhost:${PORT}`);
});

app.get('/', (req, res) => res.send('BlueIOT backend running'));

app.get('/api/sites', (req, res) => {
	db.all(
		`SELECT * FROM sites WHERE companyId = ?`,
		[COMPANY_ID],
		(err, rows) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json(rows);
		}
	);
});

app.post('/api/users', (req, res) => {
	const { id, name, role } = req.body;
	db.run(
		`REPLACE INTO users (id, name, role, companyId) VALUES (?, ?, ?, ?)`,
		[id, name, role, COMPANY_ID],
		(err) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json({ success: true });
		}
	);
});

app.get('/api/users', (req, res) => {
	db.all(
		`SELECT * FROM users WHERE companyId = ?`,
		[COMPANY_ID],
		(err, rows) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json(rows);
		}
	);
});

app.post('/api/assets', (req, res) => {
	const { id, name, type } = req.body;
	db.run(
		`REPLACE INTO assets (id, name, type, companyId) VALUES (?, ?, ?, ?)`,
		[id, name, type, COMPANY_ID],
		(err) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json({ success: true });
		}
	);
});

app.get('/api/assets', (req, res) => {
	db.all(
		`SELECT * FROM assets WHERE companyId = ?`,
		[COMPANY_ID],
		(err, rows) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json(rows);
		}
	);
});

app.post('/api/map-file', (req, res) => {
	const { siteId, mapFile, mapWidth, mapHeight, mapCorners } = req.body;
	db.run(
		`UPDATE sites SET mapFile = ?, mapWidth = ?, mapHeight = ?, mapCorners = ? WHERE id = ?`,
		[mapFile, mapWidth, mapHeight, JSON.stringify(mapCorners), siteId],
		(err) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			res.json({ success: true });
		}
	);
});

app.get('/api/map/:siteId', (req, res) => {
	const siteId = req.params.siteId;
	db.get(
		`SELECT mapFile, mapWidth, mapHeight, mapCorners FROM sites WHERE id = ? AND companyId = ?`,
		[siteId, COMPANY_ID],
		(err, row) => {
			if (err) return res.status(500).json({ error: 'DB error' });
			if (!row) return res.status(404).json({ error: 'Map not found' });
			res.json(row);
		}
	);
});
