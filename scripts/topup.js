// scripts/topup.js
// 배포자 지갑에서 시연용 지갑으로 Sepolia ETH 송금
const hre = require('hardhat');

const RECIPIENT = process.env.RECIPIENT || '0xba257CDB7a09b08bC51FfCa38a956687c8116b75';
const AMOUNT_ETH = process.env.AMOUNT_ETH || '0.03';

async function main() {
  const [sender] = await hre.ethers.getSigners();
  console.log('From   :', sender.address);
  console.log('To     :', RECIPIENT);
  console.log('Amount :', AMOUNT_ETH, 'ETH\n');

  const tx = await sender.sendTransaction({
    to: RECIPIENT,
    value: hre.ethers.parseEther(AMOUNT_ETH)
  });
  console.log('tx :', tx.hash);
  const receipt = await tx.wait();
  console.log('✓ 확정 (block #' + receipt.blockNumber + ')');
  console.log('  https://sepolia.etherscan.io/tx/' + tx.hash);

  const bal = await hre.ethers.provider.getBalance(RECIPIENT);
  console.log('\nRecipient new balance:', hre.ethers.formatEther(bal), 'ETH');
}

main().catch((e) => { console.error('✗', e.message || e); process.exit(1); });
