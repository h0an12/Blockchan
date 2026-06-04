// Global variables
let userAddress = null;

const API_URL = 'http://localhost:5001/api';

// Hàm kết nối MetaMask
async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            const connectBtn = document.getElementById('connectWallet');
            if (connectBtn) {
                connectBtn.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                connectBtn.style.color = '#4CAF50';
                connectBtn.style.fontWeight = 'bold';
                connectBtn.removeEventListener('click', connectMetaMask);
            }
            
            console.log('✅ Đã kết nối MetaMask:', userAddress);
            showNotification('✅ Đã kết nối ví thành công!', 'success');
            
            // Lưu trạng thái
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', userAddress);
            
            return true;
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            showNotification('❌ Không thể kết nối MetaMask. Vui lòng thử lại!', 'error');
            return false;
        }
    } else {
        showNotification('⚠️ Vui lòng cài đặt MetaMask!', 'warning');
        return false;
    }
}

// Tự động kiểm tra kết nối
async function checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            userAddress = accounts[0];
            const connectBtn = document.getElementById('connectWallet');
            if (connectBtn) {
                connectBtn.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                connectBtn.style.color = '#4CAF50';
                connectBtn.style.fontWeight = 'bold';
                connectBtn.removeEventListener('click', connectMetaMask);
            }
            console.log('✅ Tự động kết nối:', userAddress);
            return true;
        }
    }
    return false;
}

function showNotification(message, type = 'info', duration = 4000) {
    const oldNotif = document.querySelector('.notification-toast');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    notif.style.cssText = `
        position: fixed;
        top: 80px;
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
        max-width: 400px;
        line-height: 1.4;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        if (notif && notif.remove) {
            notif.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }
    }, duration);
}

async function trackProduct(productId) {
    if (!productId || productId.trim() === '') {
        showNotification('⚠️ Vui lòng nhập mã sản phẩm', 'warning');
        return;
    }
    
    try {
        showNotification(`🔍 Đang tra cứu sản phẩm #${productId}...`, 'info');
        
        const response = await fetch(`${API_URL}/products/${productId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Không tìm thấy sản phẩm');
        }
        
        const product = await response.json();
        displayProductDetails(product);
        showNotification(`✅ Tìm thấy sản phẩm: ${product.name}`, 'success');
        
    } catch (error) {
        console.error('Error tracking product:', error);
        showNotification(`❌ ${error.message}`, 'error');
        
        const detailsSection = document.getElementById('productDetails');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
    }
}

function displayProductDetails(product) {
    const detailsSection = document.getElementById('productDetails');
    const detailsContent = document.getElementById('detailsContent');
    
    if (!detailsSection || !detailsContent) return;
    
    const getStateBadge = (state) => {
        const colors = {
            'Created': '#ff9800',
            'Produced': '#2196F3',
            'Packed': '#9C27B0',
            'In Transit': '#00BCD4',
            'Delivered': '#4CAF50',
            'Sold': '#f44336',
            'Expired': '#9E9E9E'
        };
        return `<span style="background: ${colors[state] || '#999'}; padding: 6px 14px; border-radius: 20px; color: white; font-weight: bold; display: inline-block;">${state}</span>`;
    };
    
    let historyHTML = '';
    if (product.history && product.history.length > 0) {
        historyHTML = `
            <div class="detail-card" style="grid-column: 1/-1;">
                <h4>📜 Lịch sử sản phẩm</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${product.history.map(event => `
                        <div class="history-item" style="padding: 10px; border-left: 3px solid #667eea; margin-bottom: 8px; background: #f9f9f9; border-radius: 5px;">
                            ⏱️ ${event}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        historyHTML = `
            <div class="detail-card" style="grid-column: 1/-1;">
                <h4>📜 Lịch sử sản phẩm</h4>
                <p style="color: #999;">Chưa có lịch sử</p>
            </div>
        `;
    }
    
    detailsContent.innerHTML = `
        <div class="detail-card">
            <h4>📦 Tên sản phẩm</h4>
            <p><strong style="font-size: 1.1rem;">${product.name}</strong></p>
        </div>
        <div class="detail-card">
            <h4>📝 Mô tả</h4>
            <p>${product.description || 'Không có mô tả'}</p>
        </div>
        <div class="detail-card">
            <h4>🌍 Xuất xứ</h4>
            <p>${product.origin}</p>
        </div>
        <div class="detail-card">
            <h4>🔘 Trạng thái</h4>
            <p>${getStateBadge(product.state)}</p>
        </div>
        <div class="detail-card">
            <h4>💰 Giá</h4>
            <p><strong>${product.price} ETH</strong></p>
        </div>
        <div class="detail-card">
            <h4>📅 Ngày sản xuất</h4>
            <p>${product.manufacturedDate}</p>
        </div>
        <div class="detail-card">
            <h4>⏰ Hạn sử dụng</h4>
            <p>${product.expiryDate}</p>
            <p style="margin-top: 5px; font-weight: bold; ${product.isValid ? 'color: #4CAF50' : 'color: #f44336'}">
                ${product.isValid ? '✅ Còn hạn sử dụng' : '❌ Đã hết hạn'}
            </p>
        </div>
        <div class="detail-card">
            <h4>🏭 Nhà sản xuất</h4>
            <p><small style="word-break: break-all;">${product.manufacturer}</small></p>
        </div>
        <div class="detail-card">
            <h4>🏪 Cửa hàng</h4>
            <p><small style="word-break: break-all;">${product.retailer !== 'Chưa có' ? product.retailer : 'Chưa bán'}</small></p>
        </div>
        ${historyHTML}
    `;
    
    detailsSection.style.display = 'block';
    detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Style cho notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', async () => {
    await checkConnection();
    
    const trackBtn = document.getElementById('trackProductBtn');
    const productIdInput = document.getElementById('productIdInput');
    const connectBtn = document.getElementById('connectWallet');
    
    if (connectBtn && !userAddress) {
        connectBtn.addEventListener('click', connectMetaMask);
    }
    
    if (trackBtn) {
        trackBtn.addEventListener('click', () => {
            const productId = productIdInput.value.trim();
            if (productId) {
                trackProduct(productId);
            } else {
                showNotification('⚠️ Vui lòng nhập mã sản phẩm', 'warning');
                productIdInput.focus();
            }
        });
    }
    
    if (productIdInput) {
        productIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && trackBtn) {
                trackBtn.click();
            }
        });
        
        productIdInput.focus();
    }
});