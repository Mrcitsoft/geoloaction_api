const express = require('express');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection string
const mongoURI = 'mongodb+srv://polamarasettiharsha:Harsha7777@cluster0.eztkeoo.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
  // Load CSV data into MongoDB when the database connection is established
  loadCSVData();
});

// Define the City schema and model
const citySchema = new mongoose.Schema({
  id: Number,
  name: String,
  state_id: Number,
  state_code: String,
  state_name: String,
  country_id: Number,
  country_code: String,
  country_name: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  wikiDataId: String,
});

// Create a 2dsphere index on the location field
citySchema.index({ location: '2dsphere' });

const City = mongoose.model('City', citySchema);

// Load CSV data into MongoDB
const loadCSVData = () => {
  const cities = [];
  fs.createReadStream(path.join(__dirname, 'cities.csv'))
    .pipe(csv())
    .on('data', (row) => {
      const city = {
        id: row.id,
        name: row.name,
        state_id: row.state_id,
        state_code: row.state_code,
        state_name: row.state_name,
        country_id: row.country_id,
        country_code: row.country_code,
        country_name: row.country_name,
        location: {
          type: 'Point',
          coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)],
        },
        wikiDataId: row.wikiDataId,
      };
      cities.push(city);
    })
    .on('end', async () => {
      try {
        await City.insertMany(cities);
        console.log('CSV data loaded into MongoDB');
      } catch (err) {
        console.error('Error loading CSV data into MongoDB:', err);
      }
    });
};

// Function to find the closest city using geospatial query
const findClosestCity = async (lat, lon) => {
  try {
    const city = await City.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $maxDistance: 50000, // 50 km radius, adjust as needed
        },
      },
    });
    return city;
  } catch (err) {
    console.error('Error finding closest city:', err);
    return null;
  }
};

// Route to get city by latitude and longitude
app.get('/geolocation', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const city = await findClosestCity(parseFloat(lat), parseFloat(lon));
  if (!city) {
    return res.status(404).json({ error: 'City not found' });
  }

  res.json({
    city: city.name,
    state: city.state_name,
    country: city.country_name,
    latitude: city.location.coordinates[1],
    longitude: city.location.coordinates[0],
  });
});

app.listen(PORT, () => {
  console.log(`Geolocation API is running on http://localhost:${PORT}`);
});
