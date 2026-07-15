# 마실 · 통합 (3_통합)

`1_파랑` · `2_보라` 두 팀 결과물을 하나의 사이트로 합친 통합 버전입니다. (Vue 3 + Vite)

## 어디서 가져왔나

| 화면 | 출처 |
|------|------|
| **메인(홈) 레이아웃** — 통계·매니페스토·카테고리 랭킹·권역 카드·기능 소개 | `2_보라` |
| **움직이는 히어로 캐러셀 배너** (홈 상단) | `1_파랑` |
| **지도** — Leaflet, 서울 6,505곳, 카테고리/권역 필터, 상세·미니지도 | `1_파랑` |
| **캘린더** — 축제·행사 달력, 권역 색상, 상세 모달 | `2_보라` |
| **커뮤니티** — 로그인 없는 익명 게시판(비밀번호 수정/삭제) | `1_파랑` |
| **챗봇 도우미** | `1_파랑` |

## 디자인
- `2_보라`의 보라색 디자인 시스템(`--accent` 계열)을 사이트 공통 테마로 채택.
- `1_파랑`에서 가져온 컴포넌트는 각자 `<style scoped>` 로 격리했고,
  파랑팀 토큰(`--brand`, `--paper`, `--shadow` 등)은 `src/style.css` 의 `:root` 에서
  보라 테마 값으로 **별칭 매핑**해 하나의 색감으로 통일했습니다.

## 구조
```
src/
  App.vue                 # 셸: 네비 + 뷰 전환 + 보라팀 홈 레이아웃
  lib.js                  # 파랑팀 데이터·유틸(장소/통계/축제/아바타/히어로)
  data/
    masil-data.js         # 서울 장소 원본 데이터
    events.js             # data/**/*.json → 캘린더 이벤트 로더
  components/
    HeroCarousel.vue      # (파랑) 움직이는 배너
    MapView.vue           # (파랑) 지도
    Calendar.vue          # (보라) 캘린더
    Community.vue         # (파랑) 커뮤니티
    ChatWidget.vue        # (파랑) 챗봇
data/                     # (보라) 지역별 관광 JSON — 캘린더 소스
```

## 실행
```bash
npm install
npm run dev      # 개발 서버 (챗봇 제외 UI 확인용)
npm run build    # 프로덕션 빌드 → dist/
```

## 챗봇 (GPT-5 mini)
OpenAI 키는 **서버(Netlify Function)에만** 두고 클라이언트에는 노출하지 않습니다.
사용자는 키 입력 없이 바로 챗봇을 사용합니다.

- 함수: `netlify/functions/chat.js` (엔드포인트 `/.netlify/functions/chat`)
- 키 환경변수: `OPENAI_API_KEY` (`VITE_` 접두사 없음 → 번들에 포함 안 됨)

### 로컬에서 챗봇까지 테스트
`npm run dev`(순수 Vite)는 함수를 실행하지 않으므로 챗봇은 Netlify CLI 로 테스트합니다.
```bash
npm i -g netlify-cli
# 3_통합/.env 에 OPENAI_API_KEY=sk-... 입력 후
netlify dev
```

## Netlify 배포
1. 이 폴더(`3_통합`)를 저장소로 연결 (Base directory 를 `3_통합` 으로 지정).
2. 빌드 설정은 `netlify.toml` 이 자동 적용 (build=`npm run build`, publish=`dist`, functions=`netlify/functions`).
3. **Site settings → Environment variables** 에 `OPENAI_API_KEY` 등록.
4. 배포. 챗봇이 서버 함수를 통해 동작합니다.

> `.env` 는 `.gitignore` 되어 커밋되지 않습니다. 실제 키는 로컬 `.env` 와 Netlify 환경변수에만 두세요.
