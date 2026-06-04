const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper: Format address
const formatAddress = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'Chưa có';
    return `${addr.substring(0,6)}...${addr.substring(38)}`;
};

// Helper: Format timestamp
const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'Chưa có';
    return new Date(parseInt(timestamp) * 1000).toLocaleString('vi-VN');
};

// ==================== TẠO SẢN PHẨM ====================
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { name, description, origin, expiryDays, price } = req.body;
        const { contract, accountObjects, web3 } = req;
        
        if (!contract) {
            return res.status(503).json({ error: 'Contract chưa được khởi tạo' });
        }
        
        if (!accountObjects || !accountObjects.manufacturer) {
            return res.status(503).json({ error: 'Không tìm thấy tài khoản manufacturer' });
        }
        
        const expiryDaysNum = parseInt(expiryDays);
        let priceNum = parseFloat(price);
        
        if (isNaN(expiryDaysNum) || expiryDaysNum <= 0) {
            throw new Error('Số ngày bảo hành không hợp lệ');
        }
        
        if (isNaN(priceNum) || priceNum <= 0) {
            throw new Error('Giá sản phẩm không hợp lệ');
        }
        
        priceNum = Math.round(priceNum * 1000) / 1000;
        const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDaysNum * 86400);
        const priceInWei = web3.utils.toWei(priceNum.toString(), 'ether');
        const imageHash = req.file ? `/uploads/${req.file.filename}` : '';
        
        const fromAddress = accountObjects.manufacturer.address;
        const privateKey = accountObjects.manufacturer.privateKey;
        
        console.log(`\n📝 Tạo sản phẩm: ${name}`);
        console.log(`   Giá: ${priceNum} ETH`);
        console.log(`   Từ: ${fromAddress}`);
        
        let nonce = await web3.eth.getTransactionCount(fromAddress, 'pending');
        console.log(`   Nonce: ${nonce}`);
        
        const txData = contract.methods.createProduct(
            name, description, origin, expiryTimestamp, priceInWei, imageHash
        ).encodeABI();
        
        let gasEstimate = 500000;
        try {
            gasEstimate = await contract.methods.createProduct(
                name, description, origin, expiryTimestamp, priceInWei, imageHash
            ).estimateGas({ from: fromAddress });
            console.log(`   Gas estimate: ${gasEstimate}`);
        } catch(estimateError) {
            console.log(`   ⚠️ Estimate gas lỗi: ${estimateError.message}`);
            console.log(`   Dùng gas mặc định: ${gasEstimate}`);
        }
        
        let gasPrice = await web3.eth.getGasPrice();
        gasPrice = Math.floor(gasPrice * 1.2);
        console.log(`   Gas price: ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei`);
        
        const tx = {
            from: fromAddress,
            to: process.env.CONTRACT_ADDRESS,
            gas: Math.floor(gasEstimate * 1.5),
            gasPrice: gasPrice,
            nonce: nonce,
            data: txData
        };
        
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`   ✅ TX: ${receipt.transactionHash}`);
        console.log(`   Status: ${receipt.status ? 'Success' : 'Failed'}`);
        
        const counter = await contract.methods.productCounter().call();
        const productId = counter.toString();
        console.log(`   ✅ Product ID: ${productId}`);
        
        const qrData = `${req.protocol}://${req.get('host')}/api/products/${productId}`;
        const qrCode = await QRCode.toDataURL(qrData);
        
        return res.status(200).json({
            success: true,
            productId: productId,
            qrCode: qrCode,
            transactionHash: receipt.transactionHash,
            message: `✅ Sản phẩm ${name} đã được tạo với ID: ${productId}`
        });
        
    } catch (error) {
        console.error('❌ Lỗi tạo sản phẩm:', error.message);
        return res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ==================== CẬP NHẬT TRẠNG THÁI ====================
router.put('/:productId/state', async (req, res) => {
    try {
        const { productId } = req.params;
        const { state, toAddress } = req.body;
        const { contract, accountObjects, web3 } = req;
        
        if (!contract) {
            return res.status(503).json({ error: 'Contract chưa được khởi tạo' });
        }
        
        let fromAddress, privateKey, method, methodArgs;
        
        switch(state) {
            case 'produce':
                fromAddress = accountObjects.manufacturer.address;
                privateKey = accountObjects.manufacturer.privateKey;
                method = contract.methods.startProduction;
                methodArgs = [productId];
                break;
                
            case 'pack':
                fromAddress = accountObjects.manufacturer.address;
                privateKey = accountObjects.manufacturer.privateKey;
                method = contract.methods.packProduct;
                methodArgs = [productId];
                break;
                
            case 'ship':
                fromAddress = accountObjects.manufacturer.address;
                privateKey = accountObjects.manufacturer.privateKey;
                method = contract.methods.shipProduct;
                methodArgs = [productId];
                break;
                
            case 'receive':
                fromAddress = accountObjects.manufacturer.address;
                privateKey = accountObjects.manufacturer.privateKey;
                method = contract.methods.receiveProduct;
                methodArgs = [productId];
                break;
                
            case 'sell':
                fromAddress = accountObjects.manufacturer.address;
                privateKey = accountObjects.manufacturer.privateKey;
                method = contract.methods.sellProduct;
                methodArgs = [productId];
                break;
                
            default:
                throw new Error(`Trạng thái không hợp lệ: ${state}`);
        }
        
        console.log(`\n🔄 Cập nhật #${productId} -> ${state}`);
        console.log(`   Từ: ${fromAddress}`);
        
        let nonce = await web3.eth.getTransactionCount(fromAddress, 'pending');
        console.log(`   Nonce: ${nonce}`);
        
        const txData = method(...methodArgs).encodeABI();
        
        let gasEstimate = 300000;
        try {
            gasEstimate = await method(...methodArgs).estimateGas({ from: fromAddress });
            console.log(`   Gas estimate: ${gasEstimate}`);
        } catch(e) {
            console.log(`   ⚠️ Lỗi estimate gas: ${e.message}`);
            console.log(`   Dùng gas mặc định: ${gasEstimate}`);
        }
        
        let gasPrice = await web3.eth.getGasPrice();
        gasPrice = Math.floor(gasPrice * 1.2);
        console.log(`   Gas price: ${web3.utils.fromWei(gasPrice.toString(), 'gwei')} Gwei`);
        
        const tx = {
            from: fromAddress,
            to: process.env.CONTRACT_ADDRESS,
            gas: Math.floor(gasEstimate * 1.5),
            gasPrice: gasPrice,
            nonce: nonce,
            data: txData
        };
        
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`   ✅ TX: ${receipt.transactionHash}`);
        console.log(`   Status: ${receipt.status ? 'Success' : 'Failed'}`);
        
        res.json({
            success: true,
            message: `✅ Sản phẩm #${productId} đã chuyển sang trạng thái: ${state}`,
            transactionHash: receipt.transactionHash
        });
        
    } catch (error) {
        console.error('❌ Lỗi cập nhật trạng thái:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== LẤY THÔNG TIN SẢN PHẨM (CHI TIẾT HƠN) ====================
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { contract, web3, accountObjects } = req;
        
        if (!contract) {
            return res.status(503).json({ error: 'Contract chưa được khởi tạo' });
        }
        
        const product = await contract.methods.getProduct(productId).call();
        
        // Lấy history chi tiết hơn
        let history = [];
        try {
            const rawHistory = await contract.methods.getProductHistory(productId).call();
            
            // Map các sự kiện với mô tả chi tiết
            const stateMap = {
                'Product created': { 
                    icon: '📝',
                    title: 'Khởi tạo sản phẩm',
                    color: '#2196F3'
                },
                'Production started': { 
                    icon: '🏭',
                    title: 'Bắt đầu sản xuất',
                    color: '#FF9800'
                },
                'Product packed': { 
                    icon: '📦',
                    title: 'Đóng gói sản phẩm',
                    color: '#9C27B0'
                },
                'Product shipped': { 
                    icon: '🚚',
                    title: 'Vận chuyển',
                    color: '#00BCD4'
                },
                'Product received': { 
                    icon: '📥',
                    title: 'Nhận hàng',
                    color: '#4CAF50'
                },
                'Product sold': { 
                    icon: '💰',
                    title: 'Bán hàng',
                    color: '#f44336'
                }
            };
            
            history = rawHistory.map((event, index) => {
                const eventInfo = stateMap[event] || {
                    icon: '📌',
                    title: event,
                    color: '#999'
                };
                return {
                    raw: event,
                    title: eventInfo.title,
                    icon: eventInfo.icon,
                    color: eventInfo.color,
                    order: index + 1
                };
            });
        } catch(e) {
            console.log('Không thể lấy history:', e.message);
        }
        
        const isValid = await contract.methods.isProductValid(productId).call();
        
        const stateMap = {
            '0': 'Created',
            '1': 'Produced',
            '2': 'Packed',
            '3': 'In Transit',
            '4': 'Delivered',
            '5': 'Sold',
            '6': 'Expired'
        };
        
        // Lấy thông tin retailer (người bán cuối cùng)
        let retailer = 'Chưa có';
        if (product.currentOwner && product.currentOwner !== '0x0000000000000000000000000000000000000000') {
            retailer = product.currentOwner;
        }
        
        res.json({
            id: product.id,
            name: product.name,
            description: product.description,
            origin: product.origin,
            manufacturedDate: formatTimestamp(product.manufacturedDate),
            manufacturedTimestamp: product.manufacturedDate,
            expiryDate: formatTimestamp(product.expiryDate),
            expiryTimestamp: product.expiryDate,
            price: web3.utils.fromWei(product.price, 'ether'),
            state: stateMap[product.currentState] || 'Unknown',
            stateCode: product.currentState,
            manufacturer: product.manufacturer,
            manufacturerShort: formatAddress(product.manufacturer),
            currentOwner: product.currentOwner,
            currentOwnerShort: formatAddress(product.currentOwner),
            retailer: retailer,
            retailerShort: formatAddress(retailer),
            imageHash: product.imageHash,
            history: history,
            isValid: isValid
        });
    } catch (error) {
        console.error('Lỗi:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== LẤY TẤT CẢ SẢN PHẨM ====================
router.get('/', async (req, res) => {
    try {
        const { contract, web3 } = req;
        
        if (!contract) {
            return res.status(503).json({ error: 'Contract chưa được khởi tạo' });
        }
        
        const productCounter = await contract.methods.productCounter().call();
        const products = [];
        
        const stateMap = {
            '0': 'Created',
            '1': 'Produced',
            '2': 'Packed',
            '3': 'In Transit',
            '4': 'Delivered',
            '5': 'Sold',
            '6': 'Expired'
        };
        
        for (let i = 1; i <= productCounter; i++) {
            try {
                const product = await contract.methods.getProduct(i).call();
                products.push({
                    id: product.id,
                    name: product.name,
                    state: stateMap[product.currentState] || 'Unknown',
                    price: web3.utils.fromWei(product.price, 'ether')
                });
            } catch(e) {}
        }
        
        res.json({ total: products.length, products: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== LẤY QUY TRÌNH CHUỖI CUNG ỨNG ====================
router.get('/process/flow', (req, res) => {
    const flow = [
        {
            step: 1,
            name: '📝 Khởi tạo sản phẩm',
            role: 'Nhà sản xuất',
            description: 'Nhà sản xuất tạo sản phẩm mới trên hệ thống blockchain với đầy đủ thông tin: tên, mô tả, xuất xứ, hạn sử dụng, giá bán và hình ảnh.',
            icon: '📝',
            color: '#2196F3'
        },
        {
            step: 2,
            name: '🏭 Bắt đầu sản xuất',
            role: 'Nhà sản xuất',
            description: 'Nhà sản xuất bắt đầu quy trình sản xuất sản phẩm. Thời điểm này được ghi nhận trên blockchain.',
            icon: '🏭',
            color: '#FF9800'
        },
        {
            step: 3,
            name: '📦 Đóng gói',
            role: 'Nhà sản xuất / Đơn vị đóng gói',
            description: 'Sản phẩm được đóng gói, đóng tem, dán nhãn và chuẩn bị cho việc vận chuyển.',
            icon: '📦',
            color: '#9C27B0'
        },
        {
            step: 4,
            name: '🚚 Vận chuyển',
            role: 'Đơn vị vận chuyển',
            description: 'Sản phẩm được vận chuyển từ nhà sản xuất đến kho của nhà phân phối hoặc cửa hàng.',
            icon: '🚚',
            color: '#00BCD4'
        },
        {
            step: 5,
            name: '📥 Nhận hàng',
            role: 'Nhà phân phối / Cửa hàng',
            description: 'Cửa hàng hoặc nhà phân phối xác nhận đã nhận được hàng, cập nhật trạng thái lên blockchain.',
            icon: '📥',
            color: '#4CAF50'
        },
        {
            step: 6,
            name: '💰 Bán hàng',
            role: 'Cửa hàng',
            description: 'Sản phẩm được bán cho khách hàng cuối cùng. Đây là bước cuối cùng trong chuỗi cung ứng.',
            icon: '💰',
            color: '#f44336'
        }
    ];
    
    res.json({ flow: flow });
});

// ==================== QR CODE ====================
router.get('/:productId/qrcode', async (req, res) => {
    try {
        const { productId } = req.params;
        const productUrl = `${req.protocol}://${req.get('host')}/api/products/${productId}`;
        const qrCode = await QRCode.toDataURL(productUrl);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>QR Code #${productId}</title>
            <style>
                body { text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .container { background: white; border-radius: 20px; padding: 30px; display: inline-block; }
                img { border: 3px solid #667eea; border-radius: 15px; padding: 20px; }
                h1 { color: #667eea; }
            </style>
            </head>
            <body>
                <div class="container">
                    <h1>📦 Mã QR sản phẩm #${productId}</h1>
                    <img src="${qrCode}" />
                    <p><a href="${productUrl}">🔗 Xem chi tiết</a></p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;