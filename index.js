const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors(
    {
        origin : '*',
        methods:["GET", "POST","PUT", "PATCH", "DELETE"],
        credentials: true
    }
  ))

// Initialize PostgreSQL client
// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  })

async function testDbConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log("Connected to PostgreSQL at:", res.rows[0].now);
    } catch (err) {
        console.error("Failed to connect to PostgreSQL:", err.message);
        process.exit(1); 
    }
}

testDbConnection();

// Routes
app.get('/', (req, res) => {
    res.json({
        message:"api working fine",
        status: "ok"
    })
})

// Fetch all products
app.get('/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//get detail by id
app.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product.rows[0]);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

// Add a new product
app.post('/products', async (req, res) => {
    const { name, description, price, quantity } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, price, quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Edit an existing product
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, quantity = $4 WHERE id = $5 RETURNING *',
            [name, description, price, quantity, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




// DB_HOST=localhost
// DB_USER=postgres
// DB_PASSWORD=kartik
// DB_NAME=productdb
// DB_PORT=5432