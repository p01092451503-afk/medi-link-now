# Edge Function 환경변수 설정

## 필수 API 키

### PUBLIC_DATA_PORTAL_KEY (공공데이터포털 API 키)

```bash
supabase secrets set PUBLIC_DATA_PORTAL_KEY=<공공데이터포털_API_키>
```

#### 발급 방법

1. [공공데이터포털](https://data.go.kr) 접속 → 로그인
2. **마이페이지** → **API 키 확인**
3. 아래 서비스 활용 신청 후 **Encoding** 키 사용:
   - 서비스명: **국립중앙의료원\_응급의료기관 정보 조회 서비스 (B552657)**

> ⚠️ API 키는 반드시 **Encoding** 버전을 사용하세요. Decoding 키 사용 시 인증 오류가 발생합니다.

---

## 자동 갱신 스케줄러 (방법 B: 외부 크론)

클라이언트 폴링(방법 A)은 앱 내에 내장되어 있습니다 (5분 간격, visibility 제어 포함).

서버 측 자동 갱신을 위해 외부 크론 서비스를 설정할 수 있습니다:

### GitHub Actions 예시

`.github/workflows/sync-hospitals.yml`:

```yaml
name: Sync Hospital Data
on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call sync-hospitals Edge Function
        run: |
          curl -X POST \
            "https://<PROJECT_ID>.supabase.co/functions/v1/fetch-er-data" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer <ANON_KEY>" \
            -d '{"city": "서울특별시"}'
```

### Upstash QStash 예시

1. [Upstash Console](https://console.upstash.com) → QStash 생성
2. Destination URL: `https://<PROJECT_ID>.supabase.co/functions/v1/fetch-er-data`
3. Schedule: `*/5 * * * *`
4. Headers: `Authorization: Bearer <ANON_KEY>`, `Content-Type: application/json`
5. Body: `{"city": "서울특별시"}`

> 💡 `<PROJECT_ID>`와 `<ANON_KEY>`는 프로젝트 설정에서 확인하세요.
