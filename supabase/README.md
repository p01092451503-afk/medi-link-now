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
