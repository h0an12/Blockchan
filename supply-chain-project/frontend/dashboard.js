let currentRole = 'manufacturer';
let userAddress = null;
const API_URL = 'http://localhost:5001/api';

// Kết nối MetaMask
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            const walletStatus = document.getElementById('walletStatus');
            if (walletStatus) {
                walletStatus.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                walletStatus.style.color = '#4CAF50';
                walletStatus.style.cursor = 'pointer';
            }
            
            console.log('✅ Wallet connected:', userAddress);
            showNotification('✅ Đã kết nối ví thành công!', 'success');
            return true;
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            showNotification('❌ Không thể kết nối MetaMask', 'error');
            return false;
        }
    } else {
        showNotification('⚠️ Vui lòng cài đặt MetaMask!', 'warning');
        return false;
    }
}

// Kiểm tra kết nối
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            userAddress = accounts[0];
            const walletStatus = document.getElementById('walletStatus');
            if (walletStatus) {
                walletStatus.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                walletStatus.style.color = '#4CAF50';
            }
            return true;
        }
    }
    return false;
}

async function initDashboard() {
    await checkWalletConnection();
    await checkBackendStatus();
    setupEventListeners();
    updateUIForRole();
    await loadProducts();
    await loadProcessFlow();
}

async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        console.log('Backend status:', data);
        
        if (!data.contractDeployed) {
            showNotification('⚠️ Contract chưa được deploy!', 'warning');
        } else {
            console.log('✅ Contract đã sẵn sàng');
        }
    } catch (error) {
        console.error('Cannot connect to backend:', error);
        showNotification('❌ Không thể kết nối đến backend!', 'error');
    }
}

async function loadProcessFlow() {
    try {
        const response = await fetch(`${API_URL}/products/process/flow`);
        const data = await response.json();
        
        const processPanel = document.getElementById('processFlowPanel');
        if (processPanel && data.flow) {
            processPanel.innerHTML = `
                <h3>🔄 Quy trình chuỗi cung ứng</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${data.flow.map(step => `
                        <div style="display: flex; align-items: center; gap: 15px; padding: 12px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid ${step.color};">
                            <div style="font-size: 2rem;">${step.icon}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                    <strong style="color: ${step.color};">Bước ${step.step}: ${step.name}</strong>
                                    <span style="font-size: 12px; background: ${step.color}20; padding: 2px 8px; border-radius: 12px;">👤 ${step.role}</span>
                                </div>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">${step.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading process flow:', error);
    }
}

function setupEventListeners() {
    const createForm = document.getElementById('createProductForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userAddress) {
                showNotification('⚠️ Vui lòng kết nối MetaMask trước!', 'warning');
                await connectWallet();
                return;
            }
            await createProduct();
        });
    }
    
    const updateForm = document.getElementById('updateStateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userAddress) {
                showNotification('⚠️ Vui lòng kết nối MetaMask trước!', 'warning');
                await connectWallet();
                return;
            }
            await updateProductState();
        });
    }
    
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            currentRole = e.target.value;
            updateUIForRole();
            loadProducts();
        });
    }
    
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
}

function updateUIForRole() {
    const createPanel = document.getElementById('createProductPanel');
    if (createPanel) {
        createPanel.style.display = currentRole === 'manufacturer' ? 'block' : 'none';
    }
    
    const stateSelect = document.getElementById('newStateSelect');
    const partnerAddressInput = document.getElementById('partnerAddress');
    
    if (stateSelect) {
        let options = [];
        let partnerPlaceholder = '';
        
        switch(currentRole) {
            case 'manufacturer':
                options = [
                    { value: 'produce', label: '🏭 Bắt đầu sản xuất' },
                    { value: 'pack', label: '📦 Đóng gói' }
                ];
                partnerPlaceholder = 'Địa chỉ ví đơn vị đóng gói (nếu có)';
                break;
            case 'packager':
                options = [
                    { value: 'ship', label: '🚚 Gửi đi vận chuyển' }
                ];
                partnerPlaceholder = 'Địa chỉ ví đơn vị vận chuyển';
                break;
            case 'distributor':
                options = [
                    { value: 'receive', label: '📥 Xác nhận nhận hàng' }
                ];
                partnerPlaceholder = 'Địa chỉ ví cửa hàng nhận';
                break;
            case 'retailer':
                options = [
                    { value: 'sell', label: '💰 Bán cho khách hàng' }
                ];
                partnerPlaceholder = 'Địa chỉ ví khách hàng';
                break;
            default:
                options = [];
        }
        
        stateSelect.innerHTML = options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        
        if (partnerAddressInput) {
            partnerAddressInput.placeholder = partnerPlaceholder;
        }
    }
}

// ==================== TẠO SẢN PHẨM ====================
async function createProduct() {
    const name = document.getElementById('productName')?.value;
    const description = document.getElementById('productDesc')?.value;
    const origin = document.getElementById('productOrigin')?.value;
    const expiryDays = document.getElementById('expiryDays')?.value;
    let price = document.getElementById('productPrice')?.value;
    const imageFile = document.getElementById('productImage')?.files[0];
    
    if (!name || !description || !origin || !expiryDays || !price) {
        showNotification('⚠️ Vui lòng điền đầy đủ thông tin sản phẩm', 'warning');
        return;
    }
    
    const expiryDaysNum = parseInt(expiryDays);
    if (isNaN(expiryDaysNum) || expiryDaysNum <= 0) {
        showNotification('⚠️ Số ngày bảo hành phải là số dương (ví dụ: 365)', 'warning');
        return;
    }
    
    let priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
        showNotification('⚠️ Giá sản phẩm phải là số dương (ví dụ: 0.01)', 'warning');
        return;
    }
    
    if (priceNum > 1000) {
        showNotification('⚠️ Giá sản phẩm không được vượt quá 1000 ETH', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('origin', origin);
    formData.append('expiryDays', expiryDaysNum);
    formData.append('price', priceNum);
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        showNotification('⏳ Đang tạo sản phẩm... Vui lòng xác nhận trên MetaMask', 'info');
        
        const response = await fetch(`${API_URL}/products/create`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification(`✅ ${result.message}`, 'success');
            
            const createForm = document.getElementById('createProductForm');
            if (createForm) createForm.reset();
            document.getElementById('productImage').value = '';
            
            await loadProducts();
            
            if (result.qrCode) {
                const qrWindow = window.open();
                qrWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>QR Code - Sản phẩm #${result.productId}</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Arial, sans-serif;
                                text-align: center;
                                padding: 50px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                min-height: 100vh;
                                margin: 0;
                            }
                            .qr-container {
                                background: white;
                                border-radius: 20px;
                                padding: 30px;
                                display: inline-block;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                            }
                            img {
                                border: 3px solid #667eea;
                                border-radius: 15px;
                                padding: 20px;
                                background: white;
                            }
                            h1 {
                                color: #667eea;
                                margin-bottom: 20px;
                            }
                            .info {
                                margin-top: 20px;
                                color: #666;
                            }
                            a {
                                color: #667eea;
                                text-decoration: none;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            <h1>📦 Mã QR sản phẩm #${result.productId}</h1>
                            <img src="${result.qrCode}" alt="QR Code" />
                            <div class="info">
                                <p><strong>Tên sản phẩm:</strong> ${name}</p>
                                <p>Quét mã để xem thông tin chi tiết sản phẩm</p>
                                <p><a href="${API_URL}/products/${result.productId}" target="_blank">🔗 Xem chi tiết sản phẩm</a></p>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            }
        } else {
            showNotification(`❌ Lỗi: ${result.error || 'Không xác định'}`, 'error');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showNotification('❌ Không thể tạo sản phẩm. Kiểm tra kết nối backend và MetaMask!', 'error');
    }
}

// ==================== CẬP NHẬT TRẠNG THÁI ====================
async function updateProductState() {
    const productId = document.getElementById('updateProductId')?.value;
    const newState = document.getElementById('newStateSelect')?.value;
    const partnerAddress = document.getElementById('partnerAddress')?.value;
    
    if (!productId) {
        showNotification('⚠️ Vui lòng nhập mã sản phẩm', 'warning');
        return;
    }
    
    if (!newState) {
        showNotification('⚠️ Vui lòng chọn trạng thái mới', 'warning');
        return;
    }
    
    try {
        showNotification('⏳ Đang cập nhật trạng thái... Vui lòng xác nhận trên MetaMask', 'info');
        
        const response = await fetch(`${API_URL}/products/${productId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state: newState,
                toAddress: partnerAddress || undefined
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ ${result.message}`, 'success');
            document.getElementById('updateStateForm').reset();
            await loadProducts();
        } else {
            showNotification(`❌ Lỗi: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error updating state:', error);
        showNotification('❌ Không thể cập nhật trạng thái', 'error');
    }
}

// ==================== LẤY DANH SÁCH SẢN PHẨM ====================
async function loadProducts() {
    try {
        const productListDiv = document.getElementById('productList');
        if (!productListDiv) return;
        
        productListDiv.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Đang tải danh sách sản phẩm...</div>';
        
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            const stateColors = {
                'Created': '#ff9800',
                'Produced': '#2196F3',
                'Packed': '#9C27B0',
                'In Transit': '#00BCD4',
                'Delivered': '#4CAF50',
                'Sold': '#f44336',
                'Expired': '#9E9E9E'
            };
            
            productListDiv.innerHTML = `
                <div style="max-height: 500px; overflow-y: auto;">
                    ${data.products.map(p => `
                        <div class="product-list-item" onclick="viewProduct(${p.id})" style="cursor: pointer; margin-bottom: 10px; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; transition: all 0.3s;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 16px;">#${p.id}</strong> - ${p.name}
                                </div>
                                <div>
                                    <span style="background: ${stateColors[p.state] || '#999'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                        ${p.state}
                                    </span>
                                </div>
                            </div>
                            <div style="font-size: 13px; color: #666; margin-top: 8px;">
                                💰 ${p.price} ETH
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 15px; padding: 10px; background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-radius: 10px; text-align: center; font-weight: bold;">
                    📊 Tổng số: ${data.total} sản phẩm
                </div>
            `;
        } else {
            productListDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    📭 Chưa có sản phẩm nào
                    <br><small style="color: #aaa;">Hãy tạo sản phẩm mới với vai trò "Nhà sản xuất"</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        const productListDiv = document.getElementById('productList');
        if (productListDiv) {
            productListDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #f44336;">
                    ❌ Không thể tải danh sách sản phẩm
                    <br><small>Hãy chắc chắn backend đang chạy tại ${API_URL}</small>
                </div>
            `;
        }
    }
}

// ==================== XEM CHI TIẾT SẢN PHẨM (CẢI THIỆN) ====================
window.viewProduct = async function(productId) {
    try {
        showNotification(`🔍 Đang tải thông tin sản phẩm #${productId}...`, 'info');
        
        const response = await fetch(`${API_URL}/products/${productId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Không tìm thấy sản phẩm');
        }
        
        const product = await response.json();
        
        const detailWindow = window.open();
        const stateColors = {
            'Created': '#ff9800',
            'Produced': '#2196F3',
            'Packed': '#9C27B0',
            'In Transit': '#00BCD4',
            'Delivered': '#4CAF50',
            'Sold': '#f44336',
            'Expired': '#9E9E9E'
        };
        
        // Tạo HTML history chi tiết
        let historyHTML = '';
        if (product.history && product.history.length > 0) {
            historyHTML = `
                <div style="margin-top: 20px;">
                    <h3>📜 Lịch sử sản phẩm (${product.history.length} bước)</h3>
                    <div style="position: relative; padding-left: 30px;">
                        <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, #667eea, #764ba2);"></div>
                        ${product.history.map((event, idx) => `
                            <div style="position: relative; margin-bottom: 20px;">
                                <div style="position: absolute; left: -30px; top: 0; width: 30px; height: 30px; background: ${event.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                                    ${event.icon}
                                </div>
                                <div style="background: #f8f9fa; border-radius: 10px; padding: 12px; margin-left: 10px; border-left: 3px solid ${event.color};">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                        <strong style="color: ${event.color};">Bước ${event.order}: ${event.title}</strong>
                                    </div>
                                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">${event.raw}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            historyHTML = '<div style="margin-top: 20px;"><h3>📜 Lịch sử sản phẩm</h3><p style="color: #999;">Chưa có lịch sử</p></div>';
        }
        
        detailWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sản phẩm #${product.id} - ${product.name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 1000px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 20px;
                        padding: 30px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    }
                    h1 {
                        color: #667eea;
                        border-bottom: 3px solid #667eea;
                        padding-bottom: 10px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .info-card {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 10px;
                        transition: transform 0.2s;
                    }
                    .info-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .info-card h4 {
                        margin: 0 0 8px 0;
                        color: #667eea;
                    }
                    .info-card p {
                        margin: 0;
                        word-break: break-all;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-weight: bold;
                        background: ${stateColors[product.state] || '#999'};
                        color: white;
                    }
                    .valid { color: #4CAF50; font-weight: bold; }
                    .invalid { color: #f44336; font-weight: bold; }
                    hr { margin: 20px 0; border: none; border-top: 1px solid #e0e0e0; }
                    button {
                        padding: 10px 20px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    button:hover {
                        background: #5a67d8;
                        transform: translateY(-2px);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📦 ${product.name}</h1>
                    <p style="color: #666; margin-top: -10px;">Mã sản phẩm: #${product.id}</p>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <h4>📝 Mô tả</h4>
                            <p>${product.description || 'Không có mô tả'}</p>
                        </div>
                        <div class="info-card">
                            <h4>🌍 Xuất xứ</h4>
                            <p>${product.origin}</p>
                        </div>
                        <div class="info-card">
                            <h4>🔘 Trạng thái</h4>
                            <p><span class="status-badge">${product.state}</span></p>
                        </div>
                        <div class="info-card">
                            <h4>💰 Giá</h4>
                            <p><strong>${product.price} ETH</strong></p>
                        </div>
                        <div class="info-card">
                            <h4>📅 Ngày sản xuất</h4>
                            <p>${product.manufacturedDate}</p>
                        </div>
                        <div class="info-card">
                            <h4>⏰ Hạn sử dụng</h4>
                            <p>${product.expiryDate}</p>
                            <p class="${product.isValid ? 'valid' : 'invalid'}">
                                ${product.isValid ? '✅ Còn hạn sử dụng' : '❌ Đã hết hạn'}
                            </p>
                        </div>
                        <div class="info-card">
                            <h4>🏭 Nhà sản xuất</h4>
                            <p><small>${product.manufacturerShort || product.manufacturer}</small></p>
                        </div>
                        <div class="info-card">
                            <h4>🏪 Cửa hàng / Người mua</h4>
                            <p><small>${product.retailerShort || product.retailer || 'Chưa bán'}</small></p>
                        </div>
                    </div>
                    
                    <hr>
                    ${historyHTML}
                    <hr>
                    
                    <div style="text-align: center; margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button onclick="window.close()">Đóng</button>
                        <button onclick="window.location.href='${API_URL}/products/${product.id}/qrcode'">📱 Xem QR Code</button>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        showNotification(`✅ Đã tải thông tin sản phẩm #${productId}`, 'success');
    } catch (error) {
        console.error('Error viewing product:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
};

// ==================== HIỂN THỊ THÔNG BÁO ====================
function showNotification(message, type) {
    const oldNotif = document.querySelector('.notification-toast');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 14px 24px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: 14px;
        font-weight: 500;
        max-width: 350px;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ==================== THÊM CSS CHO NOTIFICATION ====================
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyle);

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});