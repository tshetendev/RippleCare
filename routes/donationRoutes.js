const express = require('express');
const router = express.Router();
const xrpl = require('xrpl');
const { Wallet, Transaction } = require('xrpl');
const shortid = require('shortid');
const mongoose = require('mongoose');
const User = require('./userRoutes');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});

const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233/', {
    connectionTimeout: 1000000
});

const campaignSchema = new mongoose.Schema({
    campaignId: { type: String, required: true, unique: true }, // Unique ID for the campaign
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    creatorWalletAddress: { type: String, required: true },
    image: { type: Buffer , required: true}, // Store image data as a buffer
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    campaignId: { type: String, required: true } // Add campaignId field to associate the transaction with a campaign
});

const Transactiondb = mongoose.model('Transaction', transactionSchema);

router.post('/create-campaign', upload.single('image'), async (req, res) => {
    try {
        // Check if user is logged in (i.e., if session exists)
        if (!req.session.user || !req.session.user.walletAddress) {
            return res.status(401).json({ error: 'User is not logged in' });
        }

        const { title, description, targetAmount } = req.body;

        // Retrieve the wallet address of the creator from the session
        const creatorWalletAddress = req.session.user.walletAddress;

        // Generate a unique identifier for the campaign
        const campaignId = shortid.generate();

        console.log('Uploaded File:', req.file);

        // Create a new campaign in MongoDB with the creator's wallet address and the generated campaign ID
        const campaign = new Campaign({
            campaignId: campaignId,
            title,
            description,
            targetAmount,
            image: req.file.buffer,
            creatorWalletAddress
        });

        await campaign.save();

        res.status(201).json({ message: 'Campaign created successfully', campaign });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating campaign' });
    }
});


router.post('/donate', async (req, res) => {
    try {
        // Check if user is logged in (i.e., if session exists)
        if (!req.session.user || !req.session.user.walletAddress) {
            return res.status(401).json({ error: 'User is not logged in' });
        }

        const { walletSecret, amount, campaignId } = req.body;
        const { walletAddress } = req.session.user;

        console.log(amount, walletSecret, walletAddress)

        // Validate wallet secret
        const secretValidationResult = await validateWalletSecret(walletAddress, walletSecret);

        if (secretValidationResult !== true) {
            return res.status(400).send(secretValidationResult);
        }

        // Find the campaign in the database based on the campaignId
        const campaign = await Campaign.findOne({ campaignId });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Check if the campaign status is "completed"
        if (campaign.status === 'completed') {
            return res.status(400).json({ error: 'Campaign is already completed. Further donations are not allowed.' });
        }

        // Extract the destination address from the campaign
        const destination = campaign.creatorWalletAddress;

        // Check if the sender is the same as the campaign creator
        if (walletAddress === destination) {
            return res.status(400).json({ error: "You can't donate to your own campaign" });
        }

        // Connect to the XRPL
        await client.connect();

        // Initialize the wallet using the secret
        const wallet = xrpl.Wallet.fromSecret(walletSecret);

        // Prepare the transaction
        const prepared = await client.autofill({
            "TransactionType": "Payment",
            "Account": walletAddress,
            "Amount": xrpl.xrpToDrops(amount.toString()),
            "Destination": destination,
            // "LastLedgerSequence": await client.getLedgerIndex() + 10
        });
        console.log(prepared);

        // Sign the prepared transaction
        const signed = wallet.sign(prepared);

        // Submit the transaction and wait for the results
        const tx = await client.submitAndWait(signed.tx_blob);

        // Request balance changes caused by the transaction
        const balanceChanges = xrpl.getBalanceChanges(tx.result.meta);

        // Disconnect from the XRPL
        client.disconnect();

        // Store transaction details in the database
        const transaction = new Transactiondb({
            transactionId: tx.id,
            sender: walletAddress,
            receiver: destination,
            amount: amount,
            campaignId: campaignId  // Include the campaignId associated with this transaction
        });
        await transaction.save();

        // Check if the campaign goal is reached
        const transactions = await Transactiondb.find({ campaignId });
        const totalRaised = transactions.reduce((total, transaction) => {
            return total + transaction.amount;
        }, 0);
        
        if (totalRaised >= campaign.targetAmount) {
            // Update the campaign status to "completed"
            campaign.status = 'completed';
            await campaign.save();
        }

        // Respond with success message and balance changes
        res.json({ success: true, balanceChanges });
    } catch (error) {
        console.error("Error sending XRP:", error);
        res.status(500).json({ success: false, error });
    }
});



router.get('/campaigns/:campaignId/transactions', async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Find the campaign in the database based on the campaignId
        const campaign = await Campaign.findOne({ campaignId });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Find all transactions associated with the campaign
        const transactions = await Transactiondb.find({ campaignId });

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving transactions' });
    }
});

router.get('/mycampaigns', async (req, res) => {
    try {
        // Retrieve the wallet address of the current user from the session
        const { walletAddress } = req.session.user;

        // Find all campaigns created by the current user
        const campaigns = await Campaign.find({ creatorWalletAddress: walletAddress });

        res.status(200).json(campaigns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving campaigns' });
    }
});

router.get('/campaigns', async (req, res) => {
    try {
        // Retrieve all campaigns from MongoDB
        const campaigns = await Campaign.find();

        // Send the campaigns as a JSON response
        res.status(200).json(campaigns);
    } catch (error) {
        // If an error occurs, send a 500 status code with an error message
        console.error(error);
        res.status(500).json({ error: 'Error retrieving campaigns' });
    }
});

router.get('/campaigns/:campaignId/raised', async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Find the campaign in the database based on the campaignId
        const campaign = await Campaign.findOne({ campaignId });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Find all transactions associated with the campaign
        const transactions = await Transactiondb.find({ campaignId });

        // Calculate the total amount raised
        const totalRaised = transactions.reduce((total, transaction) => {
            return total + transaction.amount;
        }, 0);

        res.status(200).json({ campaignId, totalRaised });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving raised amount for the campaign' });
    }
});

router.put('/campaigns/:campaignId/mark-completed', async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Find the campaign in the database based on the campaignId
        const campaign = await Campaign.findOne({ campaignId });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Find all transactions associated with the campaign
        const transactions = await Transactiondb.find({ campaignId });

        // Calculate the total amount raised
        const totalRaised = transactions.reduce((total, transaction) => {
            return total + transaction.amount;
        }, 0);

        // Check if the total raised amount is greater than or equal to the target amount
        if (totalRaised >= campaign.targetAmount) {
            // Update the campaign status to "completed" or set a "completed" flag
            campaign.status = 'Completed';
            await campaign.save();
            
            return res.status(200).json({ message: 'Campaign marked as completed' });
        } else {
            return res.status(400).json({ error: 'Campaign goal not reached yet' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error marking campaign as completed' });
    }
});

router.get('/completed-campaigns', async (req, res) => {
    try {
        // Find all campaigns with status "completed" from MongoDB
        const completedCampaigns = await Campaign.find({ status: 'Completed' });

        // Send the completed campaigns as a JSON response
        res.status(200).json(completedCampaigns);
    } catch (error) {
        // If an error occurs, send a 500 status code with an error message
        console.error(error);
        res.status(500).json({ error: 'Error retrieving completed campaigns' });
    }
});

router.get('/active-campaigns', async (req, res) => {
    try {
        // Find all campaigns with status "active" from MongoDB
        const activeCampaigns = await Campaign.find({ status: 'Active' });

        // Send the active campaigns as a JSON response
        res.status(200).json(activeCampaigns);
    } catch (error) {
        // If an error occurs, send a 500 status code with an error message
        console.error(error);
        res.status(500).json({ error: 'Error retrieving active campaigns' });
    }
});

// Route to fetch wallet balance
router.get('/wallet-balance', async (req, res) => {
    try {
        // Get wallet address from session
        const walletAddress = req.session.user.walletAddress;

        // Connect to XRPL
        await client.connect();

        // Get account info to fetch the balance
        const accountInfo = await client.request({
            command: 'account_info',
            account: walletAddress
        });

        // Close the connection to XRPL
        await client.disconnect();

        // Check if account info is retrieved successfully and has balance property
        if (accountInfo && accountInfo.result && accountInfo.result.account_data && accountInfo.result.account_data.Balance) {
            const balance = accountInfo.result.account_data.Balance;
            // Convert balance from drops to XRP (1 XRP = 1,000,000 drops)
            const xrpBalance = parseFloat(balance) / 1000000;
            res.json({ success: true, balance: xrpBalance });
        } else {
            console.error('Failed to retrieve wallet balance:', accountInfo);
            res.status(500).json({ success: false, error: 'Failed to fetch wallet balance' });
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch wallet balance' });
    }
});



async function validateWalletSecret(walletAddress, walletSecret) {
    try {
        // Check if the walletSecret is a string
        if (typeof walletSecret !== 'string') {
            return 'Wallet secret should be a string.';
        }

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

module.exports = router;
