import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">개인정보처리방침</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground text-sm mb-6">
            시행일: 2026년 1월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제1조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              find-ER(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>서비스 제공: 응급실 정보 제공, 경로 안내, 가족 건강정보 관리</li>
              <li>회원 관리: 회원제 서비스 이용, 본인 확인, 불량회원 부정 이용 방지</li>
              <li>서비스 개선: 서비스 이용 통계, 신규 서비스 개발</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제2조 (수집하는 개인정보 항목)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>필수항목:</strong> 이메일 주소, 비밀번호</li>
              <li><strong>선택항목:</strong> 이름, 연락처, 가족 건강정보(혈액형, 알레르기, 만성질환 등)</li>
              <li><strong>자동수집항목:</strong> 위치정보(서비스 이용 시), 기기정보, 접속 로그</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.</li>
              <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
              <li>전자상거래법에 따른 계약/청약철회 기록: 5년</li>
              <li>통신비밀보호법에 따른 접속 로그: 3개월</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 
              다만, 이용자의 동의가 있거나 법령에 의해 요구되는 경우에는 예외로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제5조 (개인정보 처리의 위탁)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.
            </p>
            <div className="mt-3 bg-muted/50 rounded-lg p-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">수탁업체</th>
                    <th className="text-left py-2 font-medium">위탁업무</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="py-2">클라우드 서비스 제공업체</td>
                    <td className="py-2">데이터 저장 및 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제6조 (이용자의 권리)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>개인정보 열람, 정정, 삭제, 처리정지 요구권</li>
              <li>동의 철회권</li>
              <li>위 권리는 서비스 내 설정 또는 고객센터를 통해 행사할 수 있습니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제7조 (개인정보의 안전성 확보조치)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 보안 시스템 구축</li>
              <li>개인정보 접근 권한 제한</li>
              <li>개인정보 취급 직원의 교육</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제8조 (위치정보의 처리)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              서비스는 주변 응급실 검색 및 경로 안내를 위해 위치정보를 수집합니다. 
              위치정보는 서비스 이용 시에만 일시적으로 사용되며, 별도로 저장하지 않습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제9조 (개인정보 보호책임자)</h2>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p><strong>개인정보 보호책임자</strong></p>
              <p className="mt-2">이메일: privacy@find-er.kr</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제10조 (개인정보처리방침의 변경)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 
              수정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 고지합니다.
            </p>
          </section>

          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              본 개인정보처리방침에 대한 문의사항이 있으시면 개인정보 보호책임자에게 연락해 주시기 바랍니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
