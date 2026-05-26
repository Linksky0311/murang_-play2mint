// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

/**
 * SkinShop — VR 가상 악기 스킨 구매/소유권 컨트랙트
 *  - 유저는 먼저 token.approve(SkinShop 주소, 가격)를 호출
 *  - 그 다음 SkinShop.purchase(skinId)를 호출하면 토큰이 차감되고 소유권이 기록됨
 *
 * 배포 순서:
 *  1) MURANGCoin 먼저 배포 → 주소 복사
 *  2) 이 컨트랙트 배포 시 _token 파라미터에 MURANGCoin 주소 입력
 *  3) listSkin("gold", 50e18) 등으로 스킨 등록
 *  4) index.html의 CONFIG.shopAddress에 이 주소 입력
 */
contract SkinShop {
    IERC20 public immutable token;
    address public owner;
    address public treasury;

    struct Skin {
        bool listed;
        uint256 price;       // wei 단위 (decimals 고려)
        uint256 totalSold;
    }

    mapping(bytes32 => Skin) public skins;                       // skinId => Skin
    mapping(address => mapping(bytes32 => bool)) public owned;   // user => skinId => owned

    event SkinListed(bytes32 indexed skinId, uint256 price);
    event SkinPurchased(address indexed buyer, bytes32 indexed skinId, uint256 price);
    event TreasuryUpdated(address indexed newTreasury);

    modifier onlyOwner() {
        require(msg.sender == owner, "SHOP: not owner");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
        treasury = msg.sender;
    }

    function setTreasury(address t) external onlyOwner {
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function listSkin(string calldata skinId, uint256 price) external onlyOwner {
        bytes32 id = keccak256(bytes(skinId));
        skins[id] = Skin({ listed: true, price: price, totalSold: skins[id].totalSold });
        emit SkinListed(id, price);
    }

    function purchase(string calldata skinId) external {
        bytes32 id = keccak256(bytes(skinId));
        Skin storage s = skins[id];
        require(s.listed, "SHOP: not listed");
        require(!owned[msg.sender][id], "SHOP: already owned");

        require(token.transferFrom(msg.sender, treasury, s.price), "SHOP: payment failed");

        owned[msg.sender][id] = true;
        s.totalSold += 1;
        emit SkinPurchased(msg.sender, id, s.price);
    }

    function isOwner(address user, string calldata skinId) external view returns (bool) {
        return owned[user][keccak256(bytes(skinId))];
    }
}
