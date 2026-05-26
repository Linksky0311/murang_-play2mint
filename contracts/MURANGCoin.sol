// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * MURANG Coin — VR 리듬게임 보상 토큰 (ERC-20)
 * Sepolia 테스트넷 배포용. MCP 서버(rewarder)만 mint 가능.
 *
 * Remix 배포 순서:
 *  1) Remix IDE 열기 → 이 파일 붙여넣기
 *  2) Compile (0.8.20+)
 *  3) Deploy & Run → Environment: Injected Provider - MetaMask (Sepolia)
 *  4) Deploy 클릭 → 배포된 주소를 index.html의 CONFIG.contractAddress에 입력
 *  5) setRewarder(<MCP 서버 지갑 주소>) 호출
 */
contract MURANGCoin {
    string public name = "MURANG Coin";
    string public symbol = "MURANG";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    address public rewarder;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event RewarderUpdated(address indexed newRewarder);

    modifier onlyOwner() {
        require(msg.sender == owner, "MURANG: not owner");
        _;
    }

    modifier onlyRewarder() {
        require(msg.sender == rewarder || msg.sender == owner, "MURANG: not rewarder");
        _;
    }

    constructor() {
        owner = msg.sender;
        rewarder = msg.sender; // 배포자가 일단 rewarder도 됨
    }

    function setRewarder(address newRewarder) external onlyOwner {
        rewarder = newRewarder;
        emit RewarderUpdated(newRewarder);
    }

    /// MCP 서버가 점수에 비례하여 호출하는 함수
    function mint(address to, uint256 amount) external onlyRewarder returns (bool) {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "MURANG: allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "MURANG: balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
