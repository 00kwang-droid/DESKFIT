# DeskFit · 자리운동일지 + 식단 미션

자리에 앉은 채로, 티 안 나게 하는 직장인용 등척성 운동 + 식단 자기관리 PWA.
**4개 언어(한국어·English·日本語·中文)**, **6개 컬러 테마**, **Gemini AI 코칭**을 지원합니다.

## 실행 방법 (테스트)

```bash
cd deskfit
python3 -m http.server 8000   # http://localhost:8000
```

`file://`로 열면 Service Worker(알림·오프라인)가 안 됩니다. 반드시 http(s)로 여세요.

## 이번 버전에 추가된 것

### 1. 다국어 (설정 → 언어)
- 한국어 / English / 日本語 / 中文 — UI 전체 + 운동 30종의 이름·방법·효과까지 번역.
- 최초 실행 시 브라우저 언어를 감지해 자동 선택, 이후 설정에서 변경.

### 2. 컬러 테마 (설정 → 컬러 테마)
- `gold`(기본) · `sage` · `azure` · `clay` · `orchid` · `paper`(라이트).
- `<html data-theme="...">` + CSS 변수로 전환. 즉시 반영, 재시작 불필요.

### 3. 다이어트 미션 (오늘 화면)
- "참았어요"(야식·술·과자 참기 등) + "실천했어요"(물·채소·계단·별도운동 등) 두 갈래.
- 물은 −/+ 카운터(기본 목표 8잔), 나머지는 체크. 설정에서 3~5개 골라 쓰세요.
- **저녁 마감 시트**: 낮에 못 챙긴 미션을 저녁에 칩으로 몰아서 체크 + 컨디션 기록.

### 4. Gemini AI 코칭 (설정 → AI 코칭)
- 설정에 키를 넣고 **[연결 테스트]** 를 누르면 사용 가능한 모델을 자동으로 찾아 저장합니다.
- 리포트에서 **앱 안에서 바로** "잘한 점 / 아쉬운 점 / 내일 한 가지" 코칭을 받습니다(딥링크 새 탭 아님).
- 응답은 사용자가 고른 언어로 JSON 포맷 강제. 키는 이 기기(localStorage)에만 저장됩니다.
- 키 발급: https://aistudio.google.com/app/apikey (무료, 카드 불필요). 키는 `AIza…` 로 시작합니다.

#### ⚠️ 모델을 하드코딩하지 않는 이유
구글은 Gemini 모델을 주기적으로 셧다운합니다. 실제로 `gemini-2.0-flash`는 **2026-06-01 종료**되어
호출 시 404가 납니다. `gemini-2.5-flash`도 2026-10-16 종료 예정입니다.
그래서 이 앱은 모델명을 고정하지 않고 다음처럼 동작합니다:

1. `GET /v1beta/models?key=` 로 **그 키가 실제로 쓸 수 있는 모델 목록**을 조회
2. 우선순위(`MODEL_CANDIDATES`: 3.1-flash-lite → 3.5-flash → 3-flash-preview → 2.5-flash-lite → 2.5-flash)로 선택
3. 후보가 전부 사라졌으면 이름으로 유추(flash 계열 우선, 이미지/음성/임베딩 제외)
4. 저장된 모델이 나중에 은퇴해 **404가 나면 자동으로 재감지 후 재시도**하고 설정을 갱신

→ 앞으로 구글이 모델을 또 내려도 코드 수정 없이 계속 동작합니다.

#### 에러 메시지
"키와 네트워크를 확인하세요" 같은 뭉뚱그린 문구 대신, 실제 원인을 4개 언어로 보여주고
구글이 보낸 원문 메시지도 함께 표시합니다.

| 상황 | 표시 |
|---|---|
| 400 API_KEY_INVALID | 키가 올바르지 않아요 (공백 확인) |
| 403 PERMISSION_DENIED | 키가 차단됐거나 권한 없음 → 새 키 발급 |
| 429 RESOURCE_EXHAUSTED | 무료 사용량 초과 |
| 400 FAILED_PRECONDITION | 지역 미지원 / 결제 필요 |
| 404 NOT_FOUND | 모델 없음 → 자동 재감지 |
| fetch 실패 | 네트워크 오류 |

> ⚠️ **키 노출 주의**: 정적 PWA에서 키를 브라우저에 두면 노출 위험이 있습니다.
> 여러 사람에게 배포하려면 Cloudflare Workers / Vercel Function 같은 프록시에
> 키를 숨기고, `GEMINI_API` 상수만 그 엔드포인트로 바꾸세요(개인용이면 현재 방식으로 충분).

> ⚠️ **예전 키가 막힐 수 있음**: 구글은 2026-05-07부터 오래 안 쓴 '제한 없음(Unrestricted)' 키를
> 차단하고, 2026-09부터 Standard 키 요청을 거부할 예정입니다. 차단되면 AI Studio에서 키를 새로 만드세요.

## 데이터 구조 (v3)
```
settings: { ..., lang, theme, dietMissions[], geminiKey, geminiModel }
days[YYYY-MM-DD]: { parts[], slots[], diet:{done:{}, condition}, aiEval:{good,improve,tomorrow,at} }
```
v2 백업을 불러오면 자동으로 lang/theme/dietMissions/geminiKey/geminiModel이 채워집니다.

## 폴더 구조
```
deskfit/
├── index.html      화면 구조 (+ 식단 블록, 저녁 시트, 언어·테마·미션·키 설정)
├── styles.css      6테마 시스템 + 다크 에디토리얼 + 식단/AI 카드 스타일
├── app.js          i18n(4언어) + 운동 30종 번역 + 스케줄 + 식단 + Gemini(모델 자동감지)
├── sw.js           오프라인 캐시(v9) + 알림 라우팅
├── manifest.json   PWA 설치 메타
├── icon-192.png / icon-512.png
```
