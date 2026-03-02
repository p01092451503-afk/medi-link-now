## FIND-ER Supabase 설정 가이드

### Edge Function 환경변수 등록

터미널에서 아래 명령어를 실행하세요:

```bash
supabase secrets set PUBLIC_DATA_PORTAL_KEY=여기에_발급받은_API키_입력
```

### API 키 발급 방법

1. [공공데이터포털](https://www.data.go.kr) 접속 후 로그인
2. 상단 메뉴 → **마이페이지** → **인증키 발급/관리**
3. 활용 신청: **"응급의료기관 정보 조회 서비스 (제공기관: 국립중앙의료원)"**
   - 서비스 ID: `B552657`
4. 승인 후 **일반 인증키(Decoding)** 복사하여 위 명령어에 입력

### 등록 확인

```bash
supabase secrets list
```
