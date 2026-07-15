/* ============================================================
   데스크핏 · 자리운동일지 + 식단 미션
   - 4개 언어(ko/en/ja/zh) · 6개 컬러테마
   - 로컬 저장(localStorage) 기반 오프라인 PWA
   - Gemini API 인앱 코칭 평가
   ============================================================ */

const STORAGE_KEY = 'deskfit_v3';
const DIAL_R = 108;
const DIAL_CIRC = 2 * Math.PI * DIAL_R;
const LANGS = ['ko', 'en', 'ja', 'zh'];
const LANG_NAMES = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };
const THEMES = [
  { key: 'gold',   color: '#C89B3C', bg: '#0E0E10' },
  { key: 'sage',   color: '#8FBE6E', bg: '#0E0E10' },
  { key: 'azure',  color: '#6AA0D8', bg: '#0C0E12' },
  { key: 'clay',   color: '#CE7F5C', bg: '#100E0D' },
  { key: 'orchid', color: '#B18AD0', bg: '#0F0D12' },
  { key: 'paper',  color: '#A9772C', bg: '#F4F1EA' },
];

/* ============================================================
   UI 문자열 (4개 언어)
   {n} {done} {total} {parts} {kcal} {rate} {time} 등 치환자 사용
   ============================================================ */
const T = {
  ko: {
    tab_today: '오늘', tab_report: '리포트', tab_settings: '설정',
    today_title: '오늘의 자리운동', report_title: '운동 · 식단 리포트', settings_title: '설정',
    eyebrow_today: 'Desk Fit Edition', eyebrow_report: 'Daily Record', eyebrow_settings: 'Preferences',
    settings_sub: '언어 · 테마 · 근무시간을 조정하세요',
    done_suffix: '/{total} 완료', streak_label: '연속 실행', streak_unit: '{n}일째',
    empty_title: '오늘은 일정이 없어요', empty_body: '설정 → 오늘 일정 다시 만들기에서 부위를 골라보세요.',
    now: '지금', min_unit: '분', kcal_about: '약 {n}kcal',
    diet_title: '오늘의 다이어트 미션', diet_abstain: '참았어요', diet_do: '실천했어요',
    diet_empty: '아직 미션을 안 고르셨어요. <a id="diet-empty-link">설정에서 미션 고르기 →</a>',
    review_cta: '저녁 마감 · 하루 돌아보기',
    review_title: '오늘 하루 어떠셨어요?', review_sub: '지킨 것만 톡톡 눌러주세요. 못 지켜도 괜찮아요.',
    review_abstain: '참은 것', review_do: '실천한 것', review_cond: '오늘 컨디션',
    cond_bad: '별로', cond_ok: '보통', cond_good: '좋음', review_save: '오늘 기록 저장하기',
    timer_label: '진행 중인 운동', timer_howto: '운동 방법', timer_benefit: '이런 데 도움돼요',
    tap_start: 'TAP START', running: '진행 중', paused: '일시정지됨', done_excl: '완료!',
    btn_start: '시작', btn_pause: '일시정지', btn_resume: '계속하기', btn_donelabel: '완료됨', btn_skip: '건너뛰기',
    skip_title: '왜 못 하셨나요?',
    skip_meeting: '회의 중이었어요', skip_away: '외근/자리 비움', skip_forgot: '깜빡했어요',
    skip_cond: '컨디션이 안 좋았어요', skip_etc: '그냥 넘어갈게요',
    sec_today: '오늘 요약', sec_week: '이번 주 패턴', sec_weekday: '요일별 실행률',
    lbl_today_done: '운동 완료', lbl_today_mission: '다이어트 미션', lbl_today_kcal: '오늘 소모 칼로리',
    lbl_week_rate: '주간 운동 실행률', lbl_week_kcal: '주간 소모 칼로리',
    lbl_best_streak: '최고 연속 기록', lbl_best_time: '가장 잘 지킨 시간대',
    ai_title: '{model} 오늘의 코칭', ai_get: 'AI에게 오늘 하루 평가받기 →', ai_regen: '다시 평가받기',
    ai_loading: '평가를 받아오는 중…', ai_good: '잘한 점', ai_improve: '아쉬운 점', ai_tomorrow: '내일 한 가지',
    ai_nokey: '설정에서 Gemini API 키를 먼저 등록해주세요.', ai_foot: '{model} · 방금 생성됨',
    ai_err: '평가를 받지 못했어요. 키와 네트워크를 확인해주세요.',
    insight_none: '아직 기록이 없어요. 오늘 첫 운동부터 시작해볼까요?',
    grp_language: '언어 (Language)', grp_theme: '컬러 테마', grp_work: '근무 시간', grp_interval: '운동 간격',
    grp_weight: '몸무게 (칼로리 계산용)', grp_intensity: '운동 강도', grp_missions: '다이어트 미션 고르기',
    grp_notify: '알림', grp_ai: 'AI 코칭 (Gemini)', grp_backup: '데이터 백업', grp_regen: '일정 재생성',
    row_in: '출근', row_out: '퇴근', row_lunch: '점심시간 제외', row_weight: '몸무게',
    row_notify: '2분 전 준비 알림', row_apikey: 'Gemini API 키', apikey_ph: '키 붙여넣기',
    row_export: '백업 파일 내보내기', export_act: '↓ 저장', row_import: '백업 불러오기', import_act: '↑ 복원',
    regen_act: '부위 다시 골라 오늘 일정 만들기',
    missions_hint: '자기한테 맞는 미션만 3~5개 고르면 매일 오늘 화면에 떠요.',
    apikey_hint: '키는 이 기기에만 저장되고, 평가할 때만 Google 서버로 전송돼요.',
    apikey_get: 'Google AI Studio에서 키 발급받기 →',
    apikey_step1: '위 링크를 열고 Google 계정으로 로그인',
    apikey_step2: "'Create API key' 클릭 (무료 · 카드 불필요)",
    apikey_step3: 'AIza… 로 시작하는 키를 복사',
    apikey_step4: '위 칸에 붙여넣고 아래 [연결 테스트]를 누르기',
    apikey_note: '※ 예전에 만든 키가 제한 없음(Unrestricted) 상태면 차단될 수 있어요. 그럴 땐 AI Studio에서 키를 새로 만드세요.',
    row_test: '연결 테스트', test_act: '테스트', test_ing: '확인 중…',
    test_ok: '연결 성공 · {model}', test_fail: '연결 실패',
    row_model: '사용 모델', model_auto: '자동 선택',
    err_key_invalid: 'API 키가 올바르지 않아요. 공백 없이 다시 붙여넣어 주세요.',
    err_key_blocked: '키가 차단됐거나 권한이 없어요. AI Studio에서 새 키를 만들어 주세요.',
    err_quota: '무료 사용량을 초과했어요. 잠시 후 다시 시도해 주세요.',
    err_model: '이 키로 쓸 수 있는 모델을 찾지 못했어요.',
    err_region: '현재 지역에서는 무료 등급을 쓸 수 없어요. 결제 설정이 필요해요.',
    err_network: '네트워크에 연결하지 못했어요. 인터넷 상태를 확인해 주세요.',
    onboard_eyebrow: 'Welcome', onboard_h1: '자리에서, 티 안 나게.<br/>오늘부터 시작해요.',
    onboard_sub: '근무 시간과 운동 간격을 알려주시면<br/>회의·점심시간을 피해서 하루 스케줄을 짜드릴게요.',
    ob_work: '근무 시간', ob_lunch: '점심시간 (운동 제외)', ob_interval: '운동 간격',
    ob_weight: '몸무게 (칼로리 계산용)', ob_intensity: '운동 강도', ob_start: '시작하기',
    daily_eyebrow: "Today's Focus", daily_h1: '오늘 어디를<br/>운동할까요?',
    daily_sub: '고른 부위 위주로 오늘 하루 스케줄을 짜드려요.<br/>안 고르면 전신 밸런스로 짜드려요.',
    daily_all: '전체 선택', daily_make: '오늘 스케줄 만들기',
    t_made: '오늘 스케줄을 만들었어요', t_made_full: '전신 밸런스로 짰어요',
    t_done_count: '완료! 오늘 {done}/{total}', t_skip: '다음 운동에서 다시 만나요',
    t_need_schedule: '먼저 오늘 일정을 만들어주세요', t_need_key: '알림 권한이 필요해요',
    t_backup_ok: '백업 파일을 저장했어요', t_backup_fail: '백업에 실패했어요',
    t_restore_ok: '백업을 불러왔어요', t_restore_bad: '올바른 백업 파일이 아니에요', t_restore_fail: '파일을 읽지 못했어요',
    t_review_saved: '오늘 하루를 기록했어요', t_theme: '테마를 바꿨어요', t_lang: '언어를 바꿨어요', t_key_saved: 'API 키를 저장했어요',
    unit_cup: '잔', unit_glass_of: '{n}/{target}잔',
  },
  en: {
    tab_today: 'Today', tab_report: 'Report', tab_settings: 'Settings',
    today_title: "Today's desk workout", report_title: 'Workout · Diet report', settings_title: 'Settings',
    eyebrow_today: 'Desk Fit Edition', eyebrow_report: 'Daily Record', eyebrow_settings: 'Preferences',
    settings_sub: 'Language, theme, and work hours',
    done_suffix: '/{total} done', streak_label: 'Streak', streak_unit: 'Day {n}',
    empty_title: 'No schedule today', empty_body: 'Go to Settings → Rebuild today and pick body parts.',
    now: 'now', min_unit: 'min', kcal_about: '~{n} kcal',
    diet_title: "Today's diet missions", diet_abstain: 'Resisted', diet_do: 'Did it',
    diet_empty: "You haven't picked any missions yet. <a id=\"diet-empty-link\">Pick missions in Settings →</a>",
    review_cta: 'Evening check-in · Review your day',
    review_title: 'How was your day?', review_sub: 'Just tap what you kept up. Slips are okay.',
    review_abstain: 'Resisted', review_do: 'Did', review_cond: "Today's condition",
    cond_bad: 'Rough', cond_ok: 'Okay', cond_good: 'Good', review_save: 'Save today',
    timer_label: 'Exercise in progress', timer_howto: 'How to', timer_benefit: 'Helps with',
    tap_start: 'TAP START', running: 'Running', paused: 'Paused', done_excl: 'Done!',
    btn_start: 'Start', btn_pause: 'Pause', btn_resume: 'Resume', btn_donelabel: 'Done', btn_skip: 'Skip',
    skip_title: "What got in the way?",
    skip_meeting: 'In a meeting', skip_away: 'Away from desk', skip_forgot: 'Forgot',
    skip_cond: "Wasn't feeling it", skip_etc: "I'll pass this one",
    sec_today: 'Today', sec_week: 'This week', sec_weekday: 'By weekday',
    lbl_today_done: 'Workouts done', lbl_today_mission: 'Diet missions', lbl_today_kcal: 'Calories today',
    lbl_week_rate: 'Weekly workout rate', lbl_week_kcal: 'Calories this week',
    lbl_best_streak: 'Best streak', lbl_best_time: 'Best time slot',
    ai_title: "{model} coaching", ai_get: 'Get an AI review of today →', ai_regen: 'Review again',
    ai_loading: 'Getting your review…', ai_good: 'Well done', ai_improve: 'Room to grow', ai_tomorrow: 'One thing tomorrow',
    ai_nokey: 'Add your Gemini API key in Settings first.', ai_foot: '{model} · just now',
    ai_err: "Couldn't get a review. Check your key and network.",
    insight_none: 'No records yet. Shall we start with your first workout today?',
    grp_language: 'Language', grp_theme: 'Color theme', grp_work: 'Work hours', grp_interval: 'Interval',
    grp_weight: 'Weight (for calories)', grp_intensity: 'Intensity', grp_missions: 'Pick diet missions',
    grp_notify: 'Notifications', grp_ai: 'AI coaching (Gemini)', grp_backup: 'Data backup', grp_regen: 'Rebuild schedule',
    row_in: 'Start', row_out: 'End', row_lunch: 'Exclude lunch', row_weight: 'Weight',
    row_notify: 'Notify 2 min before', row_apikey: 'Gemini API key', apikey_ph: 'Paste key',
    row_export: 'Export backup file', export_act: '↓ Save', row_import: 'Import backup', import_act: '↑ Restore',
    regen_act: 'Pick parts and rebuild today',
    missions_hint: 'Pick 3–5 that fit you; they appear on Today every day.',
    apikey_hint: 'The key is stored only on this device, and is sent to Google only when you ask for a review.',
    apikey_get: 'Get a key at Google AI Studio →',
    apikey_step1: 'Open the link above and sign in with your Google account',
    apikey_step2: "Click 'Create API key' (free, no credit card)",
    apikey_step3: 'Copy the key starting with AIza…',
    apikey_step4: 'Paste it above, then tap [Test connection] below',
    apikey_note: '※ Older keys left Unrestricted may be blocked. If so, create a new key in AI Studio.',
    row_test: 'Test connection', test_act: 'Test', test_ing: 'Checking…',
    test_ok: 'Connected · {model}', test_fail: 'Connection failed',
    row_model: 'Model', model_auto: 'Auto',
    err_key_invalid: "That API key isn't valid. Paste it again with no extra spaces.",
    err_key_blocked: 'The key is blocked or lacks permission. Create a new key in AI Studio.',
    err_quota: "You've hit the free usage limit. Try again in a bit.",
    err_model: 'No usable model was found for this key.',
    err_region: "The free tier isn't available in your region. Billing needs to be enabled.",
    err_network: "Couldn't reach the network. Check your internet connection.",
    onboard_eyebrow: 'Welcome', onboard_h1: 'At your desk, unnoticed.<br/>Start today.',
    onboard_sub: 'Tell us your work hours and interval, and we\'ll plan a day<br/>that avoids meetings and lunch.',
    ob_work: 'Work hours', ob_lunch: 'Lunch (no workout)', ob_interval: 'Interval',
    ob_weight: 'Weight (for calories)', ob_intensity: 'Intensity', ob_start: 'Get started',
    daily_eyebrow: "Today's Focus", daily_h1: 'What shall we<br/>work on today?',
    daily_sub: "We'll build today's schedule around what you pick.<br/>Pick nothing for a full-body balance.",
    daily_all: 'Select all', daily_make: "Build today's schedule",
    t_made: "Today's schedule is ready", t_made_full: 'Planned a full-body balance',
    t_done_count: 'Done! Today {done}/{total}', t_skip: 'See you at the next one',
    t_need_schedule: 'Build today\'s schedule first', t_need_key: 'Notification permission needed',
    t_backup_ok: 'Backup file saved', t_backup_fail: 'Backup failed',
    t_restore_ok: 'Backup restored', t_restore_bad: 'Not a valid backup file', t_restore_fail: "Couldn't read the file",
    t_review_saved: 'Logged your day', t_theme: 'Theme changed', t_lang: 'Language changed', t_key_saved: 'API key saved',
    unit_cup: 'cups', unit_glass_of: '{n}/{target} cups',
  },
  ja: {
    tab_today: '今日', tab_report: 'レポート', tab_settings: '設定',
    today_title: '今日の座り運動', report_title: '運動・食事レポート', settings_title: '設定',
    eyebrow_today: 'Desk Fit Edition', eyebrow_report: 'Daily Record', eyebrow_settings: 'Preferences',
    settings_sub: '言語・テーマ・勤務時間を調整',
    done_suffix: '/{total} 完了', streak_label: '連続実行', streak_unit: '{n}日目',
    empty_title: '今日は予定がありません', empty_body: '設定→今日の予定を作り直すで部位を選んでください。',
    now: '今', min_unit: '分', kcal_about: '約{n}kcal',
    diet_title: '今日のダイエットミッション', diet_abstain: '我慢した', diet_do: '実行した',
    diet_empty: 'まだミッションが未選択です。<a id="diet-empty-link">設定でミッションを選ぶ →</a>',
    review_cta: '夜のまとめ・一日をふり返る',
    review_title: '今日はどうでしたか？', review_sub: '守れたものだけタップしてください。守れなくても大丈夫。',
    review_abstain: '我慢したもの', review_do: '実行したもの', review_cond: '今日の調子',
    cond_bad: 'いまいち', cond_ok: 'ふつう', cond_good: '良い', review_save: '今日の記録を保存',
    timer_label: '進行中の運動', timer_howto: 'やり方', timer_benefit: 'こんな効果',
    tap_start: 'TAP START', running: '進行中', paused: '一時停止中', done_excl: '完了！',
    btn_start: '開始', btn_pause: '一時停止', btn_resume: '再開', btn_donelabel: '完了', btn_skip: 'スキップ',
    skip_title: 'なぜできませんでしたか？',
    skip_meeting: '会議中でした', skip_away: '外出・離席', skip_forgot: '忘れていました',
    skip_cond: '体調がよくなかった', skip_etc: '今回は見送ります',
    sec_today: '今日のまとめ', sec_week: '今週のパターン', sec_weekday: '曜日別の実行率',
    lbl_today_done: '運動完了', lbl_today_mission: '食事ミッション', lbl_today_kcal: '今日の消費カロリー',
    lbl_week_rate: '週間実行率', lbl_week_kcal: '週間消費カロリー',
    lbl_best_streak: '最高連続記録', lbl_best_time: '最も守れた時間帯',
    ai_title: '{model} 今日のコーチング', ai_get: 'AIに今日を評価してもらう →', ai_regen: 'もう一度評価',
    ai_loading: '評価を取得中…', ai_good: '良かった点', ai_improve: '惜しかった点', ai_tomorrow: '明日ひとつだけ',
    ai_nokey: 'まず設定でGemini APIキーを登録してください。', ai_foot: '{model} · たった今',
    ai_err: '評価を取得できませんでした。キーとネットワークをご確認ください。',
    insight_none: 'まだ記録がありません。今日の最初の運動から始めましょう。',
    grp_language: '言語 (Language)', grp_theme: 'カラーテーマ', grp_work: '勤務時間', grp_interval: '運動間隔',
    grp_weight: '体重（カロリー計算用）', grp_intensity: '運動強度', grp_missions: 'ダイエットミッションを選ぶ',
    grp_notify: '通知', grp_ai: 'AIコーチング (Gemini)', grp_backup: 'データバックアップ', grp_regen: '予定の再作成',
    row_in: '出勤', row_out: '退勤', row_lunch: '昼休みを除外', row_weight: '体重',
    row_notify: '2分前に準備通知', row_apikey: 'Gemini APIキー', apikey_ph: 'キーを貼り付け',
    row_export: 'バックアップを書き出す', export_act: '↓ 保存', row_import: 'バックアップを読み込む', import_act: '↑ 復元',
    regen_act: '部位を選び直して今日の予定を作る',
    missions_hint: '自分に合うものを3〜5個選ぶと毎日「今日」に表示されます。',
    apikey_hint: 'キーはこの端末にのみ保存され、評価するときだけGoogleへ送信されます。',
    apikey_get: 'Google AI Studioでキーを取得 →',
    apikey_step1: '上のリンクを開き、Googleアカウントでログイン',
    apikey_step2: "「Create API key」をクリック（無料・カード不要）",
    apikey_step3: 'AIza… で始まるキーをコピー',
    apikey_step4: '上の欄に貼り付け、下の[接続テスト]を押す',
    apikey_note: '※ 以前作った「制限なし(Unrestricted)」のキーはブロックされることがあります。その場合はAI Studioで新しいキーを作成してください。',
    row_test: '接続テスト', test_act: 'テスト', test_ing: '確認中…',
    test_ok: '接続成功 · {model}', test_fail: '接続失敗',
    row_model: '使用モデル', model_auto: '自動選択',
    err_key_invalid: 'APIキーが正しくありません。空白なしで貼り直してください。',
    err_key_blocked: 'キーがブロックされているか権限がありません。AI Studioで新しいキーを作成してください。',
    err_quota: '無料枠の上限に達しました。しばらくしてからお試しください。',
    err_model: 'このキーで使えるモデルが見つかりませんでした。',
    err_region: 'この地域では無料枠を利用できません。お支払い設定が必要です。',
    err_network: 'ネットワークに接続できませんでした。通信状態をご確認ください。',
    onboard_eyebrow: 'Welcome', onboard_h1: '席で、こっそり。<br/>今日から始めましょう。',
    onboard_sub: '勤務時間と運動間隔を教えていただければ<br/>会議・昼休みを避けて一日の予定を作ります。',
    ob_work: '勤務時間', ob_lunch: '昼休み（運動を除外）', ob_interval: '運動間隔',
    ob_weight: '体重（カロリー計算用）', ob_intensity: '運動強度', ob_start: '始める',
    daily_eyebrow: "Today's Focus", daily_h1: '今日はどこを<br/>動かしますか？',
    daily_sub: '選んだ部位を中心に今日の予定を作ります。<br/>選ばなければ全身バランスで組みます。',
    daily_all: 'すべて選択', daily_make: '今日の予定を作る',
    t_made: '今日の予定を作りました', t_made_full: '全身バランスで組みました',
    t_done_count: '完了！今日 {done}/{total}', t_skip: '次の運動でまた会いましょう',
    t_need_schedule: 'まず今日の予定を作ってください', t_need_key: '通知の許可が必要です',
    t_backup_ok: 'バックアップを保存しました', t_backup_fail: 'バックアップに失敗しました',
    t_restore_ok: 'バックアップを読み込みました', t_restore_bad: '正しいバックアップではありません', t_restore_fail: 'ファイルを読み込めませんでした',
    t_review_saved: '今日を記録しました', t_theme: 'テーマを変更しました', t_lang: '言語を変更しました', t_key_saved: 'APIキーを保存しました',
    unit_cup: '杯', unit_glass_of: '{n}/{target}杯',
  },
  zh: {
    tab_today: '今天', tab_report: '报告', tab_settings: '设置',
    today_title: '今天的座位运动', report_title: '运动 · 饮食报告', settings_title: '设置',
    eyebrow_today: 'Desk Fit Edition', eyebrow_report: 'Daily Record', eyebrow_settings: 'Preferences',
    settings_sub: '调整语言、主题与工作时间',
    done_suffix: '/{total} 完成', streak_label: '连续执行', streak_unit: '第{n}天',
    empty_title: '今天还没有安排', empty_body: '到 设置 → 重新生成今日安排 里选择部位。',
    now: '现在', min_unit: '分钟', kcal_about: '约{n}千卡',
    diet_title: '今日饮食任务', diet_abstain: '忍住了', diet_do: '做到了',
    diet_empty: '你还没有选择任务。<a id="diet-empty-link">去设置里选任务 →</a>',
    review_cta: '晚间打卡 · 回顾今天',
    review_title: '今天过得怎么样？', review_sub: '把做到的轻点一下就好。没做到也没关系。',
    review_abstain: '忍住的', review_do: '做到的', review_cond: '今天状态',
    cond_bad: '一般', cond_ok: '还行', cond_good: '不错', review_save: '保存今天记录',
    timer_label: '进行中的运动', timer_howto: '做法', timer_benefit: '有助于',
    tap_start: 'TAP START', running: '进行中', paused: '已暂停', done_excl: '完成！',
    btn_start: '开始', btn_pause: '暂停', btn_resume: '继续', btn_donelabel: '已完成', btn_skip: '跳过',
    skip_title: '为什么没做成？',
    skip_meeting: '在开会', skip_away: '外出/离座', skip_forgot: '忘记了',
    skip_cond: '状态不太好', skip_etc: '这次先跳过',
    sec_today: '今日概览', sec_week: '本周规律', sec_weekday: '各星期执行率',
    lbl_today_done: '运动完成', lbl_today_mission: '饮食任务', lbl_today_kcal: '今日消耗',
    lbl_week_rate: '本周运动执行率', lbl_week_kcal: '本周消耗',
    lbl_best_streak: '最长连续', lbl_best_time: '最能坚持的时段',
    ai_title: '{model} 今日教练', ai_get: '让 AI 评价今天 →', ai_regen: '再评价一次',
    ai_loading: '正在获取评价…', ai_good: '做得好', ai_improve: '可以更好', ai_tomorrow: '明天做一件事',
    ai_nokey: '请先在设置里填入 Gemini API 密钥。', ai_foot: '{model} · 刚刚',
    ai_err: '无法获取评价，请检查密钥和网络。',
    insight_none: '还没有记录。今天先从第一个运动开始吧？',
    grp_language: '语言 (Language)', grp_theme: '配色主题', grp_work: '工作时间', grp_interval: '运动间隔',
    grp_weight: '体重（用于计算热量）', grp_intensity: '运动强度', grp_missions: '选择饮食任务',
    grp_notify: '通知', grp_ai: 'AI 教练 (Gemini)', grp_backup: '数据备份', grp_regen: '重新生成安排',
    row_in: '上班', row_out: '下班', row_lunch: '排除午休', row_weight: '体重',
    row_notify: '提前2分钟提醒', row_apikey: 'Gemini API 密钥', apikey_ph: '粘贴密钥',
    row_export: '导出备份文件', export_act: '↓ 保存', row_import: '导入备份', import_act: '↑ 恢复',
    regen_act: '重新选部位并生成今日安排',
    missions_hint: '选 3–5 个适合自己的，每天会出现在「今天」页。',
    apikey_hint: '密钥只保存在本机，仅在请求点评时发送给 Google。',
    apikey_get: '前往 Google AI Studio 获取密钥 →',
    apikey_step1: '打开上面的链接，用 Google 账号登录',
    apikey_step2: "点击「Create API key」（免费，无需信用卡）",
    apikey_step3: '复制以 AIza… 开头的密钥',
    apikey_step4: '粘贴到上面的输入框，再点下面的[连接测试]',
    apikey_note: '※ 以前创建的「未限制(Unrestricted)」密钥可能被封禁。若如此，请在 AI Studio 重新创建密钥。',
    row_test: '连接测试', test_act: '测试', test_ing: '检查中…',
    test_ok: '连接成功 · {model}', test_fail: '连接失败',
    row_model: '使用模型', model_auto: '自动选择',
    err_key_invalid: 'API 密钥无效，请重新粘贴且不要带空格。',
    err_key_blocked: '密钥被封禁或没有权限。请在 AI Studio 新建密钥。',
    err_quota: '已超出免费用量，请稍后再试。',
    err_model: '没有找到该密钥可用的模型。',
    err_region: '当前地区无法使用免费额度，需要开启结算。',
    err_network: '无法连接网络，请检查网络状态。',
    onboard_eyebrow: 'Welcome', onboard_h1: '在座位上，不动声色。<br/>从今天开始。',
    onboard_sub: '告诉我们工作时间和运动间隔，<br/>我们会避开会议和午休为你排好一天。',
    ob_work: '工作时间', ob_lunch: '午休（不排运动）', ob_interval: '运动间隔',
    ob_weight: '体重（用于计算热量）', ob_intensity: '运动强度', ob_start: '开始',
    daily_eyebrow: "Today's Focus", daily_h1: '今天想练<br/>哪里？',
    daily_sub: '会围绕你选的部位排今天的安排。<br/>不选则按全身平衡来排。',
    daily_all: '全选', daily_make: '生成今日安排',
    t_made: '已生成今日安排', t_made_full: '已按全身平衡排好',
    t_done_count: '完成！今天 {done}/{total}', t_skip: '下一个运动再见',
    t_need_schedule: '请先生成今日安排', t_need_key: '需要通知权限',
    t_backup_ok: '已保存备份文件', t_backup_fail: '备份失败',
    t_restore_ok: '已恢复备份', t_restore_bad: '不是有效的备份文件', t_restore_fail: '无法读取文件',
    t_review_saved: '已记录今天', t_theme: '已切换主题', t_lang: '已切换语言', t_key_saved: '已保存密钥',
    unit_cup: '杯', unit_glass_of: '{n}/{target}杯',
  },
};

function curLang() { return (state.settings && state.settings.lang) || 'ko'; }
function t(key, vars) {
  let s = (T[curLang()] && T[curLang()][key]) || (T.ko[key] || key);
  if (vars) Object.keys(vars).forEach(k => { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]); });
  return s;
}

/* ---------- 부위 분류 (i18n) ---------- */
const BODY_GROUPS = [
  { key: 'upper', label: { ko: '상체', en: 'Upper body', ja: '上半身', zh: '上半身' }, parts: [
    { key: 'shoulder', label: { ko: '어깨', en: 'Shoulders', ja: '肩', zh: '肩' } },
    { key: 'chest', label: { ko: '가슴', en: 'Chest', ja: '胸', zh: '胸' } },
    { key: 'back', label: { ko: '등', en: 'Back', ja: '背中', zh: '背' } },
    { key: 'arm', label: { ko: '팔', en: 'Arms', ja: '腕', zh: '手臂' } },
    { key: 'neck', label: { ko: '목', en: 'Neck', ja: '首', zh: '颈' } },
  ]},
  { key: 'core', label: { ko: '코어', en: 'Core', ja: 'コア', zh: '核心' }, parts: [
    { key: 'abs', label: { ko: '복부', en: 'Abs', ja: '腹', zh: '腹部' } },
    { key: 'oblique', label: { ko: '옆구리', en: 'Obliques', ja: '脇腹', zh: '侧腰' } },
    { key: 'lowerback', label: { ko: '허리', en: 'Lower back', ja: '腰', zh: '下背' } },
    { key: 'pelvic', label: { ko: '골반저', en: 'Pelvic floor', ja: '骨盤底', zh: '盆底' } },
  ]},
  { key: 'lower', label: { ko: '하체', en: 'Lower body', ja: '下半身', zh: '下半身' }, parts: [
    { key: 'thigh', label: { ko: '허벅지', en: 'Thighs', ja: '太もも', zh: '大腿' } },
    { key: 'glute', label: { ko: '엉덩이', en: 'Glutes', ja: 'お尻', zh: '臀' } },
    { key: 'calf', label: { ko: '종아리', en: 'Calves', ja: 'ふくらはぎ', zh: '小腿' } },
    { key: 'ankle', label: { ko: '발목', en: 'Ankles', ja: '足首', zh: '脚踝' } },
  ]},
];
const PART_LABEL = {}, PART_GROUP = {}, GROUP_LABEL = {};
BODY_GROUPS.forEach(g => {
  GROUP_LABEL[g.key] = g.label;
  g.parts.forEach(p => { PART_LABEL[p.key] = p.label; PART_GROUP[p.key] = g.key; });
});
const ALL_PART_KEYS = Object.keys(PART_LABEL);
function partLabel(k) { const l = PART_LABEL[k]; return l ? (l[curLang()] || l.ko) : k; }
function groupLabel(k) { const l = GROUP_LABEL[k]; return l ? (l[curLang()] || l.ko) : k; }

/* ============================================================
   운동 라이브러리 — 한국어(ko)는 인라인, 나머지 언어는 EX_TR
   visibility: 'invisible'(티 안 남) | 'slight'(약간 움직임)
   met: 대사당량 / duration: 초
   ============================================================ */
const EXERCISES = [
  { id: 'sh1', name: '어깨 으쓱 홀드', part: 'shoulder', visibility: 'invisible', duration: 90, met: 2.3,
    method: '양 어깨를 귀 쪽으로 최대한 끌어올린 뒤, 그 상태로 힘을 유지하며 천천히 호흡해요.', benefit: '오래 앉아 뭉친 승모근과 목 주변 긴장을 풀어줘요.' },
  { id: 'sh2', name: '어깨날개 모으기', part: 'shoulder', visibility: 'slight', duration: 90, met: 2.5,
    method: '양쪽 날개뼈를 등 뒤 가운데로 모으듯 조이고, 가슴을 살짝 펴서 버텨요.', benefit: '라운드 숄더와 굽은 등 자세를 바로잡는 데 도움돼요.' },
  { id: 'sh3', name: '손바닥 책상 누르기', part: 'shoulder', visibility: 'invisible', duration: 60, met: 2.4,
    method: '손바닥을 책상 위에 대고 아래로 지그시 밀며 어깨 안정근에 힘을 줘요.', benefit: '어깨 관절 안정성과 바른 상체 자세를 만들어줘요.' },
  { id: 'ch1', name: '합장 밀기', part: 'chest', visibility: 'invisible', duration: 60, met: 2.6,
    method: '가슴 앞에서 양손바닥을 마주 대고, 서로 힘껏 밀어내며 버텨요.', benefit: '큰가슴근(대흉근)을 자극해 상체 라인을 잡아줘요.' },
  { id: 'ch2', name: '책상 아래 밀어올리기', part: 'chest', visibility: 'slight', duration: 60, met: 2.8,
    method: '책상 아랫면에 손바닥을 대고 위로 밀어올리듯 힘을 유지해요.', benefit: '가슴과 팔 뒤쪽(삼두)을 동시에 자극해요.' },
  { id: 'bk1', name: '의자 밑 당기기', part: 'back', visibility: 'invisible', duration: 90, met: 2.6,
    method: '앉은 채 의자 좌판 양옆을 잡고, 몸을 위로 끌어올리듯 당기며 버텨요.', benefit: '넓은등근을 활성화해 등의 힘과 자세를 살려줘요.' },
  { id: 'bk2', name: '팔꿈치 뒤로 조이기', part: 'back', visibility: 'slight', duration: 75, met: 2.4,
    method: '팔꿈치를 몸통 뒤쪽으로 최대한 당겨 등 근육을 조인 채 유지해요.', benefit: '굽은 등을 펴고 등 상부 긴장을 풀어줘요.' },
  { id: 'bk3', name: '깍지 등 뒤로 펴기', part: 'back', visibility: 'slight', duration: 60, met: 2.2,
    method: '등 뒤로 손깍지를 끼고 팔을 아래로 펴 가슴을 여는 느낌으로 버텨요.', benefit: '흉추 가동성을 높이고 어깨·등을 시원하게 펴줘요.' },
  { id: 'ar1', name: '손목 셀프 저항', part: 'arm', visibility: 'invisible', duration: 60, met: 2.1,
    method: '한 손으로 반대쪽 손등을 눌러 저항을 주고, 손목은 그 힘에 버텨요. 좌우 번갈아 해요.', benefit: '전완근과 손목을 강화해 마우스·타이핑 피로를 덜어줘요.' },
  { id: 'ar2', name: '이두 셀프 컬', part: 'arm', visibility: 'invisible', duration: 60, met: 2.3,
    method: '한 손을 다른 손 위에 얹고, 아래 팔은 올리려 하고 위 손은 눌러 서로 버텨요.', benefit: '팔 앞뒤(이두·삼두)를 조용히 자극해요.' },
  { id: 'nk1', name: '목 앞 저항', part: 'neck', visibility: 'invisible', duration: 60, met: 2.0,
    method: '손바닥을 이마에 대고 앞으로 밀고, 목은 밀리지 않게 버텨요. 반동 없이 부드럽게.', benefit: '목 근력을 키워 거북목과 목 통증을 예방해요.' },
  { id: 'nk2', name: '목 옆 저항', part: 'neck', visibility: 'invisible', duration: 60, met: 2.0,
    method: '손을 관자놀이에 대고 옆으로 밀며, 목은 중앙을 유지하도록 버텨요. 좌우 번갈아요.', benefit: '목 측면 근육을 안정시켜 자세 균형을 잡아줘요.' },
  { id: 'ab1', name: '복부 드로인', part: 'abs', visibility: 'invisible', duration: 120, met: 2.0,
    method: '배꼽을 등 쪽으로 깊게 끌어당긴 채, 숨은 편하게 쉬며 그 긴장을 유지해요.', benefit: '코어 안정성을 높이고 아랫배를 정돈해줘요.' },
  { id: 'ab2', name: '앉아서 상체 뒤로', part: 'abs', visibility: 'slight', duration: 90, met: 2.4,
    method: '등받이에서 살짝 떨어져 상체를 조금 뒤로 기울인 채 복부에 힘을 주고 버텨요.', benefit: '복직근을 자극해 배 앞쪽을 단단하게 해줘요.' },
  { id: 'ab3', name: '복부 진공', part: 'abs', visibility: 'invisible', duration: 75, met: 1.9,
    method: '숨을 끝까지 내쉬며 배를 등 쪽으로 최대한 납작하게 넣고 잠시 멈춰요.', benefit: '속근육(복횡근)을 자극해 허리 라인과 코어를 잡아줘요.' },
  { id: 'ob1', name: '앉아서 옆으로 버티기', part: 'oblique', visibility: 'slight', duration: 75, met: 2.3,
    method: '상체를 한쪽으로 살짝 기울여 옆구리 근육을 조인 채 버티고, 반대쪽도 해요.', benefit: '복사근을 자극해 옆구리 라인을 정리해줘요.' },
  { id: 'ob2', name: '무릎-반대 팔꿈치 모으기', part: 'oblique', visibility: 'slight', duration: 60, met: 2.5,
    method: '앉은 채 한쪽 무릎과 반대쪽 팔꿈치를 가볍게 모으듯 힘을 줬다 풀어요.', benefit: '허리 회전근과 옆구리를 함께 자극해요.' },
  { id: 'lb1', name: '골반 기울이기', part: 'lowerback', visibility: 'invisible', duration: 90, met: 2.0,
    method: '골반을 앞뒤로 부드럽게 굴리며 허리 중립 자세를 찾아 유지해요.', benefit: '허리 뻐근함을 풀고 요통을 예방해요.' },
  { id: 'lb2', name: '척추 곧게 세워 버티기', part: 'lowerback', visibility: 'invisible', duration: 90, met: 2.1,
    method: '정수리를 위로 당기듯 척추를 곧게 세우고, 기립근에 힘을 준 채 유지해요.', benefit: '허리를 지지하는 기립근을 키워 바른 자세를 만들어요.' },
  { id: 'pl1', name: '괄약근 조이기', part: 'pelvic', visibility: 'invisible', duration: 90, met: 1.9,
    method: '골반 바닥 근육을 5초 조였다가 5초 풀기를 천천히 반복해요.', benefit: '골반저 근육을 강화해 코어 하부를 안정시켜요.' },
  { id: 'pl2', name: '복부+골반저 동시 조이기', part: 'pelvic', visibility: 'invisible', duration: 75, met: 2.1,
    method: '아랫배와 골반 바닥을 함께 안으로 조여 단단히 버틴 채 호흡해요.', benefit: '코어 전체를 하나로 묶어 몸통 안정성을 높여줘요.' },
  { id: 'th1', name: '다리 들어 버티기', part: 'thigh', visibility: 'slight', duration: 90, met: 3.0,
    method: '무릎을 펴 한쪽 다리를 바닥과 수평으로 들어 버텨요. 발끝을 몸쪽으로 당기면 강도가 커져요.', benefit: '허벅지 앞(대퇴사두)을 강하게 자극해요.' },
  { id: 'th2', name: '무릎 사이 조이기', part: 'thigh', visibility: 'invisible', duration: 120, met: 2.5,
    method: '무릎 사이를 안쪽으로 힘껏 조이듯 버텨요. 주먹이나 가방을 끼우면 더 좋아요.', benefit: '허벅지 안쪽(내전근)을 조용히 단련해요.' },
  { id: 'th3', name: '발로 바닥 밀기', part: 'thigh', visibility: 'invisible', duration: 90, met: 2.6,
    method: '발바닥 전체로 바닥을 강하게 밀어내며 허벅지·엉덩이에 힘을 유지해요.', benefit: '허벅지와 둔근을 함께 자극해 하체 순환을 도와요.' },
  { id: 'gl1', name: '둔근 조이기', part: 'glute', visibility: 'invisible', duration: 90, met: 2.2,
    method: '앉은 채 양쪽 엉덩이를 힘껏 조였다가 천천히 풀기를 반복해요.', benefit: '둔근을 활성화해 힙업과 골반 안정에 도움돼요.' },
  { id: 'gl2', name: '한쪽 엉덩이 들기', part: 'glute', visibility: 'slight', duration: 75, met: 2.5,
    method: '한쪽 엉덩이를 의자에서 살짝 들어올린 채 버티고, 좌우 번갈아 해요.', benefit: '중둔근을 자극해 골반 좌우 균형을 잡아줘요.' },
  { id: 'ca1', name: '발뒤꿈치 들기', part: 'calf', visibility: 'slight', duration: 90, met: 2.8,
    method: '발끝은 바닥에 두고 양 발뒤꿈치를 천천히 최대한 들었다 내려요.', benefit: '종아리를 펌프질해 다리 혈액순환과 붓기를 도와요.' },
  { id: 'ca2', name: '발끝 들기', part: 'calf', visibility: 'slight', duration: 75, met: 2.5,
    method: '뒤꿈치는 바닥에 두고 발끝을 위로 들었다 내리기를 반복해요.', benefit: '정강이 근육을 써서 하지 부종과 저림을 완화해요.' },
  { id: 'an1', name: '발목 돌리기', part: 'ankle', visibility: 'slight', duration: 60, met: 2.3,
    method: '발을 살짝 든 채 발목으로 크게 원을 그리며 양방향으로 돌려요.', benefit: '발목 가동성을 높이고 다리 붓기를 풀어줘요.' },
  { id: 'an2', name: '발끝 당기기 저항', part: 'ankle', visibility: 'invisible', duration: 60, met: 2.0,
    method: '발끝을 몸쪽으로 당겨 정강이가 팽팽해지는 지점에서 버텨요.', benefit: '발목 안정성과 종아리 순환에 도움돼요.' },
];

/* 운동 번역(en/ja/zh) — [name, method, benefit] */
const EX_TR = {
  en: {
    sh1: ['Shoulder shrug hold', 'Lift both shoulders up toward your ears and hold the tension while breathing slowly.', 'Releases the trapezius and neck tension built up from long sitting.'],
    sh2: ['Scapular squeeze', 'Draw both shoulder blades together toward your spine, open the chest slightly, and hold.', 'Helps correct rounded shoulders and a hunched upper back.'],
    sh3: ['Palm desk press', 'Place your palms on the desk and press down steadily, engaging the shoulder stabilizers.', 'Builds shoulder-joint stability and better upper-body posture.'],
    ch1: ['Palm press together', 'Press your palms together in front of your chest and push hard against each other.', 'Works the pectorals to firm up the upper-body line.'],
    ch2: ['Desk underside push', 'Place your palms under the desktop and hold as if pushing it upward.', 'Works the chest and the back of the arms (triceps) at once.'],
    bk1: ['Chair-seat pull', 'Grip the sides of your seat and pull as if lifting yourself up, then hold.', 'Activates the lats to restore back strength and posture.'],
    bk2: ['Elbow back squeeze', 'Pull your elbows as far back as you can and hold, squeezing the back muscles.', 'Straightens a hunched back and eases upper-back tension.'],
    bk3: ['Clasped-hands back stretch', 'Clasp your hands behind your back and extend your arms down, opening the chest.', 'Improves thoracic mobility and stretches the shoulders and back.'],
    ar1: ['Wrist self-resistance', 'Press one hand against the back of the other and resist with your wrist. Alternate sides.', 'Strengthens the forearm and wrist to ease mouse and typing fatigue.'],
    ar2: ['Biceps self-curl', 'Place one hand over the other; the lower arm lifts while the top hand pushes down.', 'Quietly works the front and back of the arm (biceps and triceps).'],
    nk1: ['Neck front resistance', 'Press your palm to your forehead and push forward while your neck resists. Smooth, no bouncing.', 'Builds neck strength to prevent forward head and neck pain.'],
    nk2: ['Neck side resistance', 'Press your hand to your temple and push sideways while your neck stays centered. Alternate.', 'Stabilizes the side neck muscles for postural balance.'],
    ab1: ['Abdominal draw-in', 'Pull your navel deep toward your spine and hold the tension while breathing easily.', 'Improves core stability and tones the lower belly.'],
    ab2: ['Seated lean-back', 'Come off the backrest, lean back slightly, and hold with your abs engaged.', 'Works the rectus abdominis to firm the front of the belly.'],
    ab3: ['Stomach vacuum', 'Exhale completely, pull your belly as flat as possible toward your spine, and pause.', 'Works the deep core (transverse abdominis) for waist and core control.'],
    ob1: ['Seated side hold', 'Lean your torso slightly to one side, squeezing the oblique, hold, then switch sides.', 'Works the obliques to tidy up the waistline.'],
    ob2: ['Knee-to-opposite-elbow', 'Seated, gently draw one knee and the opposite elbow toward each other, then release.', 'Works the waist rotators and obliques together.'],
    lb1: ['Pelvic tilt', 'Gently roll your pelvis back and forth to find and hold a neutral lower-back position.', 'Relieves lower-back stiffness and prevents back pain.'],
    lb2: ['Spinal-erector hold', 'Lengthen your spine as if pulled up by the crown, engaging the erectors, and hold.', 'Builds the erectors that support your lower back for good posture.'],
    pl1: ['Pelvic-floor squeeze', 'Slowly squeeze the pelvic-floor muscles for 5 seconds, release for 5, and repeat.', 'Strengthens the pelvic floor to stabilize the lower core.'],
    pl2: ['Abs + pelvic-floor squeeze', 'Draw the lower belly and pelvic floor in together, hold firmly, and keep breathing.', 'Ties the whole core together to boost trunk stability.'],
    th1: ['Leg-raise hold', 'Straighten one knee and hold your leg parallel to the floor. Pull your toes toward you for more intensity.', 'Strongly works the front of the thigh (quadriceps).'],
    th2: ['Inner-thigh squeeze', 'Squeeze your knees hard toward each other and hold. A fist or bag between them helps.', 'Quietly trains the inner thigh (adductors).'],
    th3: ['Foot floor press', 'Press your whole sole hard into the floor, keeping the thighs and glutes engaged.', 'Works the thighs and glutes and aids lower-body circulation.'],
    gl1: ['Glute squeeze', 'Seated, squeeze both glutes hard, then release slowly, and repeat.', 'Activates the glutes for a firmer seat and pelvic stability.'],
    gl2: ['Single glute lift', 'Lift one hip slightly off the chair and hold, then alternate sides.', 'Works the gluteus medius for left-right pelvic balance.'],
    ca1: ['Heel raise', 'Keep your toes down and slowly raise both heels as high as you can, then lower.', 'Pumps the calves to aid leg circulation and reduce swelling.'],
    ca2: ['Toe raise', 'Keep your heels down and lift your toes up and down repeatedly.', 'Uses the shin muscles to ease leg swelling and numbness.'],
    an1: ['Ankle circles', 'Lift your foot slightly and draw big circles with your ankle in both directions.', 'Improves ankle mobility and relieves leg swelling.'],
    an2: ['Toe-pull resistance', 'Pull your toes toward you and hold at the point where the shin feels taut.', 'Aids ankle stability and calf circulation.'],
  },
  ja: {
    sh1: ['肩すくめキープ', '両肩を耳へ引き上げ、その状態で力を保ちながらゆっくり呼吸します。', '長時間の座り姿勢で凝った僧帽筋と首まわりの緊張をほぐします。'],
    sh2: ['肩甲骨寄せ', '両方の肩甲骨を背中の中央へ寄せ、胸を軽く開いてキープします。', '巻き肩や猫背の姿勢を整えるのに役立ちます。'],
    sh3: ['手のひら机押し', '手のひらを机に置き、下へじっと押しながら肩の安定筋に力を入れます。', '肩関節の安定性と正しい上半身の姿勢をつくります。'],
    ch1: ['合掌プッシュ', '胸の前で両手のひらを合わせ、互いに強く押し合ってキープします。', '大胸筋を刺激して上半身のラインを整えます。'],
    ch2: ['机の裏押し上げ', '机の裏側に手のひらを当て、上へ押し上げるように力を保ちます。', '胸と腕の裏（三頭筋）を同時に刺激します。'],
    bk1: ['椅子引き上げ', '座ったまま座面の両端を持ち、体を引き上げるように引いてキープします。', '広背筋を働かせ、背中の力と姿勢を取り戻します。'],
    bk2: ['肘の後ろ寄せ', '肘を体の後ろへ最大限引き、背中の筋肉を締めたまま保ちます。', '猫背を伸ばし、背中上部の緊張をほぐします。'],
    bk3: ['背面で指組み伸ばし', '背中側で手を組み、腕を下へ伸ばして胸を開くようにキープします。', '胸椎の可動性を高め、肩と背中を気持ちよく伸ばします。'],
    ar1: ['手首セルフ抵抗', '片手で反対の手の甲を押し、手首はその力に耐えます。左右交互に。', '前腕と手首を鍛え、マウスやタイピングの疲れを和らげます。'],
    ar2: ['上腕セルフカール', '片手をもう片方に乗せ、下の腕は上げようとし、上の手は押さえて拮抗します。', '腕の前後（上腕二頭・三頭）を静かに刺激します。'],
    nk1: ['首前抵抗', '手のひらを額に当てて前へ押し、首は押されないよう耐えます。反動なく丁寧に。', '首の筋力を高め、ストレートネックや首の痛みを予防します。'],
    nk2: ['首横抵抗', '手をこめかみに当てて横へ押し、首は中央を保つよう耐えます。左右交互に。', '首の側面を安定させ、姿勢バランスを整えます。'],
    ab1: ['ドローイン', 'おへそを背中側へ深く引き込み、呼吸は楽にしながら緊張を保ちます。', 'コアの安定性を高め、下腹を引き締めます。'],
    ab2: ['座って上体そらし', '背もたれから少し離れ、上体を軽く後ろへ倒し腹に力を入れて耐えます。', '腹直筋を刺激してお腹の前面を引き締めます。'],
    ab3: ['ストマックバキューム', '息を吐き切り、お腹を背中側へ最大限へこませて少し止めます。', '深層筋（腹横筋）を刺激し、ウエストとコアを整えます。'],
    ob1: ['座って横キープ', '上体を片側へ軽く倒して脇腹を締めたまま耐え、反対側も行います。', '腹斜筋を刺激して脇腹のラインを整えます。'],
    ob2: ['膝と反対肘寄せ', '座ったまま片膝と反対の肘を軽く寄せるように力を入れて緩めます。', '腰の回旋筋と脇腹を一緒に刺激します。'],
    lb1: ['骨盤傾け', '骨盤を前後にやさしく転がし、腰のニュートラル位置を見つけて保ちます。', '腰のこわばりをほぐし、腰痛を予防します。'],
    lb2: ['背筋まっすぐキープ', '頭頂を上へ引かれるように背骨を伸ばし、脊柱起立筋に力を入れて保ちます。', '腰を支える起立筋を鍛え、正しい姿勢をつくります。'],
    pl1: ['骨盤底締め', '骨盤底の筋肉を5秒締め、5秒緩めるをゆっくり繰り返します。', '骨盤底筋を鍛え、下部コアを安定させます。'],
    pl2: ['腹＋骨盤底同時締め', '下腹と骨盤底を一緒に内へ締め、しっかり保ちながら呼吸します。', 'コア全体を一つにまとめ、体幹の安定性を高めます。'],
    th1: ['脚上げキープ', '膝を伸ばし片脚を床と水平に上げて耐えます。つま先を手前へ引くと強度が増します。', '太もも前（大腿四頭筋）を強く刺激します。'],
    th2: ['膝の内締め', '膝を内側へ強く締めるように耐えます。こぶしやカバンを挟むと効果的。', '太ももの内側（内転筋）を静かに鍛えます。'],
    th3: ['足で床押し', '足裏全体で床を強く押し、太ももとお尻に力を保ちます。', '太ももと臀部を刺激し、下半身の巡りを助けます。'],
    gl1: ['お尻締め', '座ったまま両方のお尻を強く締め、ゆっくり緩めるを繰り返します。', '臀筋を働かせ、ヒップアップと骨盤の安定に役立ちます。'],
    gl2: ['片側お尻上げ', '片方のお尻を椅子から少し浮かせて耐え、左右交互に行います。', '中臀筋を刺激し、骨盤の左右バランスを整えます。'],
    ca1: ['かかと上げ', 'つま先は床につけ、両かかとをゆっくり最大限上げて下ろします。', 'ふくらはぎをポンプし、脚の血行とむくみを助けます。'],
    ca2: ['つま先上げ', 'かかとは床につけ、つま先を上下に繰り返し上げます。', 'すねの筋肉を使い、脚のむくみやしびれを和らげます。'],
    an1: ['足首回し', '足を軽く上げ、足首で大きく円を描くように両方向へ回します。', '足首の可動性を高め、脚のむくみをほぐします。'],
    an2: ['つま先引き抵抗', 'つま先を手前へ引き、すねが張る位置で耐えます。', '足首の安定とふくらはぎの巡りを助けます。'],
  },
  zh: {
    sh1: ['耸肩保持', '把双肩尽量提向耳朵，保持这个用力状态并缓慢呼吸。', '放松久坐僵硬的斜方肌和颈部紧张。'],
    sh2: ['肩胛骨收拢', '把两侧肩胛骨向脊柱中间收拢，微微挺胸并保持。', '有助于改善圆肩和驼背。'],
    sh3: ['手掌压桌', '手掌放在桌上稳稳向下压，收紧肩部稳定肌。', '增强肩关节稳定性和上身正确姿势。'],
    ch1: ['合掌互推', '在胸前合掌，双手用力互推并保持。', '刺激胸大肌，收紧上身线条。'],
    ch2: ['桌底上推', '手掌抵在桌面下方，像向上推一样保持用力。', '同时刺激胸部和手臂后侧（三头肌）。'],
    bk1: ['椅面上拉', '坐着抓住座面两侧，像把自己往上拉一样发力保持。', '激活背阔肌，恢复背部力量和姿势。'],
    bk2: ['手肘后收', '把手肘尽量向身后拉，收紧背部肌肉并保持。', '打开驼背，放松上背紧张。'],
    bk3: ['背后十指伸展', '在背后十指相扣，双臂向下伸展，感觉打开胸口并保持。', '提升胸椎灵活度，舒展肩背。'],
    ar1: ['手腕自我对抗', '一只手压在另一只手背上给阻力，手腕对抗。左右交替。', '强化前臂和手腕，缓解鼠标和打字疲劳。'],
    ar2: ['二头自我弯举', '一只手放在另一只上，下面手臂想抬、上面手往下压互相对抗。', '悄悄刺激手臂前后（二头和三头）。'],
    nk1: ['颈前对抗', '手掌抵住额头往前推，颈部顶住不被推动。动作柔和不晃动。', '增强颈部力量，预防前伸头和颈痛。'],
    nk2: ['颈侧对抗', '手抵住太阳穴向侧推，颈部保持居中对抗。左右交替。', '稳定颈部侧面肌肉，帮助姿势平衡。'],
    ab1: ['腹部内收', '把肚脐向脊柱方向深收，保持这个张力同时正常呼吸。', '提升核心稳定性，收紧小腹。'],
    ab2: ['坐姿后倾', '离开椅背，上身略微后倾，收紧腹部保持。', '刺激腹直肌，收紧腹部前侧。'],
    ab3: ['腹部真空', '把气完全呼出，把腹部尽量向脊柱方向收平并停留片刻。', '刺激深层核心（腹横肌），塑造腰线和核心。'],
    ob1: ['坐姿侧保持', '上身向一侧略倾，收紧侧腰保持，再换另一侧。', '刺激腹斜肌，整理侧腰线条。'],
    ob2: ['膝碰对侧肘', '坐着让一侧膝盖与对侧手肘轻轻靠拢发力再放松。', '同时刺激腰部旋转肌和侧腰。'],
    lb1: ['骨盆前后倾', '让骨盆轻柔地前后滚动，找到并保持腰部中立位置。', '缓解腰部僵硬，预防腰痛。'],
    lb2: ['脊柱立直保持', '像被头顶向上牵引一样把脊柱立直，收紧竖脊肌保持。', '强化支撑腰部的竖脊肌，塑造正确姿势。'],
    pl1: ['盆底收紧', '把盆底肌收紧5秒、放松5秒，缓慢重复。', '强化盆底肌，稳定下部核心。'],
    pl2: ['腹＋盆底同收', '把小腹和盆底一起向内收紧，稳稳保持并持续呼吸。', '把整个核心连成一体，提升躯干稳定性。'],
    th1: ['抬腿保持', '伸直膝盖把一条腿抬到与地面平行并保持。脚尖回勾强度更大。', '强力刺激大腿前侧（股四头肌）。'],
    th2: ['夹膝内收', '把两膝用力向内夹紧保持，夹拳头或包更好。', '悄悄训练大腿内侧（内收肌）。'],
    th3: ['脚踩地', '用整个脚掌用力向下踩地，保持大腿和臀部发力。', '刺激大腿和臀部，促进下肢循环。'],
    gl1: ['臀部收紧', '坐着用力夹紧两侧臀部，再缓慢放松，反复进行。', '激活臀肌，帮助提臀和骨盆稳定。'],
    gl2: ['单侧抬臀', '把一侧臀部从椅子上略微抬起保持，左右交替。', '刺激臀中肌，平衡骨盆左右。'],
    ca1: ['提踵', '脚尖着地，把两脚跟尽量缓慢抬高再放下。', '给小腿泵血，改善腿部循环和浮肿。'],
    ca2: ['抬脚尖', '脚跟着地，把脚尖反复上抬再放下。', '运用胫前肌，缓解腿部浮肿和麻木。'],
    an1: ['转脚踝', '把脚略微抬起，用脚踝画大圈并双向转动。', '提升脚踝灵活度，舒缓腿部浮肿。'],
    an2: ['勾脚尖对抗', '把脚尖向身体方向勾，在胫部发紧的位置保持。', '帮助脚踝稳定和小腿循环。'],
  },
};

function getExercise(id) { return EXERCISES.find(e => e.id === id); }
function exField(ex, field) {
  const idx = { name: 0, method: 1, benefit: 2 }[field];
  const lang = curLang();
  if (lang !== 'ko' && EX_TR[lang] && EX_TR[lang][ex.id]) return EX_TR[lang][ex.id][idx];
  return ex[field];
}

const INTENSITY_LEVELS = [
  { value: 'invisible',
    title: { ko: '완전히 안 보임', en: 'Completely hidden', ja: '全く見えない', zh: '完全看不出' },
    desc: { ko: '복부·코어·호흡 위주 — 옆자리에서 전혀 티가 안 나요', en: 'Abs, core, breathing — nobody nearby will notice', ja: '腹・コア・呼吸中心 — 隣からは全く分かりません', zh: '以腹部·核心·呼吸为主 — 邻座完全看不出' } },
  { value: 'slight',
    title: { ko: '약간의 움직임 허용', en: 'Slight movement OK', ja: '少しの動きを許容', zh: '允许轻微动作' },
    desc: { ko: '다리 들기, 어깨 스트레칭 등 살짝 움직임이 있어요', en: 'Small moves like leg raises and shoulder stretches', ja: '脚上げや肩ストレッチなど軽い動きあり', zh: '有抬腿、肩部伸展等轻微动作' } },
];
const INTERVAL_OPTIONS = [45, 60, 75, 90];
const SKIP_KEYS = ['meeting', 'away', 'forgot', 'cond', 'etc'];
const SKIP_LABEL = { meeting: 'skip_meeting', away: 'skip_away', forgot: 'skip_forgot', cond: 'skip_cond', etc: 'skip_etc' };

/* ============================================================
   다이어트 미션 카탈로그
   type: 'abstain'(참기) | 'do'(실천) | 'count'(횟수)
   ============================================================ */
const DIET_MISSIONS = [
  { key: 'no_latenight', type: 'abstain', label: { ko: '야식 안 먹기', en: 'No late-night eating', ja: '夜食を我慢', zh: '不吃夜宵' } },
  { key: 'no_alcohol', type: 'abstain', label: { ko: '술 안 마시기', en: 'No alcohol', ja: 'お酒を我慢', zh: '不喝酒' } },
  { key: 'no_soda', type: 'abstain', label: { ko: '탄산·단 음료 안 마시기', en: 'No soda / sweet drinks', ja: '炭酸・甘い飲料を我慢', zh: '不喝碳酸·含糖饮料' } },
  { key: 'no_snack', type: 'abstain', label: { ko: '과자·디저트 안 먹기', en: 'No snacks / desserts', ja: 'お菓子・デザートを我慢', zh: '不吃零食·甜点' } },
  { key: 'no_delivery', type: 'abstain', label: { ko: '배달 음식 안 시키기', en: 'No food delivery', ja: 'デリバリーを我慢', zh: '不点外卖' } },
  { key: 'no_overeat', type: 'abstain', label: { ko: '폭식 안 하기', en: 'No overeating', ja: 'ドカ食いをしない', zh: '不暴食' } },
  { key: 'water', type: 'count', target: 8, label: { ko: '물 마시기', en: 'Drink water', ja: '水を飲む', zh: '喝水' } },
  { key: 'veggie', type: 'do', label: { ko: '채소 챙겨 먹기', en: 'Eat vegetables', ja: '野菜をとる', zh: '吃蔬菜' } },
  { key: 'protein', type: 'do', label: { ko: '단백질 챙겨 먹기', en: 'Get enough protein', ja: 'たんぱく質をとる', zh: '摄入蛋白质' } },
  { key: 'early_dinner', type: 'do', label: { ko: '저녁 8시 전에 먹기', en: 'Dinner before 8pm', ja: '夜8時前に食べる', zh: '晚8点前吃晚饭' } },
  { key: 'fasting', type: 'do', label: { ko: '12시간 공복 유지', en: '12-hour fasting window', ja: '12時間の空腹を保つ', zh: '保持12小时空腹' } },
  { key: 'stairs', type: 'do', label: { ko: '계단 이용하기', en: 'Take the stairs', ja: '階段を使う', zh: '走楼梯' } },
  { key: 'workout', type: 'do', label: { ko: '헬스·조깅 등 별도 운동', en: 'Gym / jog / extra workout', ja: 'ジム・ジョギングなど別運動', zh: '健身·慢跑等额外运动' } },
  { key: 'steps', type: 'do', label: { ko: '만보 걷기', en: 'Walk 10,000 steps', ja: '1万歩あるく', zh: '走一万步' } },
];
const DIET_BY_KEY = {};
DIET_MISSIONS.forEach(m => DIET_BY_KEY[m.key] = m);
function missionLabel(key) { const m = DIET_BY_KEY[key]; return m ? (m.label[curLang()] || m.label.ko) : key; }
const DEFAULT_MISSIONS = ['no_latenight', 'no_alcohol', 'water', 'workout', 'early_dinner'];

/* ============================================================
   저장소 + 마이그레이션(v2 → v3)
   ============================================================ */
function detectLang() {
  const n = (navigator.language || 'ko').toLowerCase();
  if (n.startsWith('ja')) return 'ja';
  if (n.startsWith('zh')) return 'zh';
  if (n.startsWith('en')) return 'en';
  return 'ko';
}
function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('deskfit_v2'); } catch (e) {}
  let s = null;
  if (raw) { try { s = JSON.parse(raw); } catch (e) {} }
  if (!s) s = { onboarded: false, settings: null, days: {}, installDate: todayKey() };
  if (s.settings) {
    if (!s.settings.lang) s.settings.lang = detectLang();
    if (!s.settings.theme) s.settings.theme = 'gold';
    if (!Array.isArray(s.settings.dietMissions)) s.settings.dietMissions = DEFAULT_MISSIONS.slice();
    if (typeof s.settings.geminiKey !== 'string') s.settings.geminiKey = '';
    if (typeof s.settings.geminiModel !== 'string') s.settings.geminiModel = '';
  }
  return s;
}
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
let state = loadState();

/* ---------- 날짜 유틸(언어별) ---------- */
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function minutesToHHMM(mins) { const h = Math.floor(mins / 60), m = mins % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
function hhmmToMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
const WEEKDAYS = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  zh: ['日', '一', '二', '三', '四', '五', '六'],
};
function weekdayLabel(d) { return WEEKDAYS[curLang()][d.getDay()]; }
function formatDateLine(d = new Date()) {
  const lang = curLang(), M = d.getMonth() + 1, D = d.getDate(), w = WEEKDAYS[lang][d.getDay()];
  if (lang === 'en') return `${w}, ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${D}`;
  if (lang === 'ja') return `${M}月${D}日(${w})`;
  if (lang === 'zh') return `${M}月${D}日 周${w}`;
  return `${M}월 ${D}일 ${w}요일`;
}
function formatShort(d) { return `${d.getMonth() + 1}.${d.getDate()}`; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

/* ---------- 칼로리 ---------- */
function slotKcal(slot) {
  const ex = getExercise(slot.exerciseId);
  if (!ex) return 0;
  const weight = (state.settings && state.settings.weightKg) || 65;
  return ex.met * 3.5 * weight / 200 * (ex.duration / 60);
}
function dayKcal(day) {
  if (!day) return 0;
  return day.slots.filter(s => s.status === 'done').reduce((sum, s) => sum + slotKcal(s), 0);
}

/* ---------- 스케줄 생성 ---------- */
function generateSchedule(settings, selectedParts) {
  const start = hhmmToMinutes(settings.workStart) + 30;
  const end = hhmmToMinutes(settings.workEnd) - 20;
  const lunchStart = hhmmToMinutes(settings.lunchStart);
  const lunchEnd = hhmmToMinutes(settings.lunchEnd);
  const step = Number(settings.interval) || 60;
  const allowVisible = settings.intensity === 'slight';
  const activeParts = (selectedParts && selectedParts.length) ? selectedParts.slice() : ALL_PART_KEYS.slice();

  const byPart = {};
  activeParts.forEach(p => {
    const list = EXERCISES.filter(e => e.part === p && (allowVisible || e.visibility === 'invisible'));
    if (list.length) byPart[p] = shuffle(list.slice());
  });
  let usableParts = Object.keys(byPart);
  if (usableParts.length === 0) {
    EXERCISES.filter(e => allowVisible || e.visibility === 'invisible').forEach(e => { (byPart[e.part] = byPart[e.part] || []).push(e); });
    Object.keys(byPart).forEach(k => shuffle(byPart[k]));
    usableParts = Object.keys(byPart);
  }
  shuffle(usableParts);

  const ptr = {}; usableParts.forEach(p => ptr[p] = 0);
  const slots = [];
  let cursor = start, partIdx = 0, lastExId = null;
  while (cursor < end && usableParts.length) {
    if (cursor >= lunchStart && cursor < lunchEnd) { cursor = lunchEnd + 15; continue; }
    const part = usableParts[partIdx % usableParts.length]; partIdx++;
    const list = byPart[part];
    let ex = list[ptr[part] % list.length]; ptr[part]++;
    if (ex.id === lastExId && list.length > 1) { ex = list[ptr[part] % list.length]; ptr[part]++; }
    lastExId = ex.id;
    slots.push({ id: `slot_${cursor}`, time: minutesToHHMM(cursor), minutes: cursor, exerciseId: ex.id, status: 'pending', skipReason: null });
    cursor += step;
  }
  return slots;
}

/* ---------- 알림 스케줄링 ---------- */
let swRegistration = null;
function armNotificationsForToday() {
  if (!state.settings || !state.settings.notifyEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const day = state.days[todayKey()];
  if (!day) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  day.slots.forEach(slot => {
    if (slot.status !== 'pending') return;
    const ex = getExercise(slot.exerciseId);
    const prepMin = slot.minutes - 2;
    if (prepMin > nowMin && navigator.serviceWorker && navigator.serviceWorker.controller) {
      const delay = (prepMin - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_NOTIFICATION',
        payload: { title: t('ai_get') && (curLang()==='ko'?'2분 후 운동 시작':curLang()==='en'?'Workout in 2 min':curLang()==='ja'?'2分後に運動開始':'2分钟后开始运动'), body: `${slot.time} · ${exField(ex,'name')} (${ex.duration}s)`, delay, slotId: slot.id, tag: `prep_${slot.id}` } });
    }
    if (slot.minutes > nowMin && navigator.serviceWorker && navigator.serviceWorker.controller) {
      const delay = (slot.minutes - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_NOTIFICATION',
        payload: { title: `${exField(ex,'name')}`, body: `${ex.duration}s`, delay, slotId: slot.id, tag: `start_${slot.id}` } });
    }
  });
}
async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch (e) { return false; }
}

/* ---------- 오늘 화면 ---------- */
function nowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

function ensureDietToday() {
  const day = state.days[todayKey()];
  if (!day) return null;
  if (!day.diet) day.diet = { done: {}, condition: null };
  if (!day.diet.done) day.diet.done = {};
  return day.diet;
}

function renderToday() {
  document.getElementById('date-line').textContent = formatDateLine();
  const day = state.days[todayKey()];
  const list = document.getElementById('schedule-list');

  if (!day || day.slots.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="em-title">${t('empty_title')}</div>${t('empty_body')}</div>`;
    document.getElementById('progress-count').innerHTML = `0<span>${t('done_suffix', { total: 0 })}</span>`;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('streak-count').textContent = t('streak_unit', { n: computeStreak() });
    renderDietBlock();
    return;
  }

  const nm = nowMinutes();
  list.innerHTML = day.slots.map(slot => {
    const ex = getExercise(slot.exerciseId);
    const isActive = slot.status === 'pending' && nm >= slot.minutes && nm < slot.minutes + Math.ceil(ex.duration / 60) + 10;
    let statusClass = 'pending', icon = '';
    if (slot.status === 'done') { statusClass = 'done'; icon = '✓'; }
    else if (slot.status === 'skip') { statusClass = 'skip'; icon = '–'; }
    else if (isActive) { statusClass = 'active'; icon = '●'; }
    const cardStateClass = slot.status === 'done' ? 'is-done' : slot.status === 'skip' ? 'is-skip' : '';
    const kcal = Math.round(slotKcal(slot));
    const skipTxt = slot.status === 'skip' && slot.skipReason ? ' · ' + t(SKIP_LABEL[slot.skipReason] || 'skip_etc') : '';
    return `
      <div class="slot-card ${cardStateClass}" data-slot="${slot.id}">
        <div class="slot-time">${slot.time}${isActive ? '<span class="now-dot"></span>' : ''}</div>
        <div class="slot-main">
          <div class="slot-name">${exField(ex, 'name')}</div>
          <div class="slot-meta">${partLabel(ex.part)} · ${Math.round(ex.duration / 60 * 10) / 10}${t('min_unit')} · ${t('kcal_about', { n: kcal })}${skipTxt}</div>
        </div>
        <div class="slot-status ${statusClass}">${icon}</div>
      </div>`;
  }).join('');
  list.querySelectorAll('.slot-card').forEach(card => card.addEventListener('click', () => openTimer(card.dataset.slot)));

  const doneCount = day.slots.filter(s => s.status === 'done').length;
  const total = day.slots.length;
  document.getElementById('progress-count').innerHTML = `${doneCount}<span>${t('done_suffix', { total })}</span>`;
  document.getElementById('progress-fill').style.width = total ? `${(doneCount / total) * 100}%` : '0%';
  document.getElementById('streak-count').textContent = t('streak_unit', { n: computeStreak() });

  renderDietBlock();
}

/* ---------- 식단 미션 블록 ---------- */
function renderDietBlock() {
  const wrap = document.getElementById('diet-block');
  if (!wrap) return;
  const missions = (state.settings && state.settings.dietMissions) || [];
  if (!state.days[todayKey()]) { wrap.innerHTML = ''; return; }
  const diet = ensureDietToday();

  if (!missions.length) {
    wrap.innerHTML = `<div class="diet-head"><div class="dh-title">${t('diet_title')}</div></div>
      <div class="diet-empty">${t('diet_empty')}</div>`;
    const link = wrap.querySelector('#diet-empty-link');
    if (link) link.addEventListener('click', () => switchTab('settings'));
    return;
  }

  const chosen = DIET_MISSIONS.filter(m => missions.includes(m.key));
  const abstain = chosen.filter(m => m.type === 'abstain');
  const doers = chosen.filter(m => m.type !== 'abstain');
  let doneCnt = 0;
  chosen.forEach(m => {
    if (m.type === 'count') { if ((diet.done[m.key] || 0) >= (m.target || 1)) doneCnt++; }
    else if (diet.done[m.key]) doneCnt++;
  });

  function rowHTML(m) {
    if (m.type === 'count') {
      const val = diet.done[m.key] || 0;
      const reached = val >= (m.target || 1);
      return `<div class="mission-row ${reached ? 'checked' : ''}" data-mkey="${m.key}" data-type="count">
        <div class="mission-check">✓</div>
        <div class="mission-name">${missionLabel(m.key)}</div>
        <div class="mission-counter">
          <div class="mc-val">${val}<small>/${m.target}${t('unit_cup')}</small></div>
          <div class="mc-btn minus" data-act="minus">−</div><div class="mc-btn plus" data-act="plus">+</div>
        </div></div>`;
    }
    const checked = !!diet.done[m.key];
    return `<div class="mission-row ${checked ? 'checked' : ''}" data-mkey="${m.key}" data-type="toggle">
      <div class="mission-check">✓</div><div class="mission-name">${missionLabel(m.key)}</div></div>`;
  }

  let html = `<div class="diet-head"><div class="dh-title">${t('diet_title')}</div><div class="dh-count">${doneCnt}/${chosen.length}</div></div>`;
  if (abstain.length) { html += `<div class="diet-subcap">${t('diet_abstain')}</div>` + abstain.map(rowHTML).join(''); }
  if (doers.length) { html += `<div class="diet-subcap">${t('diet_do')}</div>` + doers.map(rowHTML).join(''); }
  html += `<div class="review-cta" id="open-review">${t('review_cta')}</div>`;
  wrap.innerHTML = html;

  wrap.querySelectorAll('.mission-row[data-type="toggle"]').forEach(row => {
    row.addEventListener('click', () => {
      const k = row.dataset.mkey;
      diet.done[k] = !diet.done[k];
      if (!diet.done[k]) delete diet.done[k];
      saveState(); renderDietBlock();
    });
  });
  wrap.querySelectorAll('.mission-row[data-type="count"] .mc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('.mission-row'); const k = row.dataset.mkey; const m = DIET_BY_KEY[k];
      let v = diet.done[k] || 0;
      v += btn.dataset.act === 'plus' ? 1 : -1;
      v = Math.max(0, Math.min(v, (m.target || 8) + 4));
      diet.done[k] = v; saveState(); renderDietBlock();
    });
  });
  const rv = wrap.querySelector('#open-review');
  if (rv) rv.addEventListener('click', openReviewSheet);
}

function computeStreak() {
  let streak = 0, d = new Date();
  for (let i = 0; i < 90; i++) {
    const key = todayKey(d);
    const day = state.days[key];
    const success = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (i === 0 && !success) { d.setDate(d.getDate() - 1); continue; }
    if (!success) break;
    streak++; d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- Wake Lock ---------- */
let wakeLock = null;
async function acquireWakeLock() {
  try { if ('wakeLock' in navigator && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } }
  catch (e) { wakeLock = null; }
}
async function releaseWakeLock() { try { if (wakeLock) await wakeLock.release(); } catch (e) {} finally { wakeLock = null; } }

/* ---------- 타이머 ---------- */
let timerState = { slotId: null, remaining: 0, total: 0, running: false, intervalId: null };
function openTimer(slotId) {
  const day = state.days[todayKey()]; if (!day) return;
  const slot = day.slots.find(s => s.id === slotId); if (!slot) return;
  const ex = getExercise(slot.exerciseId);
  clearInterval(timerState.intervalId);
  timerState = { slotId, remaining: ex.duration, total: ex.duration, running: false, intervalId: null };
  document.getElementById('timer-ex-name').textContent = exField(ex, 'name');
  document.getElementById('timer-method-text').textContent = exField(ex, 'method');
  document.getElementById('timer-benefit-text').textContent = exField(ex, 'benefit');
  document.getElementById('dial-progress').style.strokeDasharray = `${DIAL_CIRC}`;
  document.getElementById('dial-progress').style.strokeDashoffset = `0`;
  document.getElementById('dial-sub').textContent = t('tap_start');
  updateDialTime();
  document.getElementById('timer-toggle').textContent = t('btn_start');
  document.getElementById('timer-screen').classList.remove('hidden');
}
function updateDialTime() {
  const m = Math.floor(timerState.remaining / 60), s = timerState.remaining % 60;
  document.getElementById('dial-time').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const progress = 1 - timerState.remaining / timerState.total;
  document.getElementById('dial-progress').style.strokeDashoffset = `${DIAL_CIRC * (1 - progress)}`;
}
function toggleTimer() {
  if (timerState.remaining <= 0) return;
  timerState.running = !timerState.running;
  document.getElementById('timer-toggle').textContent = timerState.running ? t('btn_pause') : t('btn_resume');
  document.getElementById('dial-sub').textContent = timerState.running ? t('running') : t('paused');
  if (timerState.running) {
    acquireWakeLock();
    timerState.intervalId = setInterval(() => { timerState.remaining -= 1; updateDialTime(); if (timerState.remaining <= 0) { clearInterval(timerState.intervalId); completeCurrentSlot(); } }, 1000);
  } else { clearInterval(timerState.intervalId); releaseWakeLock(); }
}
function completeCurrentSlot() {
  releaseWakeLock();
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'done'; slot.skipReason = null; }
  saveState();
  document.getElementById('dial-sub').textContent = t('done_excl');
  document.getElementById('timer-toggle').textContent = t('btn_donelabel');
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  showToast(t('t_done_count', { done: day.slots.filter(s => s.status === 'done').length, total: day.slots.length }));
  setTimeout(() => { closeTimer(); renderToday(); }, 900);
}
function closeTimer() {
  clearInterval(timerState.intervalId); timerState.running = false; releaseWakeLock();
  document.getElementById('timer-screen').classList.add('hidden'); renderToday();
}
function openSkipSheet() { document.getElementById('skip-sheet').classList.remove('hidden'); }
function closeSkipSheet() { document.getElementById('skip-sheet').classList.add('hidden'); }
function applySkip(reason) {
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'skip'; slot.skipReason = reason; }
  saveState(); closeSkipSheet(); closeTimer(); showToast(t('t_skip'));
}

/* ============================================================
   리포트
   ============================================================ */
function dietSummary(day) {
  const missions = (state.settings && state.settings.dietMissions) || [];
  const chosen = DIET_MISSIONS.filter(m => missions.includes(m.key));
  if (!day || !day.diet || !chosen.length) return { done: 0, total: chosen.length, doneKeys: [], missKeys: chosen.map(m => m.key) };
  const doneKeys = [], missKeys = [];
  chosen.forEach(m => {
    const v = day.diet.done[m.key];
    const ok = m.type === 'count' ? (v || 0) >= (m.target || 1) : !!v;
    if (ok) doneKeys.push(m.key); else missKeys.push(m.key);
  });
  return { done: doneKeys.length, total: chosen.length, doneKeys, missKeys };
}

function renderReport() {
  const today = new Date();
  const todayD = state.days[todayKey()];

  const tTotal = todayD ? todayD.slots.length : 0;
  const tDone = todayD ? todayD.slots.filter(s => s.status === 'done').length : 0;
  const ds = dietSummary(todayD);
  document.getElementById('today-done').textContent = `${tDone}/${tTotal}`;
  document.getElementById('today-mission').textContent = `${ds.done}/${ds.total}`;
  document.getElementById('today-kcal').innerHTML = `${Math.round(dayKcal(todayD))}<small>kcal</small>`;

  // Gemini 평가 카드 초기 상태 복원(오늘 저장된 평가가 있으면 표시)
  renderAiCard(todayD && todayD.aiEval ? todayD.aiEval : null);

  // 주간
  const days7 = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days7.push({ key: todayKey(d), date: d }); }
  document.getElementById('report-week-line').textContent = `${formatShort(days7[0].date)} – ${formatShort(days7[6].date)}`;

  let totalDone = 0, totalSlots = 0, weekKcal = 0;
  const timeBucket = {}, missionScore = {};
  days7.forEach(({ key }) => {
    const d = state.days[key]; if (!d) return;
    weekKcal += dayKcal(d);
    d.slots.forEach(s => {
      totalSlots++; if (s.status === 'done') totalDone++;
      if (!timeBucket[s.time]) timeBucket[s.time] = { done: 0, total: 0 };
      timeBucket[s.time].total++; if (s.status === 'done') timeBucket[s.time].done++;
    });
    const sm = dietSummary(d);
    sm.doneKeys.forEach(k => { missionScore[k] = (missionScore[k] || 0) + 1; });
    sm.missKeys.forEach(k => { if (!(k in missionScore)) missionScore[k] = missionScore[k] || 0; });
  });

  const rate = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0;
  document.getElementById('stat-rate').textContent = `${rate}%`;
  document.getElementById('stat-week-kcal').innerHTML = `${Math.round(weekKcal)}<small>kcal</small>`;

  let best = 0, cur = 0;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day = state.days[todayKey(d)];
    const ok = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (ok) { cur++; best = Math.max(best, cur); } else cur = 0;
  }
  document.getElementById('stat-streak').textContent = `${best}${curLang() === 'ko' ? '일' : curLang() === 'ja' ? '日' : curLang() === 'zh' ? '天' : 'd'}`;

  let bestTime = '-', bestRate = -1;
  Object.entries(timeBucket).forEach(([time, v]) => { const r = v.done / v.total; if (r > bestRate) { bestRate = r; bestTime = time; } });
  document.getElementById('stat-best-time').textContent = bestTime;

  const chart = document.getElementById('week-chart');
  chart.innerHTML = days7.map(({ key, date }) => {
    const d = state.days[key];
    const r = d && d.slots.length ? (d.slots.filter(s => s.status === 'done').length / d.slots.length) : 0;
    const isToday = key === todayKey();
    return `<div class="week-bar-wrap"><div class="week-bar ${isToday ? 'today' : ''}" style="height:${Math.max(4, r * 100)}%"></div><div class="week-bar-label">${weekdayLabel(date)}</div></div>`;
  }).join('');

  // 인사이트 — 미션 패턴
  const insight = document.getElementById('insight-card');
  const entries = Object.entries(missionScore);
  if (totalSlots === 0 && !entries.length) { insight.innerHTML = t('insight_none'); }
  else {
    let bestM = null, worstM = null, bmax = -1, wmin = 99;
    entries.forEach(([k, v]) => { if (v > bmax) { bmax = v; bestM = k; } if (v < wmin) { wmin = v; worstM = k; } });
    const dot = (c) => `<span style="color:${c}">●</span>`;
    let html = '';
    if (bestM) html += `${dot('var(--done)')} ${curLang()==='ko'?'가장 잘 지킨 미션':curLang()==='en'?'Best-kept mission':curLang()==='ja'?'最も守れたミッション':'最能坚持的任务'} : <b>${missionLabel(bestM)} (${bmax}${curLang()==='ko'?'일':curLang()==='ja'?'日':curLang()==='zh'?'天':'d'})</b><br/>`;
    if (worstM && worstM !== bestM) html += `${dot('var(--skip)')} ${curLang()==='ko'?'가장 자주 무너진 미션':curLang()==='en'?'Most-missed mission':curLang()==='ja'?'最もつまずいたミッション':'最常没做到的任务'} : <b>${missionLabel(worstM)}</b>`;
    if (!html) html = t('insight_none');
    insight.innerHTML = html;
  }
}

/* ---------- 로컬 평가(키 없을 때) ---------- */
function localEvaluation(day) {
  if (!day || day.slots.length === 0) return t('insight_none');
  const total = day.slots.length, done = day.slots.filter(s => s.status === 'done').length;
  const kcal = Math.round(dayKcal(day)), ds = dietSummary(day);
  const rate = done / total;
  const parts = { good: t('ai_good'), improve: t('ai_improve'), tomorrow: t('ai_tomorrow') };
  // 간단 로컬 문구(언어별 조합)
  const L = curLang();
  const gymDone = `${done}/${total}`, dietDone = `${ds.done}/${ds.total}`;
  const line = {
    ko: { high: `운동 ${gymDone}, 미션 ${dietDone} — 오늘 아주 단단하게 지키셨어요. 약 ${kcal}kcal 소모.`,
          mid: `운동 ${gymDone}, 미션 ${dietDone}. 절반 이상 해내셨어요. 하나만 더 채워도 오늘이 더 좋아져요.`,
          low: `운동 ${gymDone}, 미션 ${dietDone}. 바쁜 하루였나 봐요. 가장 쉬운 것 하나만 골라 해봐요.` },
    en: { high: `Workouts ${gymDone}, missions ${dietDone} — really solid today. ~${kcal} kcal burned.`,
          mid: `Workouts ${gymDone}, missions ${dietDone}. Over halfway. One more makes today even stronger.`,
          low: `Workouts ${gymDone}, missions ${dietDone}. Busy day. Pick just the easiest one and do it.` },
    ja: { high: `運動 ${gymDone}、ミッション ${dietDone} — 今日はしっかり守れました。約${kcal}kcal消費。`,
          mid: `運動 ${gymDone}、ミッション ${dietDone}。半分以上達成。あと一つで今日がもっと良く。`,
          low: `運動 ${gymDone}、ミッション ${dietDone}。忙しい一日でしたね。一番簡単なものを一つだけ。` },
    zh: { high: `运动 ${gymDone}、任务 ${dietDone} — 今天守得很稳，约消耗${kcal}千卡。`,
          mid: `运动 ${gymDone}、任务 ${dietDone}。过半了。再补一个今天会更好。`,
          low: `运动 ${gymDone}、任务 ${dietDone}。今天挺忙的。挑最容易的一个做就好。` },
  }[L];
  const msg = rate >= 0.8 ? line.high : rate >= 0.5 ? line.mid : line.low;
  return `<div class="ai-section">${msg}</div>`;
}

/* ---------- Gemini 인앱 평가 ----------
   모델은 하드코딩하지 않는다. 구글이 모델을 주기적으로 셧다운하기 때문에
   (예: gemini-2.0-flash는 2026-06-01 종료) 키로 모델 목록을 조회해
   쓸 수 있는 모델을 자동 선택하고, 404가 나면 다시 감지한다.
   ------------------------------------------------------------------ */
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL_CANDIDATES = [
  'gemini-3.1-flash-lite',   // 저렴 · 셧다운 2027-05-07
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];
function buildGeminiPrompt(day) {
  const total = day.slots.length, done = day.slots.filter(s => s.status === 'done').length;
  const kcal = Math.round(dayKcal(day));
  const doneNames = day.slots.filter(s => s.status === 'done').map(s => exField(getExercise(s.exerciseId), 'name'));
  const skipped = day.slots.filter(s => s.status === 'skip').map(s => `${exField(getExercise(s.exerciseId),'name')}(${t(SKIP_LABEL[s.skipReason]||'skip_etc')})`);
  const ds = dietSummary(day);
  const doneMissions = ds.doneKeys.map(missionLabel);
  const missMissions = ds.missKeys.map(missionLabel);
  const parts = (day.parts || []).map(partLabel).join(', ');
  const langName = { ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese' }[curLang()];

  return [
    `You are a warm but honest desk-fitness and diet coach for an office worker.`,
    `Reply ONLY in ${langName}. Keep each field to 1-2 short sentences, encouraging and specific, never preachy or guilt-inducing.`,
    ``,
    `Today's record:`,
    `- Target body parts: ${parts || 'full body'}`,
    `- Desk workouts completed: ${done}/${total} (~${kcal} kcal)`,
    `- Completed: ${doneNames.join(', ') || 'none'}`,
    `- Skipped: ${skipped.join(', ') || 'none'}`,
    `- Diet missions kept: ${doneMissions.join(', ') || 'none'}`,
    `- Diet missions missed: ${missMissions.join(', ') || 'none'}`,
    ``,
    `Return ONLY a JSON object (no markdown, no code fences) with exactly these keys:`,
    `{"good": "...", "improve": "...", "tomorrow": "..."}`,
    `good = one thing they did well today. improve = one gentle thing to improve. tomorrow = one concrete tiny action for tomorrow.`,
  ].join('\n');
}

function rawErr(body) {
  return (body && body.error && body.error.message) ? String(body.error.message) : '';
}
function geminiErrorMessage(status, body) {
  const st = (body && body.error && body.error.status) || '';
  const msg = rawErr(body);
  if (status === 400 && /API_KEY_INVALID|API key not valid|API key expired/i.test(msg)) return t('err_key_invalid');
  if (status === 400 && st === 'FAILED_PRECONDITION') return t('err_region');
  if (status === 400 && /INVALID_ARGUMENT/i.test(st)) return t('err_key_invalid');
  if (status === 401 || status === 403) return t('err_key_blocked');
  if (status === 429) return t('err_quota');
  if (status === 404) return t('err_model');
  return t('ai_err');
}

async function listGeminiModels(key) {
  const res = await fetch(`${GEMINI_API}/models?key=${encodeURIComponent(key)}`);
  let body = null;
  try { body = await res.json(); } catch (e) {}
  if (!res.ok) return { error: { status: res.status, body } };
  const names = (body && body.models || [])
    .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
    .map(m => String(m.name || '').replace(/^models\//, ''));
  return { models: names };
}
function pickModel(names) {
  for (const c of MODEL_CANDIDATES) if (names.indexOf(c) >= 0) return c;
  // 후보가 모두 사라졌으면 이름으로 유추(이미지/음성/임베딩 모델 제외)
  const flash = names.find(n => /flash/.test(n) && !/image|tts|live|audio|embedding|robotics/.test(n));
  if (flash) return flash;
  const any = names.find(n => /^gemini/.test(n) && !/image|tts|live|audio|embedding|robotics/.test(n));
  return any || names[0] || null;
}
async function resolveModel(key, force) {
  if (!force && state.settings.geminiModel) return { model: state.settings.geminiModel };
  const r = await listGeminiModels(key);
  if (r.error) return { error: r.error };
  const m = pickModel(r.models);
  if (!m) return { error: { status: 404, body: null } };
  state.settings.geminiModel = m; saveState();
  return { model: m };
}

async function geminiGenerate(model, key, day) {
  const res = await fetch(`${GEMINI_API}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildGeminiPrompt(day) }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    }),
  });
  let body = null;
  try { body = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, body };
}

async function callGemini(day) {
  const key = (state.settings && state.settings.geminiKey || '').trim();
  if (!key) return { error: 'nokey' };
  try {
    let rm = await resolveModel(key, false);
    if (rm.error) return { error: 'api', message: geminiErrorMessage(rm.error.status, rm.error.body), raw: rawErr(rm.error.body) };
    let model = rm.model;

    let res = await geminiGenerate(model, key, day);
    // 모델이 은퇴했으면(404) 한 번만 다시 감지해서 재시도
    if (!res.ok && res.status === 404) {
      rm = await resolveModel(key, true);
      if (rm.error) return { error: 'api', message: geminiErrorMessage(rm.error.status, rm.error.body), raw: rawErr(rm.error.body) };
      if (rm.model !== model) { model = rm.model; res = await geminiGenerate(model, key, day); }
    }
    if (!res.ok) return { error: 'api', message: geminiErrorMessage(res.status, res.body), raw: rawErr(res.body) };

    const cand = ((res.body && res.body.candidates) || [])[0];
    const parts = cand && cand.content && cand.content.parts;
    let raw = Array.isArray(parts) ? parts.map(p => p.text || '').join('') : '';
    raw = raw.replace(/```json|```/g, '').trim();
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) {}
    if (!parsed) {
      if (raw) return { ok: true, good: raw, improve: '', tomorrow: '', model };
      return { error: 'api', message: t('ai_err'), raw: '' };
    }
    return { ok: true, good: parsed.good, improve: parsed.improve, tomorrow: parsed.tomorrow, model };
  } catch (e) {
    // fetch 자체 실패 = 네트워크/CORS
    return { error: 'api', message: t('err_network'), raw: String((e && e.message) || e) };
  }
}

async function testGeminiConnection() {
  const el = document.getElementById('gemini-test-status');
  const input = document.getElementById('setting-gemini-key');
  const typed = (input && input.value || '').trim();
  if (typed && typed !== state.settings.geminiKey) { state.settings.geminiKey = typed; state.settings.geminiModel = ''; saveState(); }
  const key = (state.settings.geminiKey || '').trim();
  if (!key) { el.textContent = t('ai_nokey'); el.style.color = 'var(--skip)'; return; }
  el.textContent = t('test_ing'); el.style.color = 'var(--text-muted)';
  try {
    const r = await resolveModel(key, true);
    if (r.error) {
      const detail = rawErr(r.error.body);
      el.innerHTML = `${t('test_fail')} · ${geminiErrorMessage(r.error.status, r.error.body)}` + (detail ? `<br/><span style="color:var(--text-faint);font-size:11px">${detail}</span>` : '');
      el.style.color = 'var(--skip)'; return;
    }
    el.textContent = t('test_ok', { model: r.model });
    el.style.color = 'var(--done)';
    const mn = document.getElementById('gemini-model-name');
    if (mn) mn.textContent = r.model;
  } catch (e) {
    el.textContent = `${t('test_fail')} · ${t('err_network')}`;
    el.style.color = 'var(--skip)';
  }
}

function renderAiCard(evalObj) {
  const host = document.getElementById('ai-card-host');
  const btn = document.getElementById('btn-ai-eval');
  if (!host) return;
  if (!evalObj) { host.innerHTML = ''; if (btn) btn.textContent = t('ai_get'); return; }
  const usedModel = evalObj.model || (state.settings && state.settings.geminiModel) || 'Gemini';
  const modelName = 'Gemini';
  host.innerHTML = `
    <div class="ai-card">
      <div class="ai-head"><div class="ai-badge">✦</div><div class="ai-title">${t('ai_title', { model: modelName })}</div></div>
      <div class="ai-body">
        <div class="ai-section"><b>${t('ai_good')}</b> — ${evalObj.good || '-'}</div>
        <div class="ai-section"><b>${t('ai_improve')}</b> — ${evalObj.improve || '-'}</div>
        <div class="ai-section"><b>${t('ai_tomorrow')}</b> — ${evalObj.tomorrow || '-'}</div>
      </div>
      <div class="ai-foot">${t('ai_foot', { model: usedModel })}</div>
    </div>`;
  if (btn) btn.textContent = t('ai_regen');
}

async function runAiEval() {
  const day = state.days[todayKey()];
  if (!day || day.slots.length === 0) { showToast(t('t_need_schedule')); return; }
  const host = document.getElementById('ai-card-host');
  const key = (state.settings && state.settings.geminiKey || '').trim();
  if (!key) {
    host.innerHTML = `<div class="ai-card"><div class="ai-body">${localEvaluation(day)}<div class="ai-section" style="color:var(--text-faint);font-size:12px">${t('ai_nokey')}</div></div></div>`;
    return;
  }
  host.innerHTML = `<div class="ai-card"><div class="ai-loading">${t('ai_loading')}</div></div>`;
  const r = await callGemini(day);
  if (r && r.ok) {
    day.aiEval = { good: r.good, improve: r.improve, tomorrow: r.tomorrow, model: r.model, at: Date.now() };
    saveState(); renderAiCard(day.aiEval);
  } else if (r && r.error === 'nokey') {
    host.innerHTML = `<div class="ai-card"><div class="ai-body">${localEvaluation(day)}</div></div>`;
  } else {
    const msg = (r && r.message) || t('ai_err');
    const detail = (r && r.raw) ? `<div style="margin-top:8px;color:var(--text-faint);font-size:11px;line-height:1.5">${r.raw}</div>` : '';
    host.innerHTML = `<div class="ai-card"><div class="ai-body" style="color:var(--skip)">${msg}${detail}</div></div>`;
  }
}

/* ---------- 저녁 마감 시트 ---------- */
let reviewCond = null;
function openReviewSheet() {
  const diet = ensureDietToday();
  if (!diet) { showToast(t('t_need_schedule')); return; }
  reviewCond = diet.condition || null;
  const missions = (state.settings.dietMissions || []);
  const chosen = DIET_MISSIONS.filter(m => missions.includes(m.key));
  const abstain = chosen.filter(m => m.type === 'abstain');
  const doers = chosen.filter(m => m.type !== 'abstain');

  const chip = (m) => {
    const on = m.type === 'count' ? (diet.done[m.key] || 0) >= (m.target || 1) : !!diet.done[m.key];
    return `<div class="rv-chip ${on ? 'on' : ''}" data-mkey="${m.key}" data-type="${m.type}">${on ? '✓ ' : ''}${missionLabel(m.key)}</div>`;
  };
  let html = `<h3>${t('review_title')}</h3><div class="sheet-sub">${t('review_sub')}</div>`;
  if (abstain.length) html += `<div class="rv-cap">${t('review_abstain')}</div><div class="rv-chips">${abstain.map(chip).join('')}</div>`;
  if (doers.length) html += `<div class="rv-cap">${t('review_do')}</div><div class="rv-chips">${doers.map(chip).join('')}</div>`;
  html += `<div class="rv-cap">${t('review_cond')}</div><div class="rv-cond">
    <div class="rc ${reviewCond==='bad'?'on':''}" data-cond="bad">${t('cond_bad')}</div>
    <div class="rc ${reviewCond==='ok'?'on':''}" data-cond="ok">${t('cond_ok')}</div>
    <div class="rc ${reviewCond==='good'?'on':''}" data-cond="good">${t('cond_good')}</div></div>`;
  html += `<div class="rv-save" id="rv-save">${t('review_save')}</div>`;

  const sheet = document.getElementById('review-sheet');
  sheet.querySelector('.sheet').innerHTML = html;
  sheet.classList.remove('hidden');

  sheet.querySelectorAll('.rv-chip').forEach(c => c.addEventListener('click', () => {
    const k = c.dataset.mkey, m = DIET_BY_KEY[k];
    if (m.type === 'count') { const reached = (diet.done[k] || 0) >= (m.target || 1); diet.done[k] = reached ? 0 : (m.target || 1); }
    else { diet.done[k] = !diet.done[k]; if (!diet.done[k]) delete diet.done[k]; }
    saveState();
    c.classList.toggle('on'); c.textContent = (c.classList.contains('on') ? '✓ ' : '') + missionLabel(k);
  }));
  sheet.querySelectorAll('.rc').forEach(c => c.addEventListener('click', () => {
    sheet.querySelectorAll('.rc').forEach(x => x.classList.remove('on'));
    c.classList.add('on'); reviewCond = c.dataset.cond;
  }));
  sheet.querySelector('#rv-save').addEventListener('click', () => {
    diet.condition = reviewCond; saveState();
    sheet.classList.add('hidden'); showToast(t('t_review_saved'));
    renderDietBlock();
  });
}
function closeReviewSheet() { document.getElementById('review-sheet').classList.add('hidden'); }

/* ============================================================
   설정 화면
   ============================================================ */
function renderChipOptions(containerId, options, current, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = options.map(o => `<div class="chip-opt ${current === o.value ? 'selected' : ''}" data-value="${o.value}">${o.label}</div>`).join('');
  el.querySelectorAll('.chip-opt').forEach(opt => opt.addEventListener('click', () => {
    el.querySelectorAll('.chip-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected'); onSelect(opt.dataset.value);
  }));
}
function renderIntensityOptions(containerId, current, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = INTENSITY_LEVELS.map(lv => `
    <div class="intensity-opt ${current === lv.value ? 'selected' : ''}" data-value="${lv.value}">
      <div class="opt-title">${lv.title[curLang()] || lv.title.ko}</div><div class="opt-desc">${lv.desc[curLang()] || lv.desc.ko}</div>
    </div>`).join('');
  el.querySelectorAll('.intensity-opt').forEach(opt => opt.addEventListener('click', () => {
    el.querySelectorAll('.intensity-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected'); onSelect(opt.dataset.value);
  }));
}
function renderLangOptions() {
  const el = document.getElementById('lang-options');
  el.innerHTML = LANGS.map(l => `<div class="lang-opt ${curLang() === l ? 'selected' : ''}" data-lang="${l}">${LANG_NAMES[l]}</div>`).join('');
  el.querySelectorAll('.lang-opt').forEach(opt => opt.addEventListener('click', () => {
    state.settings.lang = opt.dataset.lang; saveState();
    applyStaticI18n(); renderSettings(); showToast(t('t_lang'));
  }));
}
function renderThemeOptions() {
  const el = document.getElementById('theme-options');
  el.innerHTML = THEMES.map(th => `
    <div class="theme-opt ${state.settings.theme === th.key ? 'selected' : ''}" data-theme="${th.key}">
      <div class="theme-swatch" style="background:${th.bg};border:1px solid var(--hairline)"><div class="dot" style="background:${th.color}"></div></div>
      <div class="theme-name">${th.key}</div>
    </div>`).join('');
  el.querySelectorAll('.theme-opt').forEach(opt => opt.addEventListener('click', () => {
    state.settings.theme = opt.dataset.theme; saveState();
    applyTheme(state.settings.theme); renderThemeOptions(); showToast(t('t_theme'));
  }));
}
function renderMissionPick() {
  const el = document.getElementById('mission-pick-options');
  const chosen = state.settings.dietMissions || [];
  el.innerHTML = DIET_MISSIONS.map(m => `<div class="mission-chip ${chosen.includes(m.key) ? 'selected' : ''}" data-mkey="${m.key}">${missionLabel(m.key)}</div>`).join('');
  el.querySelectorAll('.mission-chip').forEach(chip => chip.addEventListener('click', () => {
    const k = chip.dataset.mkey;
    const arr = state.settings.dietMissions || [];
    const i = arr.indexOf(k);
    if (i >= 0) arr.splice(i, 1); else arr.push(k);
    state.settings.dietMissions = arr; saveState();
    chip.classList.toggle('selected');
  }));
}
function renderSettings() {
  const s = state.settings;
  renderLangOptions();
  renderThemeOptions();
  document.getElementById('setting-work-start').value = s.workStart;
  document.getElementById('setting-work-end').value = s.workEnd;
  document.getElementById('setting-lunch-start').value = s.lunchStart;
  document.getElementById('setting-lunch-end').value = s.lunchEnd;
  document.getElementById('setting-weight').value = s.weightKg || 65;
  document.getElementById('setting-gemini-key').value = s.geminiKey || '';
  const mn = document.getElementById('gemini-model-name');
  if (mn) mn.textContent = s.geminiModel || t('model_auto');
  document.getElementById('toggle-notify').classList.toggle('on', s.notifyEnabled);
  renderChipOptions('setting-interval-options', INTERVAL_OPTIONS.map(v => ({ value: v, label: `${v}${t('min_unit')}` })), Number(s.interval), (val) => { s.interval = Number(val); saveState(); });
  renderIntensityOptions('intensity-options', s.intensity, (val) => { s.intensity = val; saveState(); });
  renderMissionPick();
}

/* ---------- 토스트 ---------- */
let toastTimer = null;
function showToast(msg) {
  const t2 = document.getElementById('toast');
  t2.textContent = msg; t2.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t2.classList.remove('show'), 2200);
}

/* ---------- 백업 ---------- */
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `deskfit-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(t('t_backup_ok'));
  } catch (e) { showToast(t('t_backup_fail')); }
}
function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || typeof data.days !== 'object' || !data.settings) { showToast(t('t_restore_bad')); return; }
      state = { onboarded: !!data.onboarded, settings: data.settings, days: data.days || {}, installDate: data.installDate || todayKey() };
      if (!state.settings.lang) state.settings.lang = detectLang();
      if (!state.settings.theme) state.settings.theme = 'gold';
      if (!Array.isArray(state.settings.dietMissions)) state.settings.dietMissions = DEFAULT_MISSIONS.slice();
      if (typeof state.settings.geminiKey !== 'string') state.settings.geminiKey = '';
      if (typeof state.settings.geminiModel !== 'string') state.settings.geminiModel = '';
      saveState(); showToast(t('t_restore_ok'));
      setTimeout(() => location.reload(), 700);
    } catch (e) { showToast(t('t_restore_fail')); }
  };
  reader.onerror = () => showToast(t('t_restore_fail'));
  reader.readAsText(file);
}
async function requestPersistentStorage() {
  try { if (navigator.storage && navigator.storage.persist) { if (!(await navigator.storage.persisted())) await navigator.storage.persist(); } } catch (e) {}
}

/* ---------- 탭 전환 ---------- */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('view-today').classList.toggle('hidden', tab !== 'today');
  document.getElementById('view-report').classList.toggle('hidden', tab !== 'report');
  document.getElementById('view-settings').classList.toggle('hidden', tab !== 'settings');
  if (tab === 'report') renderReport();
  if (tab === 'settings') renderSettings();
  if (tab === 'today') renderToday();
}

/* ---------- 언어/테마 적용 ---------- */
function applyTheme(themeKey) {
  document.documentElement.dataset.theme = themeKey || 'gold';
}
function applyStaticI18n() {
  document.documentElement.lang = curLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const html = el.getAttribute('data-i18n-html');
    if (html !== null) el.innerHTML = t(key); else el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))));
}

/* ---------- 온보딩 ---------- */
function initOnboarding() {
  applyStaticI18n();
  let intensity = 'invisible', interval = 60;
  renderIntensityOptions('ob-intensity-options', intensity, v => { intensity = v; });
  renderChipOptions('ob-interval-options', INTERVAL_OPTIONS.map(v => ({ value: v, label: `${v}${t('min_unit')}` })), interval, v => { interval = Number(v); });
  const btn = document.getElementById('ob-start-btn');
  btn.onclick = async () => {
    state.settings = {
      workStart: document.getElementById('ob-work-start').value || '09:00',
      workEnd: document.getElementById('ob-work-end').value || '18:00',
      lunchStart: document.getElementById('ob-lunch-start').value || '12:00',
      lunchEnd: document.getElementById('ob-lunch-end').value || '13:00',
      weightKg: Number(document.getElementById('ob-weight').value) || 65,
      intensity, interval, notifyEnabled: true,
      lang: curLang(), theme: state.settings ? state.settings.theme : 'gold',
      dietMissions: DEFAULT_MISSIONS.slice(), geminiKey: '', geminiModel: '',
    };
    state.onboarded = true; state.days = {}; saveState();
    document.getElementById('onboard-screen').classList.add('hidden');
    boot();
    try { if (await requestNotificationPermission()) armNotificationsForToday(); } catch (e) {}
  };
}

/* ---------- 매일 아침 부위 선택 ---------- */
let dailySelected = new Set();
function showDailyPicker() {
  applyStaticI18n();
  dailySelected = new Set();
  const wrap = document.getElementById('daily-parts');
  wrap.innerHTML = BODY_GROUPS.map(g => `
    <div class="part-group">
      <div class="pg-head"><div class="pg-title">${g.label[curLang()] || g.label.ko}</div><div class="pg-all" data-group="${g.key}">${t('daily_all')}</div></div>
      <div class="part-chips">${g.parts.map(p => `<div class="part-chip" data-part="${p.key}">${p.label[curLang()] || p.label.ko}</div>`).join('')}</div>
    </div>`).join('');
  wrap.querySelectorAll('.part-chip').forEach(chip => chip.addEventListener('click', () => {
    const k = chip.dataset.part;
    if (dailySelected.has(k)) { dailySelected.delete(k); chip.classList.remove('selected'); }
    else { dailySelected.add(k); chip.classList.add('selected'); }
  }));
  wrap.querySelectorAll('.pg-all').forEach(btn => btn.addEventListener('click', () => {
    const g = BODY_GROUPS.find(x => x.key === btn.dataset.group);
    const allSelected = g.parts.every(p => dailySelected.has(p.key));
    g.parts.forEach(p => {
      const chip = wrap.querySelector(`.part-chip[data-part="${p.key}"]`);
      if (allSelected) { dailySelected.delete(p.key); chip.classList.remove('selected'); }
      else { dailySelected.add(p.key); chip.classList.add('selected'); }
    });
  }));
  document.getElementById('daily-start-btn').onclick = () => {
    const parts = Array.from(dailySelected); const key = todayKey();
    state.days[key] = { parts, slots: generateSchedule(state.settings, parts), diet: { done: {}, condition: null } };
    saveState();
    document.getElementById('daily-screen').classList.add('hidden');
    renderToday(); switchTab('today'); armNotificationsForToday();
    showToast(parts.length ? t('t_made') : t('t_made_full'));
  };
  document.getElementById('daily-screen').classList.remove('hidden');
}

/* ---------- 이벤트 바인딩 ---------- */
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.getElementById('timer-close').addEventListener('click', closeTimer);
  document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('timer-skip').addEventListener('click', openSkipSheet);
  document.querySelectorAll('#skip-sheet .sheet-opt').forEach(o => o.addEventListener('click', () => applySkip(o.dataset.reason)));
  document.getElementById('skip-sheet').addEventListener('click', (e) => { if (e.target.id === 'skip-sheet') closeSkipSheet(); });
  document.getElementById('review-sheet').addEventListener('click', (e) => { if (e.target.id === 'review-sheet') closeReviewSheet(); });
  document.getElementById('btn-ai-eval').addEventListener('click', runAiEval);

  document.getElementById('setting-work-start').addEventListener('change', (e) => { state.settings.workStart = e.target.value; saveState(); });
  document.getElementById('setting-work-end').addEventListener('change', (e) => { state.settings.workEnd = e.target.value; saveState(); });
  document.getElementById('setting-lunch-start').addEventListener('change', (e) => { state.settings.lunchStart = e.target.value; saveState(); });
  document.getElementById('setting-lunch-end').addEventListener('change', (e) => { state.settings.lunchEnd = e.target.value; saveState(); });
  document.getElementById('setting-weight').addEventListener('change', (e) => { state.settings.weightKg = Number(e.target.value) || 65; saveState(); });
  const keyInput = document.getElementById('setting-gemini-key');
  const saveKey = (e, toast) => {
    const v = (e.target.value || '').trim();
    if (v === state.settings.geminiKey) return;
    state.settings.geminiKey = v;
    state.settings.geminiModel = '';   // 키가 바뀌면 모델을 다시 감지
    saveState();
    const mn = document.getElementById('gemini-model-name');
    if (mn) mn.textContent = t('model_auto');
    if (toast) showToast(t('t_key_saved'));
  };
  keyInput.addEventListener('input', (e) => saveKey(e, false));
  keyInput.addEventListener('change', (e) => saveKey(e, true));
  document.getElementById('gemini-test-btn').addEventListener('click', testGeminiConnection);
  document.getElementById('toggle-notify').addEventListener('click', async (e) => {
    const willEnable = !state.settings.notifyEnabled;
    if (willEnable) { if (!(await requestNotificationPermission())) { showToast(t('t_need_key')); return; } }
    state.settings.notifyEnabled = willEnable; saveState();
    e.currentTarget.classList.toggle('on', willEnable);
    if (willEnable) armNotificationsForToday();
  });
  document.getElementById('regenerate-btn').addEventListener('click', () => showDailyPicker());
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (e) => { importData(e.target.files && e.target.files[0]); e.target.value = ''; });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && timerState.running && !wakeLock) acquireWakeLock();
  });
}

/* ---------- 부팅 ---------- */
function boot() {
  applyTheme(state.settings ? state.settings.theme : 'gold');
  applyStaticI18n();
  if (!state.onboarded || !state.settings) { document.getElementById('onboard-screen').classList.remove('hidden'); initOnboarding(); return; }
  if (!state.days[todayKey()]) { showDailyPicker(); return; }
  renderToday(); switchTab('today'); armNotificationsForToday();
}

let swRefreshing = false;
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || swRefreshing) return; swRefreshing = true; window.location.reload(); });
    swRegistration = await navigator.serviceWorker.register('sw.js');
    swRegistration.update().catch(() => {});
    navigator.serviceWorker.addEventListener('message', (event) => { if (event.data && event.data.type === 'OPEN_TIMER' && event.data.slotId) openTimer(event.data.slotId); });
  } catch (e) { console.warn('SW 등록 실패', e); }
}

window.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.settings ? state.settings.theme : 'gold');
  bindEvents();
  requestPersistentStorage();
  await registerSW();
  boot();
  setInterval(() => { if (!document.getElementById('view-today').classList.contains('hidden')) renderToday(); }, 60000);
});
