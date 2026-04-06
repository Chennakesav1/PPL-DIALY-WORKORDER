// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Pointing to a v2 database so old data doesn't cause schema errors
mongoose.connect('mongodb+srv://chennakesavarao89_db_user:chenna12345@cluster0.jtdhwd0.mongodb.net/?appName=Cluster0')
  .then(() => console.log("Connected to MongoDB (v2)"))
  .catch(err => console.error("Could not connect to MongoDB", err));

// Schema for the DAILY progress
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

// Master Schema that holds the static details AND the array of daily progress
const workOrderSchema = new mongoose.Schema({
    WO_NO: { type: String, required: true, unique: true },
    PART_NO: String, TYPE: String, SIZE: String, PITCH: String,
    LENGTH: String, GR: String, AF: String, PLAN_QTY: String,
    ACTUAL_QTY: String, RM_DETAILS: String, CH_WT: Number,
    RM_KG: Number, REMARKS: String,
    history: [updateSchema] // <--- This holds all your previous days!
});

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

// 1. GET all work orders
app.get('/api/workorders', async (req, res) => {
    try {
        const orders = await WorkOrder.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. POST (Create) a new Master work order
app.post('/api/workorders', async (req, res) => {
    try {
        const newOrder = new WorkOrder(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. PUT (Update or Add Daily Log)
app.put('/api/workorders/:wo_no', async (req, res) => {
    try {
        const wo = await WorkOrder.findOne({ WO_NO: req.params.wo_no });
        if (!wo) return res.status(404).json({ message: "Work order not found" });

        const updateData = req.body;
        
        // Check if the user already entered data for this specific DATE
        const existingIndex = wo.history.findIndex(h => h.DATE === updateData.DATE);
        
        if (existingIndex >= 0) {
            // If date exists, update that specific day
            wo.history[existingIndex] = updateData;
        } else {
            // If it's a new day, push a new log into history
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