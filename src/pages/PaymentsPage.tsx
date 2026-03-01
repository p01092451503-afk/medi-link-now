import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePayments } from "@/hooks/usePayments";
import { generateReceiptPdf } from "@/services/paymentService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Receipt,
  Download,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "결제완료", variant: "default" },
  pending: { label: "대기중", variant: "secondary" },
  deferred: { label: "이후결제", variant: "outline" },
  failed: { label: "실패", variant: "destructive" },
  refunded: { label: "환불", variant: "destructive" },
};

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { payments, isLoading, settlementStats } = usePayments();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("history");

  const handleDownloadReceipt = async (payment: any) => {
    try {
      const doc = await generateReceiptPdf({
        orderId: payment.order_id,
        amount: payment.amount,
        origin: payment.origin || "미입력",
        destination: payment.destination || "미입력",
        distanceKm: payment.distance_km || 0,
        vehicleType: payment.vehicle_type || "general",
        paymentMethod: payment.payment_method || "카드",
        createdAt: payment.created_at,
        platformFee: payment.platform_fee,
      });
      doc.save(`영수증_${payment.order_id}.pdf`);
      toast({ title: "다운로드 완료", description: "영수증이 저장되었습니다." });
    } catch {
      toast({ title: "오류", description: "영수증 생성에 실패했습니다.", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">로그인이 필요합니다.</p>
            <Button onClick={() => navigate("/login")}>로그인</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <h1 className="text-[15px] font-bold text-foreground">결제 내역</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-5 py-6 space-y-6 max-w-lg mx-auto">
        {/* Settlement Summary */}
        {settlementStats && (
          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">정산 현황</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">총 수입</p>
                  <p className="text-xl font-bold text-foreground">
                    ₩{settlementStats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">정산 대기</p>
                  <p className="text-xl font-bold text-primary">
                    ₩{settlementStats.pendingSettlement.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                <span>정산 완료: ₩{settlementStats.settledAmount.toLocaleString()}</span>
                <span>총 {settlementStats.totalTrips}건</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="history">
              <Receipt className="w-4 h-4 mr-1" />
              이용 내역
            </TabsTrigger>
            <TabsTrigger value="settlement">
              <FileText className="w-4 h-4 mr-1" />
              정산 내역
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">결제 내역이 없습니다.</div>
            ) : (
              payments.map((p) => {
                const status = STATUS_MAP[p.payment_status] || { label: p.payment_status, variant: "secondary" as const };
                return (
                  <Card key={p.id} className="bg-card border-border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant} className="text-[10px]">
                              {status.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(p.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {p.origin || "출발지"} → {p.destination || "목적지"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.distance_km ? `${p.distance_km}km · ` : ""}
                            {p.vehicle_type === "special" ? "특수 구급차" : "일반 구급차"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            ₩{p.amount.toLocaleString()}
                          </p>
                          {p.payment_method && (
                            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                              <CreditCard className="w-3 h-3" />
                              {p.payment_method}
                            </p>
                          )}
                        </div>
                      </div>
                      {p.payment_status === "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleDownloadReceipt(p)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          영수증 다운로드
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="settlement" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
            ) : (
              payments
                .filter((p) => p.payment_status === "paid")
                .map((p) => (
                  <Card key={p.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {p.destination || "목적지"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            ₩{p.driver_settlement.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 text-[10px]">
                            {p.settled ? (
                              <span className="text-primary flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> 정산완료
                              </span>
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> 정산대기
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PaymentsPage;
