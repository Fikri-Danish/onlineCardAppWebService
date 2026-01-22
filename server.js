// include the required packages
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};


// intialize Express app
const app = express();

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "https://card-app-smoky.vercel.app",
  // "https://YOUR-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman/server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// helps app to read JSON
app.use(express.json());


app.listen(port, () => {
    console.log('Server running on port', port);
});



// Example Route: Get all cards
app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error for allcards' });
    }
});

// Example Route: Create a new card
app.post('/addcard', async (req, res) => {
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?, ?)', [card_name, card_pic]);
        res.status(201).json({ message: 'Card '+card_name+' added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not add card '+card_name});
    }
});

// Edit (update) a card
app.put('/editcard/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;

    if (card_name === undefined && card_pic === undefined) {
        return res.status(400).json({ message: 'Nothing to update' });
    }

    try {
        let connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            `UPDATE defaultdb.cards 
             SET card_name = COALESCE(?, card_name),
                 card_pic = COALESCE(?, card_pic)
             WHERE id = ?`,
            [card_name ?? null, card_pic ?? null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Card not found' });
        }

        res.json({ message: 'Card id ' + id + ' updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update card id ' + id });
    }
});

app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('DELETE FROM defaultdb.cards WHERE id = ?', [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error for deletecard' });
    }
});