<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
   Hệ thống truy xuất nguồn gốc sản phẩm - SupplyChain Tracker
</h2>
<div align="center">
    <p align="center">
        <img src="https://github.com/user-attachments/assets/ee72b1c4-04c7-4e4b-8d7a-8cf16932804a" width="170" />
        <img src="https://github.com/user-attachments/assets/1459f5bf-7fc9-4462-996d-eb1ef7633a97" width="180" />
        <img src="https://github.com/user-attachments/assets/f081d02c-b644-4e87-a40c-fcb8383c2985" width="200" />
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

## 1. Tính năng

- **Đa vai trò**: Nhà sản xuất, Đơn vị đóng gói, Vận chuyển, Cửa hàng
- **Quản lý sản phẩm**: Tạo sản phẩm, cập nhật trạng thái, tra cứu lịch sử
- **Blockchain**: Smart Contract trên Ethereum Sepolia, dữ liệu bất biến
- **QR Code**: Mã QR động cho từng sản phẩm
- **Thống kê**: Biểu đồ tròn, biểu đồ cột, xuất CSV/Excel
- **Giao diện**: Responsive, hỗ trợ Dark Mode / Light Mode

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Smart Contract | Solidity ^0.8.0 |
| Blockchain Network | Ethereum Sepolia (Testnet) |
| Backend | Node.js + Express 4.18.2 |
| Kết nối Blockchain | Web3.js 1.10.0 |
| Tạo QR Code | qrcode 1.5.3 |
| Xử lý ảnh | multer 1.4.5 |
| Frontend | HTML/CSS/JS |
| Biểu đồ | Chart.js 4.4.0 |
| Xuất Excel | SheetJS (XLSX) 0.20.2 |
| Ví điện tử | MetaMask (Chrome Extension) |

## 3. Yêu cầu hệ thống

- Node.js >= 16
- NPM >= 8
- Trình duyệt có cài extension **MetaMask** (Chrome, Firefox, Brave)
- Tài khoản trên mạng Sepolia (có SepoliaETH để test giao dịch)

## 4. Cài đặt

### 4.1. Clone repository

```bash
git clone <repository-url>
cd supply-chain-project/backend
```
### 4.2. Cài đặt dependencies
```bash
npm install
```
### 4.3. Cấu hình biến môi trường
- Tạo file .env trong thư mục backend:
```bash
PORT=5001
RPC_URL=https://ethereum-sepolia.publicnode.com
CONTRACT_ADDRESS=0x4a5c332e4585d0cc02C3827469e38575e02AA36d

MANUFACTURER_ADDRESS=0x45D0065dE99767f10888a52F99Ba11e8954338D6
MANUFACTURER_PRIVATE_KEY=0x31721068f95107db544106c5a9f1013973cb4a9ded402ca7b65ec889423cb8a4

PACKAGER_ADDRESS=0x45D0065dE99767f10888a52F99Ba11e8954338D6
PACKAGER_PRIVATE_KEY=0x31721068f95107db544106c5a9f1013973cb4a9ded402ca7b65ec889423cb8a4

DISTRIBUTOR_ADDRESS=0x45D0065dE99767f10888a52F99Ba11e8954338D6
DISTRIBUTOR_PRIVATE_KEY=0x31721068f95107db544106c5a9f1013973cb4a9ded402ca7b65ec889423cb8a4

RETAILER_ADDRESS=0x45D0065dE99767f10888a52F99Ba11e8954338D6
RETAILER_PRIVATE_KEY=0x31721068f95107db544106c5a9f1013973cb4a9ded402ca7b65ec889423cb8a4

CONSUMER_ADDRESS=0x45D0065dE99767f10888a52F99Ba11e8954338D6
CONSUMER_PRIVATE_KEY=0x31721068f95107db544106c5a9f1013973cb4a9ded402ca7b65ec889423cb8a4
```
### 4.4.Deploy Smart Contract lên Sepolia
```bash
npm run deploy
```
### 4.5.Chạy ứng dụng
```bash
npm run dev
# hoặc
npm start
```
### 4.6.Truy cập
Trang	URL
Trang chủ	http://localhost:5001
Dashboard	http://localhost:5001/dashboard
Thống kê	http://localhost:5001/analytics
## 5. Tính năng
```bash
supply-chain-project/
├── backend/
│   ├── routes/
│   │   └── productRoutes.js      # API xử lý sản phẩm
│   ├── uploads/                  # Thư mục lưu ảnh upload
│   ├── .env                      # Biến môi trường
│   ├── app.js                    # Server chính
│   ├── contractABI.json          # ABI của Smart Contract
│   ├── deploy.js                 # Script deploy contract
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── analytics.html            # Trang thống kê
│   ├── analytics.js
│   ├── dashboard.html            # Dashboard quản lý
│   ├── dashboard.js
│   ├── index.html                # Trang chủ
│   ├── script.js
│   └── style.css
└── blockchain/
    └── SupplyChain.sol           # Smart Contract
```
## 6. Quy trình chuỗi cung ứng
 Hệ thống định nghĩa 7 trạng thái cho vòng đời sản phẩm:

| Bước | Trạng thái | Mô tả | Vai trò thực hiện |
|------|------------|--------|------------------|
| 1 | Created | Sản phẩm vừa được tạo | Nhà sản xuất |
| 2 | Produced | Bắt đầu sản xuất | Nhà sản xuất |
| 3 | Packed | Đã đóng gói | Đơn vị đóng gói |
| 4 | InTransit | Đang vận chuyển | Đơn vị vận chuyển |
| 5 | Delivered | Đã nhận hàng | Cửa hàng |
| 6 | Sold | Đã bán cho khách hàng | Cửa hàng |
| 7 | Expired | Hết hạn sử dụng | Hệ thống tự động |
## 7. API Endpoints

| Method | Endpoint | Mô tả |
|----------|------------|---------|
| POST | `/api/products/create` | Tạo sản phẩm mới (hỗ trợ upload ảnh) |
| PUT | `/api/products/:id/state` | Cập nhật trạng thái sản phẩm |
| GET | `/api/products` | Lấy danh sách tất cả sản phẩm |
| GET | `/api/products/:id` | Lấy chi tiết sản phẩm theo ID |
| GET | `/api/products/:id/qrcode` | Tạo mã QR cho sản phẩm |
| GET | `/api/products/process/flow` | Lấy quy trình chuỗi cung ứng |
| GET | `/api/health` | Kiểm tra trạng thái server và smart contract |
## 8. Phân quyền

| Chức năng | Nhà sản xuất | Đóng gói | Vận chuyển | Cửa hàng | Người dùng |
|------------|------------|------------|------------|------------|------------|
| Tạo sản phẩm | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bắt đầu sản xuất | ✅ | ❌ | ❌ | ❌ | ❌ |
| Đóng gói | ✅ | ✅ | ❌ | ❌ | ❌ |
| Vận chuyển | ❌ | ✅ | ✅ | ❌ | ❌ |
| Nhận hàng | ❌ | ❌ | ✅ | ✅ | ❌ |
| Bán hàng | ❌ | ❌ | ❌ | ✅ | ❌ |
| Tra cứu sản phẩm | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xem thống kê | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xuất báo cáo CSV/Excel | ✅ | ✅ | ✅ | ✅ | ✅ |
## 9. Smart Contract

### 9.1. Cấu trúc Product

```solidity
enum ProductState {
    Created,
    Produced,
    Packed,
    InTransit,
    Delivered,
    Sold,
    Expired
}

struct Product {
    uint256 id;
    string name;
    string description;
    string origin;
    uint256 manufacturedDate;
    uint256 expiryDate;
    uint256 price;
    ProductState currentState;
    address manufacturer;
    address currentOwner;
    string imageHash;
    string[] history;
}
```

### 9.2. Các hàm chính

| Hàm | Input | Mô tả |
|------|------|------|
| createProduct | name, description, origin, expiryDate, price, imageHash | Tạo sản phẩm mới |
| startProduction | productId | Bắt đầu sản xuất |
| packProduct | productId | Đóng gói sản phẩm |
| shipProduct | productId | Vận chuyển sản phẩm |
| receiveProduct | productId | Xác nhận nhận hàng |
| sellProduct | productId | Bán sản phẩm |
| getProduct | productId | Lấy thông tin sản phẩm |
| getProductHistory | productId | Lấy lịch sử sản phẩm |
| isProductValid | productId | Kiểm tra hạn sử dụng |

### 9.3. Cơ chế xác thực

```solidity
require(
    products[_productId].id != 0,
    "Product not found"
);

require(
    products[_productId].currentState == ProductState.Produced,
    "Invalid state"
);
```

---

## 10. Blockchain hoạt động như thế nào

Mỗi lần cập nhật trạng thái sản phẩm sẽ tạo một giao dịch trên mạng Ethereum Sepolia.

| Bước | Mô tả |
|--------|---------|
| 1 | Smart Contract kiểm tra trạng thái hiện tại có hợp lệ hay không |
| 2 | Backend tạo giao dịch và gửi lên blockchain |
| 3 | Người dùng ký giao dịch bằng MetaMask |
| 4 | Mạng Sepolia xác nhận giao dịch |
| 5 | Dữ liệu được ghi lên blockchain |
| 6 | Lịch sử sản phẩm được cập nhật |
## 11. Hình ảnh minh họa

### Trang chủ tra cứu sản phẩm

<img width="1550" height="811" alt="Trang chủ tra cứu sản phẩm" src="https://github.com/user-attachments/assets/1c53495f-9ba1-4269-a98e-1985d9a539b4" />

### Dashboard quản lý theo vai trò

<img width="1487" height="584" alt="Dashboard quản lý theo vai trò" src="https://github.com/user-attachments/assets/975893b1-1576-4932-9166-21fbe7810416" />

### Form tạo sản phẩm mới

<img width="699" height="737" alt="Form tạo sản phẩm mới" src="https://github.com/user-attachments/assets/37790e20-23ff-495e-9975-aa91e036560a" />

### Trang thống kê & phân tích

<img width="1426" height="719" alt="Trang thống kê biểu đồ" src="https://github.com/user-attachments/assets/7fdbf239-6a51-4467-812c-e051258e126f" />


### Mã QR sản phẩm

<img width="573" height="469" alt="Mã QR sản phẩm" src="https://github.com/user-attachments/assets/4eeef99f-758e-40e3-b46b-4593371b4b1d" />

### Chi tiết sản phẩm và lịch sử

<img width="1358" height="706" alt="Chi tiết sản phẩm với lịch sử" src="https://github.com/user-attachments/assets/6af00ed7-548a-452a-b928-458277861b6f" />
## 12. Hướng phát triển

- Tích hợp **IPFS** để lưu trữ hình ảnh phi tập trung.
- Bổ sung **vai trò kiểm định chất lượng**.
- Tích hợp **AI** phát hiện bất thường trong chuỗi cung ứng.
- Xây dựng **Mobile App Android/iOS**.
- Tích hợp **IoT Sensors** theo dõi nhiệt độ và độ ẩm.
- Theo dõi **Carbon Footprint** và chứng chỉ xanh.
- Hỗ trợ đa blockchain (Ethereum, Polygon, BNB Chain).

---

## 📧 Liên hệ

**LÊ BÁ HOAN **
📩 Email: lebahoan1812@gmail.com

---
<div align="center">

### SupplyChain Tracker
Blockchain-based Product Traceability System
Made with ❤️ by AIoTLab - DaiNam University
</div>

