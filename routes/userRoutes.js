const express = require('express');
const router = express.Router();
const { Wallet } = require('xrpl');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define User schema
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    walletAddress: { type: String, unique: true },
    walletSecret: String
});

const User = mongoose.model('User', userSchema);

// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword, walletAddress, walletSecret } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).send('User with this email already exists');
        }

        // Check if password matches confirm password
        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        // Validate XRP wallet address
        if (!isValidRippleAddress(walletAddress)) {
            return res.status(400).send('Invalid XRP wallet address');
        }

        // Validate wallet secret
        const secretValidationResult = await validateWalletSecret(walletAddress, walletSecret);

        if (secretValidationResult !== true) {
            return res.status(400).send(secretValidationResult);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Hash wallet secret
        const hashedWalletSecret = await bcrypt.hash(walletSecret, 10);

        // Create user in MongoDB
        const user = new User({
            email,
            password: hashedPassword,
            walletAddress,
            walletSecret: hashedWalletSecret
        });

        await user.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Function to validate if the provided wallet secret corresponds to the given wallet address
async function validateWalletSecret(walletAddress, walletSecret) {
    try {
        // Create a new wallet object from the provided wallet secret
        const wallet = Wallet.fromSeed(walletSecret);

        // Get the wallet address derived from the provided wallet secret
        const secretAddress = wallet.address;

        // Compare the provided wallet address and the wallet address derived from the wallet secret
        if (secretAddress === walletAddress) {
            return true; // Authentication successful
        } else {
            return 'Invalid wallet secret.'; // Authentication failed
        }
    } catch (error) {
        console.error(error);
        return 'Error validating wallet secret.'; // Error occurred during validation
    }
}

// Function to validate XRP wallet address
function isValidRippleAddress(address) {
    const rippleAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/;
    return rippleAddressRegex.test(address);
}

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in MongoDB by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Invalid password');
        }

        // Store user details in session (assuming session middleware is already set up)
        req.session.user = {
            email: user.email,
            walletAddress: user.walletAddress,
            // walletSecret: user.walletSecret
        };

        console.log(req.session.user)

        res.status(200).send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

function isLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        // User is logged in
        return res.json({ isLoggedIn: true });
    } else {
        // User is not logged in
        return res.json({ isLoggedIn: false });
    }
}

// Route to check login status
router.get('/checkLoginStatus', isLoggedIn);


// Logout route
router.post('/logout', (req, res) => {
    // Destroy session on logout
    req.session.destroy();
    res.status(200).send('Logged out successfully');
});

module.exports = router;
