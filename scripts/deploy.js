const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MURANG · Sepolia 배포');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Deployer :', deployer.address);
  console.log('  Balance  :', hre.ethers.formatEther(bal), 'ETH');
  console.log('  Network  : Sepolia (chainId 11155111)\n');

  if (bal === 0n) {
    console.error('✗ 잔고 0 ETH. Sepolia faucet에서 가스를 먼저 받아주세요.');
    process.exit(1);
  }

  // ─── 1. MURANGCoin ────────────────────────────────────────────
  console.log('[1/3] MURANGCoin 배포 중...');
  const Token = await hre.ethers.getContractFactory('MURANGCoin');
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log('      ✓ MURANGCoin =', tokenAddr);
  console.log('        https://sepolia.etherscan.io/address/' + tokenAddr + '\n');

  // ─── 2. SkinShop ──────────────────────────────────────────────
  console.log('[2/3] SkinShop 배포 중...');
  const Shop = await hre.ethers.getContractFactory('SkinShop');
  const shop = await Shop.deploy(tokenAddr);
  await shop.waitForDeployment();
  const shopAddr = await shop.getAddress();
  console.log('      ✓ SkinShop   =', shopAddr);
  console.log('        https://sepolia.etherscan.io/address/' + shopAddr + '\n');

  // ─── 3. 스킨 등록 ──────────────────────────────────────────────
  console.log('[3/3] 스킨 4종 등록 중...');
  const SKINS = [
    { id: 'gold',    price: 50  },
    { id: 'neon',    price: 80  },
    { id: 'crystal', price: 120 },
    { id: 'shadow',  price: 200 },
  ];
  for (const s of SKINS) {
    const tx = await shop.listSkin(s.id, hre.ethers.parseUnits(s.price.toString(), 18));
    await tx.wait();
    console.log(`      ✓ ${s.id.padEnd(8)} @ ${String(s.price).padStart(3)} MURANG   tx ${tx.hash}`);
  }

  // ─── 4. index.html 자동 주입 ───────────────────────────────────
  console.log('\n[+] index.html에 컨트랙트 주소 주입 중...');
  const htmlPath = path.join(__dirname, '..', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const before = html;
  html = html.replace(/contractAddress:\s*'[^']*'/, `contractAddress: '${tokenAddr}'`);
  html = html.replace(/shopAddress:\s*'[^']*'/, `shopAddress: '${shopAddr}'`);
  if (html === before) {
    console.warn('      ⚠ 주입할 자리를 못 찾았습니다. index.html의 CONFIG를 직접 수정하세요.');
  } else {
    fs.writeFileSync(htmlPath, html);
    console.log('      ✓ index.html 업데이트 완료');
  }

  // ─── 5. 배포 결과 저장 ─────────────────────────────────────────
  const out = {
    network: 'sepolia',
    chainId: 11155111,
    deployer: deployer.address,
    contracts: { MURANGCoin: tokenAddr, SkinShop: shopAddr },
    skins: SKINS,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(__dirname, '..', 'deployment.json'), JSON.stringify(out, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✓ 배포 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  다음 단계:');
  console.log('   1) index.html을 새로고침');
  console.log('   2) 우측 상단 토글 → LIVE (Sepolia)');
  console.log('   3) MetaMask 연결 (반드시 deployer와 같은 지갑!)');
  console.log('   4) 연주 → 토큰 보상 → 스킨 구매 시연');
  console.log('');
}

main().catch((e) => {
  console.error('\n✗ 배포 실패:', e.message || e);
  process.exit(1);
});
