import express from 'express';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const app = express();
const PORT = 3000;

// CSV file paths
const customersCsv = path.join(path.dirname(new URL(import.meta.url).pathname), 'samples/customers.csv');
const balancesCsv = path.join(path.dirname(new URL(import.meta.url).pathname), 'samples/balances.csv');

// Helper to read CSV and return data as array of objects
function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// GET /customer/:id - Get customer details by ID
app.get('/customer/:id', async (req, res) => {
    try {
        console.log(`Fetching customer with ID: ${req.params.id}`);
        const customers = await readCsv(customersCsv);
        const customer = customers.find(c => c.customer_id === req.params.id);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /balance/:id - Get balance details by customer ID
app.get('/balance/:id', async (req, res) => {
    try {
        console.log(`Fetching balance for customer ID: ${req.params.id}`);
        const balances = await readCsv(balancesCsv);
        const balance = balances.find(b => b.customer_id === req.params.id);
        if (balance) {
            res.json(balance);
        } else {
            res.status(404).json({ error: 'Balance not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
