const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/fuelQRDB')
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((err) => console.log("Error connecting to MongoDB", err));

// ==========================================
// 1. DATABASE SCHEMA
// ==========================================
const vehicleSchema = new mongoose.Schema({
    RegNo: { type: String, required: true, unique: true },
    FirstName: String,
    LastName: String,
    Email: String,
    NearestStation: String,
    FuelType: String,
    OwnerNIC: String,
    VehicleModel: String,
    QRCode: String
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// ==========================================
// 2. REST API ROUTES
// ==========================================

// --- Register a Vehicle (POST) ---
app.post('/api/vehicles', async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        await newVehicle.save();
        res.status(201).json({ message: "Vehicle registered successfully", vehicle: newVehicle });
    } catch (error) {
        // Handle Duplicate Registration Number Error cleanly
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "Registration failed: This Vehicle Registration Number is already registered!" 
            });
        }
        res.status(400).json({ message: "Registration failed", error: error.message });
    }
});

// --- Show all Registered Vehicles (GET) ---
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching vehicles", error });
    }
});

// --- Find a Vehicle by Registration Number (GET) ---
app.get('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        // .trim() removes accidental spaces from the search
        const searchStr = req.params.regNo.trim();
        console.log(`Searching for RegNo: "${searchStr}"`);

        // Using regex to make the search case-insensitive
        const vehicle = await Vehicle.findOne({ RegNo: new RegExp(`^${searchStr}$`, 'i') });
        
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Owner’s First Name (GET) ---
app.get('/api/vehicles/firstname/:name', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ FirstName: new RegExp(req.params.name.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Owner’s Last Name (GET) ---
app.get('/api/vehicles/lastname/:name', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ LastName: new RegExp(req.params.name.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Owner’s Email (GET) ---
app.get('/api/vehicles/email/:email', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ Email: new RegExp(`^${req.params.email.trim()}$`, 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Nearest Fuel Station (GET) ---
app.get('/api/vehicles/station/:station', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ NearestStation: new RegExp(req.params.station.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Fuel Type (GET) ---
app.get('/api/vehicles/fuel/:type', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ FuelType: new RegExp(`^${req.params.type.trim()}$`, 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Find Vehicles by Owner’s NIC (GET) ---
app.get('/api/vehicles/nic/:nic', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ OwnerNIC: new RegExp(`^${req.params.nic.trim()}$`, 'i') });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Update Vehicle by Registration Number (PUT) ---
app.put('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findOneAndUpdate(
            { RegNo: new RegExp(`^${req.params.regNo.trim()}$`, 'i') },
            req.body,
            { new: true } 
        );
        if (!updatedVehicle) return res.status(404).json({ message: "Vehicle not found" });
        res.status(200).json({ message: "Updated successfully", vehicle: updatedVehicle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Update Vehicle by Owner’s First Name (PUT) ---
app.put('/api/vehicles/firstname/:name', async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findOneAndUpdate(
            { FirstName: new RegExp(req.params.name.trim(), 'i') },
            req.body,
            { new: true }
        );
        if (!updatedVehicle) return res.status(404).json({ message: "Vehicle not found" });
        res.status(200).json({ message: "Updated successfully", vehicle: updatedVehicle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Delete Vehicle by Registration Number (DELETE) ---
app.delete('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        const deletedVehicle = await Vehicle.findOneAndDelete({ RegNo: new RegExp(`^${req.params.regNo.trim()}$`, 'i') });
        if (!deletedVehicle) return res.status(404).json({ message: "Vehicle not found" });
        res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});