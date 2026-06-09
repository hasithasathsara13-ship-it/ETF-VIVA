const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors()); 
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/fuelQRDB')
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((err) => console.log("Error connecting to MongoDB", err));

// ==========================================
// USER DATABASE COLLECTION SCHEMA
// ==========================================
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// ..........................................
// VEHICLE TYPE DATABASE COLLECTION SCHEMA
// @ COPYRIGHT - AMAYA
// ..........................................
const vehicleTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });
const VehicleType = mongoose.model('VehicleType', vehicleTypeSchema);

// ==========================================
// STATION DATABASE COLLECTION SCHEMA
// @ COPYRIGHT - SUVINI
// ==========================================
const stationSchema = new mongoose.Schema({
    name:     { type: String, required: true, unique: true, trim: true },
    location: { type: String, trim: true },
    contact:  { type: String, trim: true }
}, { timestamps: true });
const Station = mongoose.model('Station', stationSchema);

// ..........................................
// FUEL TYPE DATABASE COLLECTION SCHEMA
// @ COPYRIGHT - HASITHA
// ..........................................
const fuelTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });
const FuelType = mongoose.model('FuelType', fuelTypeSchema);

// ==========================================
// VEHICLE DATABASE COLLECTION SCHEMA
// ==========================================
const vehicleSchema = new mongoose.Schema({
    RegNo: { type: String, required: true, unique: true },
    FirstName: String,
    LastName: String,
    Email: String,
    NearestStation: String,
    FuelType: String,
    OwnerNIC: String,
    VehicleType: String,
    VehicleModel: String,
    QRCode: String
});
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// ..........................................
// VEHICLE TYPE ROUTES
// @ COPYRIGHT - AMAYA
// ..........................................

// --- Get all vehicle types ---
app.get('/api/vehicle-types', async (req, res) => {
    try {
        const types = await VehicleType.find().sort({ createdAt: 1 });
        res.status(200).json(types);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Add new vehicle type ---
app.post('/api/vehicle-types', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Vehicle type name is required.' });
        const newType = new VehicleType({ name: name.trim() });
        await newType.save();
        res.status(201).json({ message: 'Vehicle type added successfully', vehicleType: newType });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'This vehicle type already exists.' });
        res.status(500).json({ message: 'Failed to add vehicle type', error: error.message });
    }
});

// --- Delete vehicle type by ID ---
app.delete('/api/vehicle-types/:id', async (req, res) => {
    try {
        await VehicleType.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Vehicle type deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
// END VEHICLE TYPE SECTION (@ COPYRIGHT - AMAYA) ............

// ==========================================
// STATION ROUTES
// @ COPYRIGHT - SUVINI
// ==========================================

// --- Get all stations ---
app.get('/api/stations', async (req, res) => {
    try {
        const stations = await Station.find().sort({ createdAt: 1 });
        res.status(200).json(stations);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Add new station ---
app.post('/api/stations', async (req, res) => {
    try {
        const { name, location, contact } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Station name is required.' });
        const newStation = new Station({ name: name.trim(), location, contact });
        await newStation.save();
        res.status(201).json({ message: 'Station added successfully', station: newStation });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'This station already exists.' });
        res.status(500).json({ message: 'Failed to add station', error: error.message });
    }
});

// --- Update station by ID ---
app.put('/api/stations/:id', async (req, res) => {
    try {
        const updated = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Station not found.' });
        res.status(200).json({ message: 'Station updated successfully', station: updated });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Delete station by ID ---
app.delete('/api/stations/:id', async (req, res) => {
    try {
        await Station.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Station deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
// END STATION SECTION (@ COPYRIGHT - SUVINI) ............

// ..........................................
// FUEL TYPE ROUTES
// @ COPYRIGHT - HASITHA
// ..........................................

// --- Get all fuel types ---
app.get('/api/fuel-types', async (req, res) => {
    try {
        const types = await FuelType.find().sort({ createdAt: 1 });
        res.status(200).json(types);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Add new fuel type ---
app.post('/api/fuel-types', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Fuel type name is required.' });
        const newType = new FuelType({ name: name.trim() });
        await newType.save();
        res.status(201).json({ message: 'Fuel type added successfully', fuelType: newType });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'This fuel type already exists.' });
        res.status(500).json({ message: 'Failed to add fuel type', error: error.message });
    }
});

// --- Delete fuel type by ID ---
app.delete('/api/fuel-types/:id', async (req, res) => {
    try {
        await FuelType.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Fuel type deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Update fuel type by ID ---
app.put('/api/fuel-types/:id', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Fuel type name is required.' });
        const updated = await FuelType.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true });
        if (!updated) return res.status(404).json({ message: 'Fuel type not found.' });
        res.status(200).json({ message: 'Fuel type updated successfully', fuelType: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'This fuel type already exists.' });
        res.status(500).json({ error: error.message });
    }
});
// END FUEL TYPE SECTION (@ COPYRIGHT - HASITHA) ............

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email is already registered!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Hardcoded Admin Verification Check
        if (email === "admin@gmail.com" && password === "1234") {
            return res.status(200).json({ 
                message: "Admin login successful!", 
                redirectTo: "index.html" // Sends admin straight to the management panel
            });
        }
        
        // 2. Regular Registered User Verification Check
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        // SUCCESSFUL USER LOGIN: Redirects explicitly to user-dashboard.html
        res.status(200).json({ 
            message: "Login successful!", 
            redirectTo: "user-dashboard.html" // <-- FIXED: Regular users now go here!
        });

    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
});



// --- Search Filter Route: Dynamic User Finder ---
app.get('/api/vehicles/usersearch/:query', async (req, res) => {
    try {
        const searchStr = req.params.query.trim();
        // Searches if the logged-in email/username matches either Email, FirstName, or OwnerNIC
        const vehicles = await Vehicle.find({
            $or: [
                { Email: new RegExp(searchStr, 'i') },
                { FirstName: new RegExp(searchStr, 'i') },
                { OwnerNIC: new RegExp(`^${searchStr}$`, 'i') }
            ]
        });
        
        if (!vehicles || vehicles.length === 0) return res.status(404).json({ message: "No vehicle profile found" });
        res.status(200).json(vehicles);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
});




app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill out all login fields" });
        }

        // 1. Check Hardcoded Admin Verification
        if (email === "admin@gmail.com" && password === "1234") {
            return res.status(200).json({ 
                message: "Admin login successful!", 
                redirectTo: "index.html" 
            });
        }
        
        // 2. Check MongoDB User Base
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        // 3. Success Redirection for Regular Users
        res.status(200).json({ 
            message: "Login successful!", 
            redirectTo: "user-dashboard.html" 
        });

    } catch (error) {
        res.status(500).json({ message: "Error processing your request", error: error.message });
    }
});




// ==========================================
// VEHICLE CONTROLLERS & SEARCH ENDPOINTS
// ==========================================

// --- Create ---
app.post('/api/vehicles', async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        await newVehicle.save();
        res.status(201).json({ message: "Vehicle registered successfully", vehicle: newVehicle });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Registration failed: Number already exists!" });
        res.status(400).json({ message: "Registration failed", error: error.message });
    }
});

// --- Read All ---
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Order-By Dropdown Target Router Rules ---
app.get('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({ RegNo: new RegExp(`^${req.params.regNo.trim()}$`, 'i') });
        if (!vehicle) return res.status(404).json(null);
        res.status(200).json(vehicle);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/firstname/:name', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ FirstName: new RegExp(req.params.name.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/lastname/:name', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ LastName: new RegExp(req.params.name.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/email/:email', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ Email: new RegExp(req.params.email.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/station/:station', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ NearestStation: new RegExp(req.params.station.trim(), 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/fuel/:type', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ FuelType: new RegExp(`^${req.params.type.trim()}$`, 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vehicles/nic/:nic', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ OwnerNIC: new RegExp(`^${req.params.nic.trim()}$`, 'i') });
        res.status(200).json(vehicles);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Update ---
app.put('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findOneAndUpdate(
            { RegNo: new RegExp(`^${req.params.regNo.trim()}$`, 'i') },
            req.body,
            { new: true } 
        );
        res.status(200).json({ message: "Vehicle updated successfully", vehicle: updatedVehicle });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- Delete ---
app.delete('/api/vehicles/regno/:regNo', async (req, res) => {
    try {
        await Vehicle.findOneAndDelete({ RegNo: new RegExp(`^${req.params.regNo.trim()}$`, 'i') });
        res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running safely on port ${PORT}`));