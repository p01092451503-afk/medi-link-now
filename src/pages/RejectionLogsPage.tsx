import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Clock,
  Building2,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRejectionLogs, REJECTION_REASONS, type RejectionLog } from "@/hooks/useRejectionLogs";
import { cleanHospitalName } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const RejectionLogsPage = () => {
  const navigate = useNavigate();
  const { logs, isLoading } = useRejectionLogs();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setUserRole(roleData?.role || null);
      setIsCheckingRole(false);

      if (roleData?.role !== "driver") {
        toast({
          title: "접근 권한 없음",
          description: "구급대원만 접근할 수 있습니다.",
          variant: "destructive",
        });
        navigate("/");
      }
    };
    checkAccess();
  }, [navigate]);

  // Filter today's logs
  const todayLogs = logs.filter((log) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(log.recorded_at) >= today;
  });

  const getRejectionReasonLabel = (reasonId: string) => {
    const reason = REJECTION_REASONS.find((r) => r.id === reasonId);
    return reason ? `${reason.icon} ${reason.label}` : reasonId;
  };

  const getRejectionReasonIcon = (reasonId: string) => {
    const reason = REJECTION_REASONS.find((r) => r.id === reasonId);
    return reason?.icon || "❓";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const exportDailyReport = () => {
    if (todayLogs.length === 0) {
      toast({
        title: "내보낼 기록이 없습니다",
        description: "오늘의 거절 이력이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(200, 50, 50);
    doc.text("Rejection Blackbox Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Hospital Rejection Evidence Log", 105, 28, { align: "center" });

    // Date
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Date: ${dateStr}`, 105, 38, { align: "center" });

    // Summary box
    doc.setFillColor(255, 245, 245);
    doc.roundedRect(14, 45, 182, 20, 3, 3, "F");
    doc.setFontSize(10);
    doc.setTextColor(200, 50, 50);
    doc.text(`Total Rejections: ${todayLogs.length}`, 20, 57);

    // Count by reason
    const reasonCounts = todayLogs.reduce(
      (acc, log) => {
        const label =
          REJECTION_REASONS.find((r) => r.id === log.rejection_reason)?.label ||
          log.rejection_reason;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const reasonSummary = Object.entries(reasonCounts)
      .map(([reason, count]) => `${reason}(${count})`)
      .join(", ");
    doc.setTextColor(100, 100, 100);
    doc.text(`Breakdown: ${reasonSummary}`, 20, 62);

    // Table
    const tableData = todayLogs.map((log) => [
      formatTime(log.recorded_at),
      cleanHospitalName(log.hospital_name),
      REJECTION_REASONS.find((r) => r.id === log.rejection_reason)?.label ||
        log.rejection_reason,
      log.notes || "-",
    ]);

    autoTable(doc, {
      startY: 72,
      head: [["Time", "Hospital", "Rejection Reason", "Notes"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [200, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      bodyStyles: {
        halign: "center",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [255, 248, 248],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated: ${new Date().toLocaleString("ko-KR")} | Page ${i}/${pageCount}`,
        105,
        285,
        { align: "center" }
      );
      doc.text(
        "Find-ER Rejection Blackbox - Legal Evidence Document",
        105,
        290,
        { align: "center" }
      );
    }

    // File name with date
    const fileDate = today.toISOString().split("T")[0];
    doc.save(`Ambulance_Log_${fileDate}.pdf`);

    toast({
      title: "PDF 내보내기 완료",
      description: `${todayLogs.length}건의 거절 이력이 저장되었습니다`,
    });
  };

  if (isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Rejection Blackbox
              </h1>
              <p className="text-xs text-muted-foreground">
                거절 이력 증거 관리
              </p>
            </div>
          </div>
          <Button
            onClick={exportDailyReport}
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
          >
            <Download className="w-4 h-4 mr-1" />
            📄 일일 리포트
          </Button>
        </div>
      </header>

      {/* Today Summary */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl p-4 border border-red-200/50 dark:border-red-800/50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              오늘의 기록
            </h2>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-500">
                {todayLogs.length}
              </p>
              <p className="text-xs text-muted-foreground">거절 건수</p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {new Set(todayLogs.map((l) => l.hospital_name)).size}
              </p>
              <p className="text-xs text-muted-foreground">병원 수</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          </div>
        ) : todayLogs.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold text-foreground mb-1">
              오늘 거절 이력이 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              이송 요청 후 결과를 기록하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              타임라인
            </h3>
            {todayLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-200 dark:border-red-800 mt-4" />
                  {index < todayLogs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-red-200 dark:bg-red-800" />
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 mb-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-foreground">
                        {cleanHospitalName(log.hospital_name)}
                      </span>
                    </div>
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(log.recorded_at)}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                      {getRejectionReasonLabel(log.rejection_reason)}
                    </span>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pl-1">
                      📝 {log.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* All logs section (not just today) */}
        {logs.length > todayLogs.length && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              이전 기록 ({logs.length - todayLogs.length}건)
            </h3>
            <div className="space-y-2">
              {logs
                .filter((log) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return new Date(log.recorded_at) < today;
                })
                .slice(0, 10)
                .map((log) => (
                  <div
                    key={log.id}
                    className="bg-muted/50 rounded-xl p-3 flex items-center justify-between opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {getRejectionReasonIcon(log.rejection_reason)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {cleanHospitalName(log.hospital_name)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.recorded_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {REJECTION_REASONS.find(
                        (r) => r.id === log.rejection_reason
                      )?.label || log.rejection_reason}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectionLogsPage;
