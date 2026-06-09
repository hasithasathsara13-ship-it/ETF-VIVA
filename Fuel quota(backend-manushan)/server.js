require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();

// CORS — must come before routes. The explicit OPTIONS handler
// fixes preflight failures on POST/PUT (common cause of "POST not working").
app.use(cors());
app.options('*', cors());

app.use(express.json());

const MONGO_URI = process.env.MONGO_URL;
const DB_NAME = 'fuelsys';

if (!MONGO_URI) {
  console.error('❌ MONGO_URL environment variable is not set. Exiting.');
  process.exit(1);
}

let db;

MongoClient.connect(MONGO_URI)
  .then(async (client) => {
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas');

    // Seed sample data if empty
    const count = await db.collection('quotas').countDocuments();
    if (count === 0) {
      await db.collection('quotas').insertMany([
        { reg_number: 'CBA-1234', nearest_station: '', max_quota: 20, used: 5 },
        { reg_number: 'WP-5678',  nearest_station: '', max_quota: 15, used: 15 },
        { reg_number: 'CAB-9988', nearest_station: '', max_quota: 20, used: 0 },
      ]);
      console.log('✅ Sample data seeded');
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Small helper so every route fails loudly, not silently
function requireDb(res) {
  if (!db) {
    res.status(503).json({ message: 'Database not connected yet. Try again in a moment.' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// QUOTAS
// ---------------------------------------------------------------------------

// GET all quotas
app.get('/api/quotas', async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const quotas = await db.collection('quotas').find().toArray();
    res.json(quotas);
  } catch (err) {
    console.error('GET /api/quotas failed:', err);
    res.status(500).json({ message: 'Server error while fetching quotas.' });
  }
});

// POST add a new vehicle quota
app.post('/api/quotas', async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const { reg_number, nearest_station, max_quota, used } = req.body;

    if (!reg_number || max_quota === undefined || max_quota === null || max_quota === '') {
      return res.status(400).json({ message: 'Registration number and quota limit are required.' });
    }

    const limit = Number(max_quota);
    if (!Number.isFinite(limit) || limit < 1) {
      return res.status(400).json({ message: 'Quota limit must be a positive number.' });
    }

    const formattedReg = String(reg_number).trim().toUpperCase();

    const existing = await db.collection('quotas').findOne({ reg_number: formattedReg });
    if (existing) {
      return res.status(400).json({ message: 'Quota configuration for this vehicle already exists.' });
    }

    const newQuota = {
      reg_number: formattedReg,
      nearest_station: nearest_station ? String(nearest_station).trim() : '',
      max_quota: limit,
      used: Number(used) || 0,
    };

    const result = await db.collection('quotas').insertOne(newQuota);
    res.status(201).json({ ...newQuota, _id: result.insertedId });
  } catch (err) {
    console.error('POST /api/quotas failed:', err);
    res.status(500).json({ message: 'Server error while adding quota.' });
  }
});

// PUT update quota limit for a vehicle
app.put('/api/quotas/:id', async (req, res) => {
  if (!requireDb(res)) return;
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid quota ID.' });
    }

    const limit = Number(req.body.max_quota);
    if (!Number.isFinite(limit) || limit < 1) {
      return res.status(400).json({ message: 'Quota limit must be a positive number.' });
    }

    const result = await db.collection('quotas').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { max_quota: limit } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Quota record not found.' });
    }

    res.json(result);
  } catch (err) {
    console.error('PUT /api/quotas/:id failed:', err);
    res.status(500).json({ message: 'Server error while updating quota.' });
  }
});

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

// GET all fuel orders
app.get('/api/orders', async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const orders = await db.collection('orders').find().sort({ created_at: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    console.error('GET /api/orders failed:', err);
    res.status(500).json({ message: 'Server error while fetching orders.' });
  }
});

// POST new fuel order (worker submits)
app.post('/api/orders', async (req, res) => {
  if (!requireDb(res)) return;
  try {
    const { reg_number, requested_liters } = req.body;

    if (!reg_number || requested_liters === undefined) {
      return res.status(400).json({ error: 'reg_number and requested_liters are required' });
    }

    const liters = Number(requested_liters);
    if (!Number.isFinite(liters) || liters <= 0) {
      return res.status(400).json({ error: 'requested_liters must be a positive number' });
    }

    const formattedReg = String(reg_number).trim().toUpperCase();

    const quota = await db.collection('quotas').findOne({ reg_number: formattedReg });
    if (!quota) {
      return res.status(404).json({ error: 'Vehicle not registered in the system' });
    }

    // Atomic, race-safe deduction: only updates if enough quota remains.
    const updateResult = await db.collection('quotas').updateOne(
      {
        _id: quota._id,
        $expr: { $gte: [{ $subtract: ['$max_quota', '$used'] }, liters] },
      },
      { $inc: { used: liters } }
    );

    if (updateResult.modifiedCount === 0) {
      const remaining = quota.max_quota - quota.used;
      return res.status(400).json({ error: `Only ${remaining}L remaining for this vehicle` });
    }

    const order = {
      reg_number: formattedReg,
      requested_liters: liters,
      created_at: new Date(),
    };
    const result = await db.collection('orders').insertOne(order);
    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (err) {
    console.error('POST /api/orders failed:', err);
    res.status(500).json({ error: 'Server error while creating order.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
