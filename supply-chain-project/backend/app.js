const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Web3 = require('web3');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia.publicnode.com';
const web3 = new Web3(RPC_URL);

let contract = null;
let contractABI = null;
let accountObjects = {};

function initAccounts() {
    try {
        const manufacturerPrivateKey = process.env.MANUFACTURER_PRIVATE_KEY;
        const packagerPrivateKey = process.env.PACKAGER_PRIVATE_KEY;
        const distributorPrivateKey = process.env.DISTRIBUTOR_PRIVATE_KEY;
        const retailerPrivateKey = process.env.RETAILER_PRIVATE_KEY;
        const consumerPrivateKey = process.env.CONSUMER_PRIVATE_KEY;
        
        if (!manufacturerPrivateKey || manufacturerPrivateKey === '0x') {
            console.error('❌ Thiếu MANUFACTURER_PRIVATE_KEY trong .env');
            return false;
        }
        
        accountObjects = {
            manufacturer: {
                address: process.env.MANUFACTURER_ADDRESS,
                privateKey: manufacturerPrivateKey,
                account: web3.eth.accounts.privateKeyToAccount(manufacturerPrivateKey)
            },
            packager: {
                address: process.env.PACKAGER_ADDRESS,
                privateKey: packagerPrivateKey,
                account: web3.eth.accounts.privateKeyToAccount(packagerPrivateKey)
            },
            distributor: {
                address: process.env.DISTRIBUTOR_ADDRESS,
                privateKey: distributorPrivateKey,
                account: web3.eth.accounts.privateKeyToAccount(distributorPrivateKey)
            },
            retailer: {
                address: process.env.RETAILER_ADDRESS,
                privateKey: retailerPrivateKey,
                account: web3.eth.accounts.privateKeyToAccount(retailerPrivateKey)
            },
            consumer: {
                address: process.env.CONSUMER_ADDRESS,
                privateKey: consumerPrivateKey,
                account: web3.eth.accounts.privateKeyToAccount(consumerPrivateKey)
            }
        };
        
        console.log('\n✅ Tài khoản:');
        console.log(`   🏭 Manufacturer: ${accountObjects.manufacturer.address}`);
        console.log(`   📦 Packager: ${accountObjects.packager.address}`);
        console.log(`   🚚 Distributor: ${accountObjects.distributor.address}`);
        console.log(`   🏪 Retailer: ${accountObjects.retailer.address}`);
        console.log(`   👤 Consumer: ${accountObjects.consumer.address}`);
        
        return true;
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        return false;
    }
}

function loadContractABI() {
    try {
        const abiPath = path.join(__dirname, 'contractABI.json');
        if (fs.existsSync(abiPath)) {
            contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            console.log('✅ Đã load ABI');
            return true;
        }
        console.log('⚠️ Chưa có contractABI.json');
        return false;
    } catch (error) {
        console.error('Lỗi ABI:', error.message);
        return false;
    }
}

function initContract() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (contractAddress && contractABI && contractABI.length > 0) {
        contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log(`✅ Contract: ${contractAddress}`);
        return true;
    }
    console.log('⚠️ Chưa có contract');
    return false;
}

app.use(async (req, res, next) => {
    req.web3 = web3;
    req.contract = contract;
    req.accountObjects = accountObjects;
    req.accounts = {
        manufacturer: accountObjects.manufacturer?.address,
        packager: accountObjects.packager?.address,
        distributor: accountObjects.distributor?.address,
        retailer: accountObjects.retailer?.address,
        consumer: accountObjects.consumer?.address
    };
    next();
});

app.use('/api/products', require('./routes/productRoutes'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        rpc: RPC_URL,
        contractDeployed: contract !== null,
        contractAddress: process.env.CONTRACT_ADDRESS
    });
});

async function startServer() {
    console.log('\n🚀 Starting Backend...');
    console.log(`📡 RPC: ${RPC_URL}`);
    console.log(`📋 Contract: ${process.env.CONTRACT_ADDRESS}`);
    
    loadContractABI();
    initContract();
    initAccounts();
    
    app.listen(PORT, () => {
        console.log(`\n✅ Server: http://localhost:${PORT}`);
        console.log(`🌐 Dashboard: http://localhost:${PORT}/dashboard`);
    });
}

startServer();