// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // <--- ADDED THIS

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();

// Tell the server to allow access to files in the current folder (like index.html)
app.use(express.static(__dirname)); // <--- ADDED THIS

// Pointing to a v2 database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection CRASH:", err));

const updateSchema = new mongoose.Schema({
    DATE: String,
    FOUR_M: String,
    FORGING: { type: Number, default: 0 },
    ROLLING: { type: Number, default: 0 },
    SECONDARY: { type: Number, default: 0 },
    HT: { type: Number, default: 0 },
    POLISHING: { type: Number, default: 0 },
    PLATING: { type: Number, default: 0 },
    FINAL_INSPECTION: { type: Number, default: 0 },
    FG: { type: Number, default: 0 }
});

const workOrderSchema = new mongoose.Schema({
    WO_NO: { type: String, required: true, unique: true },
    PART_NO: String, TYPE: String, SIZE: String, PITCH: String,
    LENGTH: String, GR: String, AF: String, PLAN_QTY: String,
    ACTUAL_QTY: String, RM_DETAILS: String, CH_WT: Number,
    RM_KG: Number, REMARKS: String,
    history: [updateSchema]
});

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

// --- ROUTES ---

// NEW ROUTE: Show the index.html dashboard when visiting the main Render link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET all work orders
app.get('/api/workorders', async (req, res) => {
    try {
        const orders = await WorkOrder.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST (Create) a new Master work order
app.post('/api/workorders', async (req, res) => {
    try {
        const newOrder = new WorkOrder(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT (Update or Add Daily Log)
app.put('/api/workorders/:wo_no', async (req, res) => {
    try {
        const wo = await WorkOrder.findOne({ WO_NO: req.params.wo_no });
        if (!wo) return res.status(404).json({ message: "Work order not found" });

        const updateData = req.body;
        const existingIndex = wo.history.findIndex(h => h.DATE === updateData.DATE);
        
        if (existingIndex >= 0) {
            wo.history[existingIndex] = updateData;
        } else {
            wo.history.push(updateData);
        }

        await wo.save();
        res.json(wo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));