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
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-blue?style=for-the-badge)](https://ethereum.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-363636?style=for-the-badge)](https://soliditylang.org)

</div>

## 📌 Tổng quan

**SupplyChain Tracker** là một hệ thống truy xuất nguồn gốc sản phẩm ứng dụng công nghệ Blockchain, cho phép các bên tham gia trong chuỗi cung ứng (Nhà sản xuất, Đơn vị đóng gói, Vận chuyển, Cửa hàng) cập nhật trạng thái sản phẩm một cách minh bạch và bất biến. Người tiêu dùng cuối cùng có thể quét mã QR hoặc tra cứu mã sản phẩm để xem toàn bộ lịch sử, từ nguồn gốc, quy trình sản xuất, vận chuyển đến hạn sử dụng.

## ✨ Tính năng

### 👥 Đa vai trò
| Vai trò | Hành động |
|:---|:---|
| 🏭 **Nhà sản xuất** | Tạo sản phẩm, Bắt đầu sản xuất, Đóng gói |
| 📦 **Đơn vị đóng gói** | Gửi đi vận chuyển |
| 🚚 **Vận chuyển** | Xác nhận nhận hàng |
| 🏪 **Cửa hàng** | Bán cho khách hàng |

### 📦 Quản lý sản phẩm
- Tạo sản phẩm mới (tên, mô tả, xuất xứ, giá, hình ảnh, hạn sử dụng)
- Cập nhật trạng thái sản phẩm theo quy trình chuỗi cung ứng
- Tra cứu thông tin chi tiết sản phẩm
- Xem lịch sử đầy đủ các bước sản phẩm đã trải qua

### 🔗 Blockchain
- **Smart Contract** trên Ethereum (mạng Sepolia testnet)
- **Bất biến**: Dữ liệu đã ghi không thể thay đổi hoặc xóa bỏ
- **Minh bạch**: Mọi giao dịch đều được công khai và có thể kiểm tra
- **Xác thực giao dịch** qua ví MetaMask (ECDSA)

### 📊 Thống kê & Báo cáo
- Biểu đồ phân bố sản phẩm theo trạng thái (Chart.js)
- Biểu đồ sản phẩm theo thời gian
- Tìm kiếm và lọc sản phẩm (theo tên, trạng thái, ngày tháng)
- Xuất báo cáo CSV / Excel
- In QR hàng loạt

### 🎨 Giao diện
- Responsive, thân thiện trên mọi thiết bị
- Hỗ trợ Dark Mode / Light Mode
- Mã QR động cho từng sản phẩm

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|:---|:---|:---:|
| Smart Contract | Solidity | ^0.8.0 |
| Blockchain Network | Ethereum Sepolia | Testnet |
| Backend | Node.js + Express | 4.18.2 |
| Kết nối Blockchain | Web3.js | 1.10.0 |
| Tạo QR Code | qrcode | 1.5.3 |
| Xử lý ảnh | multer | 1.4.5 |
| Frontend | HTML/CSS/JS | - |
| Biểu đồ | Chart.js | 4.4.0 |
| Xuất Excel | SheetJS (XLSX) | 0.20.2 |
| Ví điện tử | MetaMask | Chrome Extension |

## 📋 Yêu cầu hệ thống

- Node.js >= 16
- NPM >= 8
- Trình duyệt có cài extension **MetaMask** (Chrome, Firefox, Brave)
- Tài khoản trên mạng Sepolia (có SepoliaETH để test giao dịch)

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd supply-chain-project
cd backend
