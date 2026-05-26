require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();

const PRIVATE_KEY = (process.env.PRIVATE_KEY || '').replace(/^0x/, '');
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC,
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : []
    }
  }
};
