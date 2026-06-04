let allProducts = [];
let stateChart = null;
let timelineChart = null;
let userAddress = null;

const API_URL = 'http://localhost:5001/api';

// Kết nối ví
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            const walletBtn = document.getElementById('connectWalletNav');
            if (walletBtn) {
                walletBtn.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                walletBtn.style.color = '#4CAF50';
            }
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

// Kiểm tra kết nối tự động
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            userAddress = accounts[0];
            const walletBtn = document.getElementById('connectWalletNav');
            if (walletBtn) {
                walletBtn.innerHTML = `🦊 ${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                walletBtn.style.color = '#4CAF50';
            }
            return true;
        }
    }
    return false;
}

// Hiển thị thông báo
function showNotification(message, type) {
    const oldNotif = document.querySelector('.notification-toast');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    let bgColor = '#2196F3';
    if (type === 'success') bgColor = '#4CAF50';
    else if (type === 'error') bgColor = '#f44336';
    else if (type === 'warning') bgColor = '#ff9800';
    
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 14px 24px;
        background: ${bgColor};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Lấy danh sách sản phẩm
async function loadAllProducts() {
    try {
        showNotification('⏳ Đang tải dữ liệu...', 'info');
        
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (!data.products || data.products.length === 0) {
            document.getElementById('filteredProductList').innerHTML = 
                '<div style="text-align:center; padding:40px; color:#999;">📭 Chưa có sản phẩm nào</div>';
            return;
        }
        
        // Lấy chi tiết từng sản phẩm
        allProducts = [];
        let loaded = 0;
        for (const p of data.products) {
            try {
                const detailRes = await fetch(`${API_URL}/products/${p.id}`);
                if (detailRes.ok) {
                    const detail = await detailRes.json();
                    allProducts.push(detail);
                }
                loaded++;
                if (loaded % 5 === 0) {
                    showNotification(`⏳ Đang tải... ${loaded}/${data.products.length}`, 'info');
                }
            } catch(e) {
                console.error(`Lỗi lấy chi tiết #${p.id}:`, e);
            }
        }
        
        updateStatistics();
        renderFilteredList();
        updateCharts();
        showNotification(`✅ Đã tải ${allProducts.length} sản phẩm`, 'success');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('❌ Không thể tải dữ liệu từ server', 'error');
        document.getElementById('filteredProductList').innerHTML = 
            '<div style="text-align:center; padding:40px; color:#f44336;">❌ Không thể kết nối đến backend</div>';
    }
}

// Cập nhật thống kê
function updateStatistics() {
    const total = allProducts.length;
    const valid = allProducts.filter(p => p.isValid).length;
    const expired = total - valid;
    const totalValue = allProducts.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    
    document.getElementById('totalProducts').textContent = total;
    document.getElementById('validProducts').textContent = valid;
    document.getElementById('expiredProducts').textContent = expired;
    document.getElementById('totalValue').textContent = totalValue.toFixed(4);
}

// Cập nhật biểu đồ
function updateCharts() {
    // Thống kê theo trạng thái
    const stateCount = {
        'Created': 0,
        'Produced': 0,
        'Packed': 0,
        'In Transit': 0,
        'Delivered': 0,
        'Sold': 0,
        'Expired': 0
    };
    
    allProducts.forEach(p => {
        if (stateCount[p.state] !== undefined) {
            stateCount[p.state]++;
        } else {
            stateCount['Created']++;
        }
    });
    
    const stateLabels = Object.keys(stateCount).filter(k => stateCount[k] > 0);
    const stateData = stateLabels.map(k => stateCount[k]);
    
    const stateColors = {
        'Created': '#ff9800',
        'Produced': '#2196F3',
        'Packed': '#9C27B0',
        'In Transit': '#00BCD4',
        'Delivered': '#4CAF50',
        'Sold': '#f44336',
        'Expired': '#9E9E9E'
    };
    
    if (stateChart) stateChart.destroy();
    
    const ctx = document.getElementById('stateChart').getContext('2d');
    stateChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: stateLabels,
            datasets: [{
                data: stateData,
                backgroundColor: stateLabels.map(l => stateColors[l] || '#667eea'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { 
                    callbacks: { 
                        label: (ctx) => `${ctx.label}: ${ctx.raw} sản phẩm (${((ctx.raw / allProducts.length) * 100).toFixed(1)}%)` 
                    }
                }
            }
        }
    });
    
    // Biểu đồ thời gian (sản phẩm theo tháng)
    const monthCount = {};
    allProducts.forEach(p => {
        if (p.manufacturedTimestamp) {
            const date = new Date(parseInt(p.manufacturedTimestamp) * 1000);
            if (!isNaN(date.getTime())) {
                const monthKey = `${date.getMonth()+1}/${date.getFullYear()}`;
                monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
            }
        }
    });
    
    const sortedMonths = Object.keys(monthCount).sort((a,b) => {
        const [m1,y1] = a.split('/');
        const [m2,y2] = b.split('/');
        return new Date(y1, m1 - 1) - new Date(y2, m2 - 1);
    });
    
    if (timelineChart) timelineChart.destroy();
    
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Số sản phẩm',
                data: sortedMonths.map(m => monthCount[m]),
                backgroundColor: '#667eea',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} sản phẩm` } }
            }
        }
    });
}

// Lọc và hiển thị danh sách
function renderFilteredList() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    
    let filtered = [...allProducts];
    
    // Lọc theo tên/ID
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.id.toString().includes(searchTerm)
        );
    }
    
    // Lọc theo trạng thái
    if (stateFilter) {
        filtered = filtered.filter(p => p.state === stateFilter);
    }
    
    // Lọc theo ngày
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(p => {
            if (!p.manufacturedTimestamp) return false;
            const pDate = new Date(parseInt(p.manufacturedTimestamp) * 1000);
            return pDate >= fromDate;
        });
    }
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(p => {
            if (!p.manufacturedTimestamp) return false;
            const pDate = new Date(parseInt(p.manufacturedTimestamp) * 1000);
            return pDate <= toDate;
        });
    }
    
    const container = document.getElementById('filteredProductList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">📭 Không tìm thấy sản phẩm nào</div>';
        return;
    }
    
    const stateColors = {
        'Created': '#ff9800',
        'Produced': '#2196F3',
        'Packed': '#9C27B0',
        'In Transit': '#00BCD4',
        'Delivered': '#4CAF50',
        'Sold': '#f44336',
        'Expired': '#9E9E9E'
    };
    
    container.innerHTML = `
        <div style="margin-bottom: 10px; padding: 8px; background: #f0f0f0; border-radius: 8px;">
            📊 Tìm thấy <strong>${filtered.length}</strong> sản phẩm
        </div>
        ${filtered.map(p => `
            <div class="product-list-item" onclick="viewProductDetail(${p.id})" style="cursor: pointer; margin-bottom: 10px; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; transition: all 0.3s;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <strong style="font-size: 16px;">#${p.id}</strong> - ${p.name}
                    </div>
                    <div>
                        <span style="background: ${stateColors[p.state] || '#999'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                            ${p.state}
                        </span>
                    </div>
                </div>
                <div style="font-size: 13px; color: #666; margin-top: 8px; display: flex; gap: 15px; flex-wrap: wrap;">
                    <span>💰 ${p.price} ETH</span>
                    <span>📅 ${p.manufacturedDate || 'Chưa có'}</span>
                    <span>${p.isValid ? '✅ Còn hạn' : '❌ Hết hạn'}</span>
                </div>
            </div>
        `).join('')}
    `;
}

// Xem chi tiết sản phẩm
window.viewProductDetail = function(productId) {
    window.open(`${API_URL}/products/${productId}`, '_blank');
};

// Xuất CSV
function exportToCSV() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    
    let filtered = [...allProducts];
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.id.toString().includes(searchTerm));
    }
    if (stateFilter) {
        filtered = filtered.filter(p => p.state === stateFilter);
    }
    
    if (filtered.length === 0) {
        showNotification('⚠️ Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    const headers = ['ID', 'Tên sản phẩm', 'Mô tả', 'Xuất xứ', 'Trạng thái', 'Giá (ETH)', 'Ngày sản xuất', 'Hạn sử dụng', 'Còn hạn', 'Nhà sản xuất'];
    const rows = filtered.map(p => [
        p.id, p.name, p.description || '', p.origin || '', p.state, p.price, 
        p.manufacturedDate || '', p.expiryDate || '', p.isValid ? 'Có' : 'Không',
        p.manufacturerShort || p.manufacturer || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `supply_chain_export_${new Date().toISOString().slice(0,19)}.csv`;
    link.click();
    showNotification('✅ Đã xuất file CSV', 'success');
}

// Xuất Excel
function exportToExcel() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    
    let filtered = [...allProducts];
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.id.toString().includes(searchTerm));
    }
    if (stateFilter) {
        filtered = filtered.filter(p => p.state === stateFilter);
    }
    
    if (filtered.length === 0) {
        showNotification('⚠️ Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    const data = filtered.map(p => ({
        'ID': p.id,
        'Tên sản phẩm': p.name,
        'Mô tả': p.description || '',
        'Xuất xứ': p.origin || '',
        'Trạng thái': p.state,
        'Giá (ETH)': p.price,
        'Ngày sản xuất': p.manufacturedDate || '',
        'Hạn sử dụng': p.expiryDate || '',
        'Còn hạn': p.isValid ? 'Có' : 'Không',
        'Nhà sản xuất': p.manufacturerShort || p.manufacturer || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SanPham');
    XLSX.writeFile(wb, `supply_chain_${new Date().toISOString().slice(0,19)}.xlsx`);
    showNotification('✅ Đã xuất file Excel', 'success');
}

// In QR hàng loạt
async function printBatchQR() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    
    let filtered = [...allProducts];
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.id.toString().includes(searchTerm));
    }
    if (stateFilter) {
        filtered = filtered.filter(p => p.state === stateFilter);
    }
    
    if (filtered.length === 0) {
        showNotification('⚠️ Không có sản phẩm nào để in QR', 'warning');
        return;
    }
    
    showNotification(`🖨️ Đang tạo ${filtered.length} mã QR...`, 'info');
    
    const qrWindow = window.open();
    qrWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>In QR Code hàng loạt</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                    .no-print { display: none; }
                    .qr-page { page-break-after: always; }
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                .no-print {
                    text-align: center;
                    margin-bottom: 20px;
                    position: sticky;
                    top: 0;
                    background: white;
                    padding: 10px;
                    z-index: 100;
                }
                .no-print button {
                    padding: 10px 20px;
                    margin: 0 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .no-print button:hover {
                    background: #5a67d8;
                }
                .qr-page {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 20px;
                }
                .qr-item {
                    text-align: center;
                    border: 1px solid #ddd;
                    border-radius: 15px;
                    padding: 15px;
                    width: 220px;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .qr-item img { 
                    width: 150px; 
                    height: 150px; 
                    object-fit: contain;
                }
                .qr-item h4 { 
                    margin: 10px 0 5px; 
                    color: #667eea;
                    font-size: 14px;
                }
                .qr-item p {
                    font-size: 12px;
                    color: #666;
                    margin: 3px 0;
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()">🖨️ In ngay</button>
                <button onclick="window.close()">❌ Đóng</button>
                <p style="margin-top: 10px; color: #666;">📌 Đang hiển thị ${filtered.length} mã QR</p>
            </div>
            <div id="qrContainer" class="qr-page" style="text-align:center;">⏳ Đang tạo mã QR...</div>
            <script>
                const products = ${JSON.stringify(filtered)};
                const apiUrl = "${API_URL}";
                
                async function generateQRs() {
                    const container = document.getElementById('qrContainer');
                    container.innerHTML = '';
                    
                    for (const p of products) {
                        try {
                            const qrResponse = await fetch(\`\${apiUrl}/products/\${p.id}/qrcode\`);
                            const qrText = await qrResponse.text();
                            const imgMatch = qrText.match(/<img[^>]+src="([^">]+)"/);
                            const qrCode = imgMatch ? imgMatch[1] : '';
                            
                            const div = document.createElement('div');
                            div.className = 'qr-item';
                            div.innerHTML = \`
                                <img src="\${qrCode}" alt="QR Code #\${p.id}" />
                                <h4>\${p.name.substring(0, 30)}\${p.name.length > 30 ? '...' : ''}</h4>
                                <p>Mã SP: #\${p.id}</p>
                                <p>💰 \${p.price} ETH</p>
                                <p>📦 \${p.state}</p>
                            \`;
                            container.appendChild(div);
                        } catch(e) {
                            console.error('Lỗi tạo QR cho SP', p.id, e);
                        }
                    }
                    document.querySelector('.no-print p').innerHTML = '✅ Đã tạo xong ' + products.length + ' mã QR';
                }
                generateQRs();
            <\/script>
        </body>
        </html>
    `);
}

// Chế độ tối
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkNow = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        document.getElementById('themeToggle').textContent = isDarkNow ? '☀️' : '🌙';
    });
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode();
    await checkWalletConnection();
    await loadAllProducts();
    
    document.getElementById('connectWalletNav').addEventListener('click', connectWallet);
    document.getElementById('searchInput').addEventListener('input', renderFilteredList);
    document.getElementById('stateFilter').addEventListener('change', renderFilteredList);
    document.getElementById('dateFromFilter').addEventListener('change', renderFilteredList);
    document.getElementById('dateToFilter').addEventListener('change', renderFilteredList);
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('stateFilter').value = '';
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        renderFilteredList();
    });
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('printQRBatch').addEventListener('click', printBatchQR);
});