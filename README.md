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
- Google AI Studio에서 발급한 키를 설정에 넣으면, 리포트에서 **앱 안에서 바로**
  "잘한 점 / 아쉬운 점 / 내일 한 가지" 코칭을 받습니다(딥링크 새 탭 아님).
- 모델: `gemini-2.0-flash`, 응답은 사용자가 고른 언어로 JSON 포맷 강제.
- 키는 이 기기(localStorage)에만 저장됩니다.

> ⚠️ **키 노출 주의**: 정적 PWA에서 키를 브라우저에 두면 노출 위험이 있습니다.
> 여러 사람에게 배포하려면 Cloudflare Workers / Vercel Function 같은 프록시에
> 키를 숨기고, `callGemini()`의 `url`만 그 엔드포인트로 바꾸세요(개인용이면 현재 방식으로 충분).

## 데이터 구조 (v3)
```
settings: { ..., lang, theme, dietMissions[], geminiKey }
days[YYYY-MM-DD]: { parts[], slots[], diet:{done:{}, condition}, aiEval:{good,improve,tomorrow,at} }
```
v2 백업을 불러오면 자동으로 lang/theme/dietMissions/geminiKey가 채워집니다.

## 폴더 구조
```
deskfit/
├── index.html      화면 구조 (+ 식단 블록, 저녁 시트, 언어·테마·미션·키 설정)
├── styles.css      6테마 시스템 + 다크 에디토리얼 + 식단/AI 카드 스타일
├── app.js          i18n(4언어) + 운동 30종 번역 + 스케줄 + 식단 + Gemini 연동
├── sw.js           오프라인 캐시(v7) + 알림 라우팅
├── manifest.json   PWA 설치 메타
├── icon-192.png / icon-512.png
```
