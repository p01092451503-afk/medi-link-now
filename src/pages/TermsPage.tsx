import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
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
          <h1 className="text-lg font-semibold">이용약관</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground text-sm mb-6">
            시행일: 2026년 1월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제1조 (목적)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              본 약관은 Medi-Link(이하 "서비스")가 제공하는 응급 의료 정보 서비스의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제2조 (정의)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>"서비스"란 회사가 제공하는 실시간 응급실 병상 정보, 병원 검색, 경로 안내 등의 서비스를 말합니다.</li>
              <li>"이용자"란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
              <li>"회원"이란 서비스에 가입하여 계정을 보유한 이용자를 말합니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제3조 (서비스의 제공)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>실시간 응급실 병상 현황 정보 제공</li>
              <li>주변 응급실 검색 및 경로 안내</li>
              <li>가족 건강정보 관리 기능</li>
              <li>기타 회사가 정하는 서비스</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제4조 (서비스 이용의 제한)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              본 서비스는 정보 제공 목적으로만 사용되며, 의료적 진단이나 치료를 대체하지 않습니다. 
              응급 상황 시에는 반드시 119에 신고하시기 바랍니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제5조 (면책조항)</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>서비스에서 제공하는 정보는 실시간으로 변동될 수 있으며, 정확성을 보장하지 않습니다.</li>
              <li>이용자가 서비스를 통해 얻은 정보로 인한 손해에 대해 회사는 책임을 지지 않습니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제6조 (개인정보 보호)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              회사는 이용자의 개인정보를 보호하기 위해 관련 법령에 따라 개인정보처리방침을 수립하여 
              운영합니다. 자세한 내용은 개인정보처리방침을 참조하시기 바랍니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제7조 (약관의 변경)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              회사는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 
              변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제8조 (관할법원)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              서비스 이용과 관련하여 발생한 분쟁에 대해서는 대한민국 법률을 적용하며, 
              관할법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
            </p>
          </section>

          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              본 약관에 대한 문의사항이 있으시면 서비스 내 고객센터를 통해 연락해 주시기 바랍니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
