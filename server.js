const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const xrpl = require('xrpl');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoutes');
const donationRouter = require('./routes/donationRoutes')

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.use( userRouter);
app.use(donationRouter);

// Initialize XRPL API with the server
const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233/', {
    connectionTimeout: 1000000
});

// Connect to XRPL
client.connect().then(() => {
    console.log('Connected to XRPL');
}).catch((error) => {
    console.error('Failed to connect to XRPL:', error);
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI,)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Start the server
const PORT = process.env.PORT || 3000;
const localhost = `http://localhost:${PORT}`;

app.listen(PORT, () => console.log(`Server running at ${localhost}`));
