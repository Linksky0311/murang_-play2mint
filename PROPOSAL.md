# 가상 가치 순환을 위한 Web3 기반 VR 리듬게임 보상 시스템

> **MURANG Studio** · 텀 프로젝트 제안서
> 작성일: 2026-05-26

---

## 1. 한 줄 요약

> **"VR 가상 스튜디오에서 원곡 악보(MIDI)대로 정확히 연주하면 토큰을 보상받고, 이 토큰으로 나만의 가상 악기 스킨을 구매하는 체감형 Web3 에코시스템"**

플레이어는 가상 스튜디오에서 곡을 연주하고, 정확도에 비례한 ERC-20 토큰을 자동으로 지급받는다. 모인 토큰은 그 자리에서 가상 악기 스킨 구매에 사용되며, 모든 보상·소비 흐름이 온체인에 기록된다.

---

## 2. 문제 정의 — 왜 이 서비스인가

| 기존 리듬게임의 한계 | MURANG이 제안하는 해결 |
|---|---|
| 게임 내 재화는 회사 DB에 종속, 외부 가치와 단절 | **온체인 ERC-20 토큰**으로 발급 — 지갑에 영구 귀속, 검증 가능 |
| 스킨/아이템 소유권이 회사에 있음 | **스마트 컨트랙트가 소유권 보장** — 서비스 종료 후에도 잔존 |
| Web3 게임은 UX가 어렵고 진입장벽이 높음 | **"연주 잘하면 보상받고 아이템 산다"는 게이머 기본 문법** 그대로 |
| 토큰 이코노미가 투기 위주, 게임성과 분리됨 | **점수 → 보상 → 소비**가 한 화면에서 닫힌 루프로 작동 |

---

## 3. 서비스 핵심 흐름 (3단계 순환 구조)

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  1. 연주 및 채점     │    │  2. 온체인 보상      │    │  3. 인앱 소비        │
│                     │    │                     │    │                     │
│  원곡 MIDI vs 유저   │───▶│  정확도 점수에       │───▶│  토큰으로 가상       │
│  입력 비교           │    │  비례한 ERC-20      │    │  악기 스킨 구매       │
│  (정확도/레이턴시)    │    │  자동 지급           │    │  (소유권 온체인 기록)  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
         ▲                                                       │
         │                                                       │
         └─────────── 더 좋은 스킨 → 더 즐기고 싶음 ◀───────────┘
```

| 단계 | 내부 동작 |
|---|---|
| **① Play & Score** | 유저의 연주 입력(타임스탬프 + lane)을 곡 가이드 MIDI와 비교하여 Perfect/Good/Miss 판정 → 100점 만점 정확도 점수 산출 |
| **② Token Reward** | MCP 서버가 점수를 Tool Call로 받아, `MURANGCoin.mint(user, score)` 트랜잭션을 Sepolia에 발행 |
| **③ In-App Purchase** | 유저가 상점에서 스킨 선택 → `approve` + `SkinShop.purchase(skinId)` 2-step → 토큰 차감 + 소유권 매핑 업데이트 |

---

## 4. 시스템 아키텍처

```
┌────────────────────────────────────────────────────────────────────┐
│                          Frontend (Browser)                        │
│                                                                    │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌──────────┐  │
│  │ MIDI Player│   │ Score Calc │   │ AI Feedback│   │ Skin Shop │  │
│  │ (4-lane)   │   │ (Perfect/  │   │ UI         │   │ UI        │  │
│  │            │   │  Good/Miss)│   │            │   │           │  │
│  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └─────┬─────┘  │
│        │                │                │                │        │
│        └────────────────┴───┬────────────┴────────────────┘        │
│                             ▼                                      │
│                  ┌──────────────────┐                              │
│                  │  ethers.js v5    │                              │
│                  │  (Web3 Provider) │                              │
│                  └──────┬───────────┘                              │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
       ┌──────────────────────────────────────┐
       │      MetaMask (사용자 서명)            │
       └──────────────────┬───────────────────┘
                          │ signed tx
                          ▼
       ┌──────────────────────────────────────┐         ┌───────────────┐
       │      MCP Server (Tool Bridge)        │◀───────▶│  LLM (피드백)  │
       │  - reward_token(score, addr, amount) │         │  생성          │
       │  - buy_skin(skinId, user)            │         └───────────────┘
       └──────────────────┬───────────────────┘
                          │ RPC
                          ▼
       ┌──────────────────────────────────────┐
       │     Ethereum Sepolia Testnet         │
       │                                      │
       │  ┌──────────────┐  ┌──────────────┐  │
       │  │ MURANGCoin   │  │ SkinShop     │  │
       │  │ (ERC-20)     │  │ (소유권 관리)  │  │
       │  └──────────────┘  └──────────────┘  │
       └──────────────────────────────────────┘
```

---

## 5. 구현 기술 스택

### 5.1 Blockchain Layer

| 항목 | 내용 |
|---|---|
| **네트워크** | Ethereum Sepolia Testnet (chainId 11155111) |
| **토큰 표준** | ERC-20 (자체 구현, decimals 18) |
| **Solidity** | 0.8.20 (optimizer 200 runs) |
| **개발 환경** | Hardhat 2.22 + ethers.js v6 (배포), ethers.js v5 (브라우저) |
| **RPC** | Public node (`https://ethereum-sepolia-rpc.publicnode.com`) |

#### 핵심 컨트랙트

| 컨트랙트 | 주요 함수 | 책임 |
|---|---|---|
| `MURANGCoin.sol` | `mint(to, amount)` (onlyRewarder), `transfer`, `approve` | 보상 토큰 발행/이전 |
| `SkinShop.sol` | `listSkin(id, price)` (onlyOwner), `purchase(skinId)`, `isOwner(user, skinId)` | 스킨 등록·구매·소유권 |

### 5.2 AI & MCP 연동 (과제 필수 조건)

- **LLM 역할**: 점수, 판정 분포(Perfect/Good/Miss), 곡 메타데이터를 컨텍스트로 받아 "밴드 마스터" 페르소나의 개인화된 피드백 생성
- **MCP Server 역할**: LLM이 출력한 액션 (`reward_token`, `buy_skin`)을 Tool Call 형태로 받아, Sepolia 트랜잭션으로 변환 후 RPC에 전송하는 다리
- **데모 구현**: 본 프로토타입은 MCP 서버를 프론트엔드 내 시뮬레이션으로 표현하고 실제 트랜잭션은 사용자 지갑에서 직접 서명 (full-stack MCP 통합은 차후 단계)

### 5.3 Data Flow

| 입력 데이터 | 출처 | 처리 |
|---|---|---|
| 가이드 MIDI | 곡별 표준 악보 (BPM, note timing, lane) | 클라이언트 사전 로드 |
| 유저 플레이 로그 | VR 컨트롤러 입력 타임스탬프 | 실시간 lane별 hit 판정 |
| 정확도 점수 | `(Perfect × 100 + Good × 60) / total` | 0-100 정수로 정규화 |
| AI 컨텍스트 | `{ score, judges, song.title, song.difficulty }` | LLM에 JSON으로 전달 |

---

## 6. 5/26 시연 시나리오 — 실제 구현 결과

### 6.1 배포된 컨트랙트 (Sepolia)

| | 주소 | Etherscan |
|---|---|---|
| **MURANGCoin** | `0x55E8f2964a5c721f6004ccF4c00dCA806dCFfDA2` | [↗](https://sepolia.etherscan.io/address/0x55E8f2964a5c721f6004ccF4c00dCA806dCFfDA2) |
| **SkinShop** | `0xc9E719725eCb237e20AD27A77F15faa883ba243D` | [↗](https://sepolia.etherscan.io/address/0xc9E719725eCb237e20AD27A77F15faa883ba243D) |
| **Deployer** | `0xEb896526c326bB06b6d224a364eD9072153d9C4F` | [↗](https://sepolia.etherscan.io/address/0xEb896526c326bB06b6d224a364eD9072153d9C4F) |

### 6.2 등록된 스킨

| Skin ID | 가격 (MURANG) | 컨셉 |
|---|---|---|
| `gold` | 50 | 골드 기타 |
| `neon` | 80 | 네온 베이스 |
| `crystal` | 120 | 크리스탈 드럼 |
| `shadow` | 200 | 섀도우 키보드 |

### 6.3 시연 흐름 (LIVE 모드)

| Step | 화면 | 온체인 |
|---|---|---|
| 1. 곡 선택 → ▶ 연주 | 4-lane 노트 하강 + 자동 판정 | — |
| 2. 점수 산출 | `83점` (Perfect 41 / Good 15 / Miss 4) | — |
| 3. AI 피드백 | "안정적인 흐름이었어요. Good 판정이 15회…" | — |
| 4. 💎 보상 받기 | MCP 로그: `Tool call: reward_token(...)` | **`MURANGCoin.mint(user, 83e18)` 트랜잭션** |
| 5. 잔고 갱신 | `0 → 83 MURANG` | — |
| 6. 골드 기타 구매 | MetaMask 팝업 2회 | **`approve` + `SkinShop.purchase("gold")`** |
| 7. 결과 확인 | OWNED 배지, 잔고 `83 → 33` | Etherscan에서 두 트랜잭션 확인 |

### 6.4 폴백 — DEMO 모드

네트워크 장애나 가스 부족 등 발표 중 변수가 발생할 경우, 우측 상단 토글로 **DEMO 모드** 전환 시 전체 흐름이 시뮬레이션된 트랜잭션으로 작동. 시연 안정성을 위해 의도된 이중 트랙.

---

## 7. 파일 구조

```
과제/
├── PROPOSAL.md              ← 본 문서
├── index.html               ← 단일 페이지 프론트엔드 (DEMO/LIVE 둘 다 지원)
├── package.json
├── hardhat.config.js
├── .env.example             ← 키 템플릿 (.env는 gitignore)
├── .gitignore
├── deployment.json          ← 배포 결과 자동 기록
│
├── contracts/
│   ├── MURANGCoin.sol       ← ERC-20 보상 토큰
│   └── SkinShop.sol         ← 스킨 구매·소유권 컨트랙트
│
└── scripts/
    ├── deploy.js            ← 원샷 배포 + index.html 자동 패치
    ├── balance.js           ← 배포자 잔고 확인
    ├── authorize.js         ← 다른 지갑에 mint 권한 부여
    └── topup.js             ← 시연용 지갑 가스 충전
```

---

## 8. 실행 방법

### 8.1 사전 준비
- Node.js 18+ (테스트: v25 동작 확인)
- MetaMask 브라우저 확장
- Sepolia ETH (faucet에서 발급)

### 8.2 설치 & 배포

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 PRIVATE_KEY 입력 (테스트 전용 지갑만!)

# 3. Sepolia 배포 — index.html에 주소 자동 주입
npm run deploy

# 4. 로컬 서버 실행 (MetaMask는 file://에서 불안정)
python3 -m http.server 8080
# → http://localhost:8080 접속
```

### 8.3 시연

1. 우측 상단 토글 → **LIVE (Sepolia)**
2. **지갑 연결** → MetaMask에서 배포자 계정 선택
3. 곡 선택 → ▶ 연주 → 보상 → 구매 순으로 진행

### 8.4 부가 스크립트

```bash
# 다른 MetaMask 지갑에 mint 권한 부여 (시연 지갑이 배포자와 다를 때)
NEW_REWARDER=0x... npx hardhat run scripts/authorize.js --network sepolia

# 시연용 지갑에 Sepolia ETH 충전
RECIPIENT=0x... AMOUNT_ETH=0.05 npx hardhat run scripts/topup.js --network sepolia
```

---

## 9. 기대 효과 — TPM 관점

### 9.1 직관적인 유저 시나리오
복잡한 블록체인 개념(가스, 지갑, 사이닝)을 몰라도 **"게임 → 보상 → 아이템 구매"** 라는 게이머 기본 문법을 그대로 Web3 토큰 이코노미로 치환. 첫 진입 장벽 최소화.

### 9.2 강력한 락인(Lock-in) 효과
- 연주 시간 = 보상 누적 → 시간 투자가 그대로 자산화
- 스킨은 컨트랙트에 소유권이 기록되므로, 서비스 종료 후에도 잔존 → **서비스 신뢰도 자체가 락인 요소**
- 향후 NFT 마켓플레이스 연동 시 스킨 거래·교환 가능 → 2차 시장 형성

### 9.3 콘텐츠 확장성
- 신규 곡 추가 = 즉시 새 보상 채널
- 신규 스킨 = 컨트랙트 owner의 `listSkin()` 한 번으로 등록
- 시즌제 / 한정판 / 협업 악기 등 운영 자유도 ↑

### 9.4 데이터 자산화
유저 플레이 로그(연주 정확도, 판정 패턴)는 자체로 가치 있는 행동 데이터. 향후 AI 코칭 / 매칭 / 협주 시스템의 원천 데이터로 활용 가능.

---

## 10. 향후 확장 로드맵

| Phase | 추가 사항 |
|---|---|
| **Phase 1 (MVP, 본 프로젝트)** | 단일 페이지 데모, Sepolia 배포, MCP 시뮬레이션 |
| **Phase 2** | 실제 MCP 서버 + LLM API 연동, 가이드 MIDI 파일 업로드 시스템 |
| **Phase 3** | Unity/Unreal 기반 실제 VR 클라이언트 통합, OpenXR 컨트롤러 입력 |
| **Phase 4** | ERC-721 NFT 스킨 (희귀도/한정판), 2차 마켓 |
| **Phase 5** | 메인넷 이전(L2 권장: Base/Optimism), 거버넌스 토큰화 |

---

## 11. 보안 고려사항

| 위협 | 완화 방안 |
|---|---|
| `mint` 무단 호출 | `onlyRewarder` modifier로 권한 제한, owner는 setRewarder로 위임 가능 |
| Reentrancy (구매 흐름) | OpenZeppelin `ReentrancyGuard` 도입 (현재 미적용, Phase 2 작업) |
| 점수 위변조 | 현재는 클라이언트 신뢰 가정 — 향후 LLM 서명 또는 ZK 증명 기반 검증 필요 |
| 키 노출 | `.env`는 gitignore, 배포자 키는 시연 후 폐기 권장 |

---

## 12. 결론

본 프로젝트는 **"Web3가 어떻게 게임 UX를 강화할 수 있는가"** 라는 질문에 대한 작동하는 답안이다. ERC-20 토큰 발행과 스마트 컨트랙트 기반 소유권 이전이라는 기본 블록을 활용하여, 게이머가 인지하지 못한 채로 자연스럽게 온체인 자산을 축적·소비하는 경험을 설계했다.

실제 Sepolia 테스트넷에 컨트랙트를 배포하고 트랜잭션을 발생시킴으로써, **제안이 아닌 동작하는 시스템**으로 증명한다는 점이 본 프로젝트의 가장 큰 차별점이다.
