import { useNavigate } from "react-router-dom";
import SubPageHeader from "@/components/SubPageHeader";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="개인정보처리방침" />

      <main className="max-w-lg mx-auto px-5 py-8">
        <p className="text-xs text-muted-foreground mb-6">시행일: 2026년 1월 1일</p>

        {[
          { title: "제1조 (개인정보의 수집 및 이용 목적)", content: (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">파인더(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5">
                <li>서비스 제공: 응급실 정보 제공, 경로 안내, 가족 건강정보 관리</li>
                <li>회원 관리: 회원제 서비스 이용, 본인 확인, 불량회원 부정 이용 방지</li>
                <li>서비스 개선: 서비스 이용 통계, 신규 서비스 개발</li>
              </ul>
            </>
          )},
          { title: "제2조 (수집하는 개인정보 항목)", content: (
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5">
              <li><strong className="text-foreground">필수항목:</strong> 이메일 주소, 비밀번호</li>
              <li><strong className="text-foreground">선택항목:</strong> 이름, 연락처, 가족 건강정보</li>
              <li><strong className="text-foreground">자동수집항목:</strong> 위치정보, 기기정보, 접속 로그</li>
            </ul>
          )},
          { title: "제3조 (개인정보의 보유 및 이용 기간)", content: (
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5">
              <li>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.</li>
              <li>전자상거래법에 따른 계약/청약철회 기록: 5년</li>
              <li>통신비밀보호법에 따른 접속 로그: 3개월</li>
              <li>위치정보(이용자): 수집 후 1년</li>
              <li>위치정보(기사 운행기록): 운행 완료 후 6개월</li>
            </ul>
          )},
          { title: "제4조 (개인정보의 제3자 제공)", content: (
            <p className="text-sm text-muted-foreground leading-relaxed">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령에 의해 요구되는 경우에는 예외로 합니다.
            </p>
          )},
          { title: "제5조 (개인정보 처리의 위탁)", content: (
            <div className="bg-secondary rounded-2xl p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-foreground">수탁업체</th>
                    <th className="text-left py-2 font-medium text-foreground">위탁업무</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr><td className="py-2">클라우드 서비스 제공업체</td><td className="py-2">데이터 저장 및 관리</td></tr>
                </tbody>
              </table>
            </div>
          )},
          { title: "제6조 (이용자의 권리)", content: (
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5">
              <li>개인정보 열람, 정정, 삭제, 처리정지 요구권</li>
              <li>동의 철회권</li>
              <li>위 권리는 서비스 내 설정 또는 고객센터를 통해 행사할 수 있습니다.</li>
            </ul>
          )},
          { title: "제7조 (개인정보의 안전성 확보조치)", content: (
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5">
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 보안 시스템 구축</li>
              <li>개인정보 접근 권한 제한</li>
            </ul>
          )},
          { title: "제8조 (위치정보의 처리)", content: (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                서비스는 다음 목적으로 위치정보를 수집·이용합니다.
              </p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-5 mb-3">
                <li>주변 응급실 검색 및 경로 안내 (이용자)</li>
                <li>구급차 기사의 실시간 위치 추적 및 배차 (기사 회원)</li>
                <li>병원 방문 이력 분석을 통한 서비스 개선</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed">
                위치정보는 서비스 제공에 필요한 최소한으로 수집하며, 목적 달성 후 1년 이내 파기합니다. 기사 회원의 위치정보는 운행 완료 후 6개월 보관됩니다. 위치정보 수집을 원하지 않을 경우 기기 설정에서 위치 권한을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
              </p>
            </>
          )},
          { title: "제9조 (개인정보 보호책임자)", content: (
            <div className="bg-secondary rounded-2xl p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">개인정보 보호책임자</p>
              <p className="mt-1">이메일: privacy@find-er.kr</p>
            </div>
          )},
          { title: "제10조 (개인정보처리방침의 변경)", content: (
            <p className="text-sm text-muted-foreground leading-relaxed">
              본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 고지합니다.
            </p>
          )},
        ].map((section) => (
          <section key={section.title} className="mb-6">
            <h2 className="text-sm font-bold text-foreground mb-2">{section.title}</h2>
            {section.content}
          </section>
        ))}

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            본 개인정보처리방침에 대한 문의사항이 있으시면 개인정보 보호책임자에게 연락해 주시기 바랍니다.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
