// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    // Enum cho trạng thái sản phẩm
    enum ProductState { 
        Created,      // Mới tạo
        Produced,     // Đã sản xuất
        Packed,       // Đã đóng gói
        InTransit,    // Đang vận chuyển
        Delivered,    // Đã giao đến cửa hàng
        Sold,         // Đã bán
        Returned      // Đã trả lại
    }
    
    // Cấu trúc sản phẩm
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
        address packager;
        address distributor;
        address retailer;
        address currentOwner;
        string imageHash;
        string qrCodeHash;
        uint256 timestamp;
        string[] history;  // Lưu lịch sử dạng text
    }
    
    // Cấu trúc người dùng
    struct User {
        address walletAddress;
        string name;
        string role;  // manufacturer, packager, distributor, retailer, consumer
        bool isRegistered;
        uint256 registeredAt;
    }
    
    // Mapping
    mapping(uint256 => Product) public products;
    mapping(address => User) public users;
    mapping(uint256 => address[]) public productHistory; // Ai đã từng sở hữu
    
    // Biến toàn cục
    uint256 public productCounter;
    address public owner;
    
    // Events
    event ProductCreated(uint256 indexed productId, string name, address indexed manufacturer);
    event ProductStateChanged(uint256 indexed productId, ProductState newState, address indexed changedBy);
    event UserRegistered(address indexed walletAddress, string name, string role);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier onlyRole(string memory _role) {
        require(users[msg.sender].isRegistered, "User not registered");
        require(keccak256(bytes(users[msg.sender].role)) == keccak256(bytes(_role)), "Not authorized");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // Đăng ký người dùng
    function registerUser(string memory _name, string memory _role) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(
            keccak256(bytes(_role)) == keccak256(bytes("manufacturer")) ||
            keccak256(bytes(_role)) == keccak256(bytes("packager")) ||
            keccak256(bytes(_role)) == keccak256(bytes("distributor")) ||
            keccak256(bytes(_role)) == keccak256(bytes("retailer")) ||
            keccak256(bytes(_role)) == keccak256(bytes("consumer")),
            "Invalid role"
        );
        
        users[msg.sender] = User({
            walletAddress: msg.sender,
            name: _name,
            role: _role,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        
        emit UserRegistered(msg.sender, _name, _role);
    }
    
    // Tạo sản phẩm mới (chỉ manufacturer)
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _origin,
        uint256 _expiryDate,
        uint256 _price,
        string memory _imageHash
    ) external onlyRole("manufacturer") returns (uint256) {
        productCounter++;
        
        string[] memory emptyHistory;
        
        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            description: _description,
            origin: _origin,
            manufacturedDate: block.timestamp,
            expiryDate: _expiryDate,
            price: _price,
            currentState: ProductState.Created,
            manufacturer: msg.sender,
            packager: address(0),
            distributor: address(0),
            retailer: address(0),
            currentOwner: msg.sender,
            imageHash: _imageHash,
            qrCodeHash: "",
            timestamp: block.timestamp,
            history: emptyHistory
        });
        
        // Thêm lịch sử
        _addHistory(productCounter, string(abi.encodePacked("Product created by ", users[msg.sender].name)));
        
        emit ProductCreated(productCounter, _name, msg.sender);
        return productCounter;
    }
    
    // Bắt đầu sản xuất
    function startProduction(uint256 _productId) external productExists(_productId) onlyRole("manufacturer") {
        require(products[_productId].currentState == ProductState.Created, "Invalid state");
        products[_productId].currentState = ProductState.Produced;
        _addHistory(_productId, string(abi.encodePacked("Production started by ", users[msg.sender].name)));
        emit ProductStateChanged(_productId, ProductState.Produced, msg.sender);
    }
    
    // Đóng gói sản phẩm
    function packProduct(uint256 _productId, address _packager) external productExists(_productId) onlyRole("manufacturer") {
        require(products[_productId].currentState == ProductState.Produced, "Product not produced");
        require(users[_packager].isRegistered && keccak256(bytes(users[_packager].role)) == keccak256(bytes("packager")), "Invalid packager");
        
        products[_productId].packager = _packager;
        products[_productId].currentState = ProductState.Packed;
        products[_productId].currentOwner = _packager;
        
        productHistory[_productId].push(_packager);
        _addHistory(_productId, string(abi.encodePacked("Product packed by ", users[_packager].name)));
        
        emit ProductTransferred(_productId, msg.sender, _packager);
        emit ProductStateChanged(_productId, ProductState.Packed, msg.sender);
    }
    
    // Vận chuyển
    function shipProduct(uint256 _productId, address _distributor) external productExists(_productId) onlyRole("packager") {
        require(products[_productId].currentState == ProductState.Packed, "Product not packed");
        require(msg.sender == products[_productId].packager, "Not the packager");
        require(users[_distributor].isRegistered && keccak256(bytes(users[_distributor].role)) == keccak256(bytes("distributor")), "Invalid distributor");
        
        products[_productId].distributor = _distributor;
        products[_productId].currentState = ProductState.InTransit;
        products[_productId].currentOwner = _distributor;
        
        productHistory[_productId].push(_distributor);
        _addHistory(_productId, string(abi.encodePacked("Product shipped to ", users[_distributor].name)));
        
        emit ProductTransferred(_productId, msg.sender, _distributor);
        emit ProductStateChanged(_productId, ProductState.InTransit, msg.sender);
    }
    
    // Nhận hàng tại cửa hàng
    function receiveProduct(uint256 _productId, address _retailer) external productExists(_productId) onlyRole("distributor") {
        require(products[_productId].currentState == ProductState.InTransit, "Product not in transit");
        require(msg.sender == products[_productId].distributor, "Not the distributor");
        require(users[_retailer].isRegistered && keccak256(bytes(users[_retailer].role)) == keccak256(bytes("retailer")), "Invalid retailer");
        
        products[_productId].retailer = _retailer;
        products[_productId].currentState = ProductState.Delivered;
        products[_productId].currentOwner = _retailer;
        
        productHistory[_productId].push(_retailer);
        _addHistory(_productId, string(abi.encodePacked("Product delivered to ", users[_retailer].name)));
        
        emit ProductTransferred(_productId, msg.sender, _retailer);
        emit ProductStateChanged(_productId, ProductState.Delivered, msg.sender);
    }
    
    // Bán sản phẩm
    function sellProduct(uint256 _productId, address _consumer) external productExists(_productId) onlyRole("retailer") {
        require(products[_productId].currentState == ProductState.Delivered, "Product not delivered");
        require(msg.sender == products[_productId].retailer, "Not the retailer");
        require(users[_consumer].isRegistered, "Consumer not registered");
        
        products[_productId].currentState = ProductState.Sold;
        products[_productId].currentOwner = _consumer;
        
        productHistory[_productId].push(_consumer);
        _addHistory(_productId, string(abi.encodePacked("Product sold to ", users[_consumer].name)));
        
        emit ProductTransferred(_productId, msg.sender, _consumer);
        emit ProductStateChanged(_productId, ProductState.Sold, msg.sender);
    }
    
    // Thêm QR code hash
    function setQRCode(uint256 _productId, string memory _qrHash) external productExists(_productId) onlyRole("manufacturer") {
        products[_productId].qrCodeHash = _qrHash;
        _addHistory(_productId, "QR code generated");
    }
    
    // Lấy thông tin đầy đủ của sản phẩm
    function getProductDetails(uint256 _productId) external view productExists(_productId) returns (
        uint256 id,
        string memory name,
        string memory description,
        string memory origin,
        uint256 manufacturedDate,
        uint256 expiryDate,
        uint256 price,
        string memory state,
        address manufacturer,
        address packager,
        address distributor,
        address retailer,
        address currentOwner,
        string memory imageHash,
        string memory qrCodeHash,
        string[] memory history
    ) {
        Product memory p = products[_productId];
        string memory stateStr;
        
        if (p.currentState == ProductState.Created) stateStr = "Created";
        else if (p.currentState == ProductState.Produced) stateStr = "Produced";
        else if (p.currentState == ProductState.Packed) stateStr = "Packed";
        else if (p.currentState == ProductState.InTransit) stateStr = "In Transit";
        else if (p.currentState == ProductState.Delivered) stateStr = "Delivered";
        else if (p.currentState == ProductState.Sold) stateStr = "Sold";
        else stateStr = "Returned";
        
        return (
            p.id, p.name, p.description, p.origin, p.manufacturedDate,
            p.expiryDate, p.price, stateStr, p.manufacturer, p.packager,
            p.distributor, p.retailer, p.currentOwner, p.imageHash, p.qrCodeHash, p.history
        );
    }
    
    // Lấy tất cả sản phẩm của một địa chỉ
    function getProductsByOwner(address _owner) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](productCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].currentOwner == _owner) {
                result[count] = i;
                count++;
            }
        }
        
        // Cắt mảng cho đúng kích thước
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
    // Helper function để thêm lịch sử
    function _addHistory(uint256 _productId, string memory _event) internal {
        string memory historyEntry = string(abi.encodePacked(
            _event, " at ", _timestampToString(block.timestamp)
        ));
        
        // Vì mảng dynamic trong struct không thể push trực tiếp, ta cần tạo mảng mới
        string[] memory newHistory = new string[](products[_productId].history.length + 1);
        for (uint i = 0; i < products[_productId].history.length; i++) {
            newHistory[i] = products[_productId].history[i];
        }
        newHistory[products[_productId].history.length] = historyEntry;
        products[_productId].history = newHistory;
    }
    
    // Helper: Convert timestamp to string (đơn giản hóa)
    function _timestampToString(uint256 timestamp) internal pure returns (string memory) {
        // Trong thực tế nên dùng thư viện, đây là version đơn giản
        return string(abi.encodePacked(timestamp));
    }
    
    // Kiểm tra sản phẩm còn hạn không
    function isProductValid(uint256 _productId) external view productExists(_productId) returns (bool) {
        return block.timestamp <= products[_productId].expiryDate;
    }
}