import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';

const db = new Database('cid_database.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS suspects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    photo_url TEXT,
    details TEXT,
    social_links TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS case_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    suspect_id INTEGER,
    FOREIGN KEY(case_id) REFERENCES cases(id),
    FOREIGN KEY(suspect_id) REFERENCES suspects(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/suspects', (req, res) => {
    const suspects = db.prepare('SELECT * FROM suspects ORDER BY created_at DESC').all();
    res.json(suspects);
  });

  app.post('/api/suspects', (req, res) => {
    const { name, photo_url, details, social_links } = req.body;
    const info = db.prepare('INSERT INTO suspects (name, photo_url, details, social_links) VALUES (?, ?, ?, ?)').run(name, photo_url, details, JSON.stringify(social_links));
    res.json({ id: info.lastInsertRowid });
  });

  app.get('/api/cases', (req, res) => {
    const cases = db.prepare('SELECT * FROM cases ORDER BY created_at DESC').all();
    res.json(cases);
  });

  app.post('/api/cases', (req, res) => {
    const { title, description } = req.body;
    const info = db.prepare('INSERT INTO cases (title, description) VALUES (?, ?)').run(title, description);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CID Investigation Server running on http://localhost:${PORT}`);
  });
}

startServer();
