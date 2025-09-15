const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = new sqlite3.Database('./database/asl_predictions.db');
db.run('CREATE TABLE IF NOT EXISTS predictions (id INTEGER PRIMARY KEY AUTOINCREMENT, prediction TEXT, timestamp TEXT)');

app.get('/predictions', (req, res) => {
    db.all('SELECT * FROM predictions', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/predictions', (req, res) => {
    const { prediction } = req.body;
    db.run('INSERT INTO predictions (prediction, timestamp) VALUES (?, ?)', [prediction, new Date().toISOString()], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'success' });
    });
});

app.use('/models', express.static(path.join(__dirname, 'models')));

app.listen(5000, () => console.log('Server running on port 5000'));