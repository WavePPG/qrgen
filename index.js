const express = require('express');
const app = express();
const QRCode = require('qrcode');
const generatePayload = require('promptpay-qr');
const bodyParser = require('body-parser');
const _ = require('lodash');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// In-memory store for transactions
const transactions = {};

app.post('/generateQR', (req, res) => {
    const amount = parseFloat(_.get(req, ["body", "amount"]));
    const mobileNumber = '0623607693'; // Replace with your actual mobile number
    const payload = generatePayload(mobileNumber, { amount });
    const option = {
        color: {
            dark: '#000',
            light: '#fff'
        }
    };
    // Generate a unique transaction ID
    const transactionId = Date.now().toString();
    // Store the transaction details
    transactions[transactionId] = { amount, status: 'pending' };

    QRCode.toDataURL(payload, option, (err, url) => {
        if (err) {
            console.error('QR Code generation failed:', err);
            return res.status(400).json({
                RespCode: 400,
                RespMessage: 'Failed to generate QR code: ' + err
            });
        }
        return res.status(200).json({
            RespCode: 200,
            RespMessage: 'QR code generated successfully',
            Result: url,
            TransactionId: transactionId
        });
    });
});

app.post('/checkPaymentStatus', (req, res) => {
    const transactionId = _.get(req, ["body", "transactionId"]);
    const transaction = transactions[transactionId];

    if (!transaction) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: 'Transaction not found'
        });
    }

    // Here, you should integrate actual payment status checking from the payment gateway
    // For example, making an API call to the payment provider to check the transaction status
    // For simulation purposes, we'll manually update the status using another endpoint

    const paymentStatus = {
        transactionId: transactionId,
        status: transaction.status, // This should be updated based on the actual payment status
        amount: transaction.amount,
        timestamp: new Date().toISOString()
    };

    return res.status(200).json({
        RespCode: 200,
        RespMessage: 'Payment status retrieved successfully',
        Result: paymentStatus
    });
});

// Endpoint to manually update the transaction status for testing purposes
app.post('/updateTransactionStatus', (req, res) => {
    const transactionId = _.get(req, ["body", "transactionId"]);
    const status = _.get(req, ["body", "status"]);
    
    if (!transactions[transactionId]) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: 'Transaction not found'
        });
    }

    transactions[transactionId].status = status;

    return res.status(200).json({
        RespCode: 200,
        RespMessage: 'Transaction status updated successfully'
    });
});

module.exports = app;
