// scripts/authorize.js
// 사용법: node scripts/authorize.js 0x<연결할_지갑_주소>
// 또는:   npx hardhat run scripts/authorize.js --network sepolia
//
// 배포자(owner) 키로 setRewarder를 호출하여, 지정한 주소가 mint를 호출할 수 있게 합니다.
// 컨트랙트의 owner는 setRewarder와 무관하게 항상 mint 가능합니다.

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

// 권한을 부여할 주소를 argv로 받거나, 아래 기본값 사용
const NEW_REWARDER = process.env.NEW_REWARDER || '0xba257CDB7a09b08bC51FfCa38a956687c8116b75';

async function main() {
  const deployment = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'deployment.json'), 'utf8')
  );
  const tokenAddr = deployment.contracts.MURANGCoin;

  const [deployer] = await hre.ethers.getSigners();
  console.log('Owner      :', deployer.address);
  console.log('Token      :', tokenAddr);
  console.log('New rewarder:', NEW_REWARDER, '\n');

  const token = await hre.ethers.getContractAt('MURANGCoin', tokenAddr);

  const currentRewarder = await token.rewarder();
  console.log('Current rewarder:', currentRewarder);

  if (currentRewarder.toLowerCase() === NEW_REWARDER.toLowerCase()) {
    console.log('✓ 이미 동일한 rewarder입니다. 스킵.');
    return;
  }

  console.log('\n→ setRewarder 호출 중...');
  const tx = await token.setRewarder(NEW_REWARDER);
  console.log('  tx:', tx.hash);
  const receipt = await tx.wait();
  console.log('✓ 확정 (block #' + receipt.blockNumber + ')');
  console.log('  https://sepolia.etherscan.io/tx/' + tx.hash);
  console.log('\n이제 ' + NEW_REWARDER + ' 가 mint() 호출 가능합니다.');
}

main().catch((e) => { console.error('✗', e.message || e); process.exit(1); });
