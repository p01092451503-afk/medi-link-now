import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar, 
  Navigation, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  Banknote,
  CreditCard,
  AlertCircle,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type DrivingLog } from "@/hooks/useDrivingLogs";
import { type RejectionLog, REJECTION_REASONS } from "@/hooks/useRejectionLogs";
import { cleanHospitalName } from "@/lib/utils";

interface DrivingLogHistoryProps {
  logs: DrivingLog[];
  rejectionLogs?: RejectionLog[];
  isLoading?: boolean;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDeleteLog?: (id: string) => void;
  stats: {
    totalTrips: number;
    totalDistance: number;
    totalDuration: number;
    totalRevenue?: number;
  };
}

const PAYMENT_METHOD_LABELS: Record<string, { label: string; color: string }> = {
  cash: { label: "현금", color: "text-green-600 bg-green-50" },
  card: { label: "카드", color: "text-blue-600 bg-blue-50" },
  transfer: { label: "이체", color: "text-purple-600 bg-purple-50" },
  unpaid: { label: "미수금", color: "text-red-600 bg-red-50" },
};

const DrivingLogHistory = ({ 
  logs, 
  rejectionLogs = [],
  isLoading,
  currentMonth,
  onMonthChange,
  onDeleteLog,
  stats 
}: DrivingLogHistoryProps) => {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const toggleLogSelection = (id: string) => {
    setSelectedLogs((prev) =>
      prev.includes(id) ? prev.filter((logId) => logId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map((log) => log.id));
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
  };

  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  // Filter rejection logs for current month
  const monthRejectionLogs = rejectionLogs.filter(log => {
    const logDate = new Date(log.recorded_at);
    return logDate.getFullYear() === currentMonth.getFullYear() && 
           logDate.getMonth() === currentMonth.getMonth();
  });

  const getRejectionReasonLabel = (reasonId: string) => {
    const reason = REJECTION_REASONS.find(r => r.id === reasonId);
    return reason ? reason.label : reasonId;
  };

  const exportToPDF = () => {
    const logsToExport = selectedLogs.length > 0 
      ? logs.filter((log) => selectedLogs.includes(log.id))
      : logs;

    if (logsToExport.length === 0 && monthRejectionLogs.length === 0) {
      toast({
        title: "내보낼 기록이 없습니다",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 85, 255);
    doc.text("운행일지", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Driving Log Report", 105, 28, { align: "center" });
    
    // Month info
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const monthStr = currentMonth.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
    doc.text(`기간: ${monthStr}`, 105, 38, { align: "center" });

    // Summary box
    const totalDistance = logsToExport.reduce((sum, log) => sum + log.distance_km, 0);
    const totalDuration = logsToExport.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalRevenue = logsToExport.reduce((sum, log) => sum + (log.revenue_amount || 0), 0);
    const totalHours = Math.floor(totalDuration / 60);
    const totalMins = totalDuration % 60;

    doc.setFillColor(240, 245, 255);
    doc.roundedRect(14, 45, 182, 30, 3, 3, "F");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`총 운행: ${logsToExport.length}건`, 20, 55);
    doc.text(`총 거리: ${totalDistance.toFixed(1)}km`, 60, 55);
    doc.text(`총 시간: ${totalHours}시간 ${totalMins}분`, 105, 55);
    doc.text(`총 매출: ₩${totalRevenue.toLocaleString()}`, 155, 55);
    
    // Rejection stats in summary
    doc.setTextColor(200, 50, 50);
    doc.text(`거부 이력: ${monthRejectionLogs.length}건`, 20, 67);
    
    // Count rejection reasons
    const rejectionStats = monthRejectionLogs.reduce((acc, log) => {
      acc[log.rejection_reason] = (acc[log.rejection_reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topReasons = Object.entries(rejectionStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => `${getRejectionReasonLabel(reason)}(${count})`)
      .join(", ");
    
    if (topReasons) {
      doc.setFontSize(9);
      doc.text(`주요 사유: ${topReasons}`, 60, 67);
    }

    // Driving Logs Table
    const getPaymentLabel = (method?: string) => {
      const labels: Record<string, string> = {
        cash: "현금",
        card: "카드",
        transfer: "이체",
        unpaid: "미수금",
      };
      return method ? labels[method] || method : "-";
    };

    let currentY = 85;

    if (logsToExport.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 85, 255);
      doc.text("운행 기록", 14, currentY);
      currentY += 5;

      const tableData = logsToExport.map((log) => [
        new Date(log.date).toLocaleDateString("ko-KR"),
        formatTime(log.start_time),
        formatTime(log.end_time),
        `${log.distance_km.toFixed(1)}km`,
        log.hospital_name ? cleanHospitalName(log.hospital_name) : "-",
        log.revenue_amount ? `₩${log.revenue_amount.toLocaleString()}` : "-",
        log.payment_method ? getPaymentLabel(log.payment_method) : "-"
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["날짜", "시작", "종료", "거리", "목적지", "요금", "결제"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [0, 85, 255],
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
          fillColor: [248, 250, 255],
        },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 20 },
          4: { cellWidth: 50 },
          5: { cellWidth: 28 },
          6: { cellWidth: 22 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Rejection Logs Table
    if (monthRejectionLogs.length > 0) {
      // Check if we need a new page
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(200, 50, 50);
      doc.text("거부 이력", 14, currentY);
      currentY += 5;

      const rejectionTableData = monthRejectionLogs.map((log) => [
        new Date(log.recorded_at).toLocaleDateString("ko-KR"),
        new Date(log.recorded_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        cleanHospitalName(log.hospital_name),
        getRejectionReasonLabel(log.rejection_reason),
        log.notes || "-"
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["날짜", "시간", "병원명", "거부 사유", "메모"]],
        body: rejectionTableData,
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
          fillColor: [255, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30 },
          4: { cellWidth: 56 },
        },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `생성일시: ${new Date().toLocaleString("ko-KR")} | 페이지 ${i}/${pageCount}`,
        105,
        285,
        { align: "center" }
      );
      doc.text("find-ER Pro - 자동 생성 운행일지", 105, 290, { align: "center" });
    }

    // Save
    const fileName = `운행일지_${currentMonth.getFullYear()}년${currentMonth.getMonth() + 1}월.pdf`;
    doc.save(fileName);
    
    toast({
      title: "PDF 내보내기 완료",
      description: `운행 ${logsToExport.length}건, 거부 ${monthRejectionLogs.length}건이 저장되었습니다`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          운행일지
        </h3>
        <Button
          onClick={exportToPDF}
          size="sm"
          className="bg-primary"
        >
          <Download className="w-4 h-4 mr-1" />
          PDF 내보내기
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {currentMonth.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">총 운행</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalTrips}건</p>
          </div>
          <div className="text-center border-x border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">총 거리</p>
            <p className="text-2xl font-bold text-primary">{stats.totalDistance.toFixed(1)}km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">총 시간</p>
            <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalDuration)}</p>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="text-xs"
          >
            {selectedLogs.length === logs.length ? "전체 해제" : "전체 선택"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedLogs.length > 0 ? `${selectedLogs.length}건 선택됨` : `총 ${logs.length}건`}
          </span>
        </div>
      )}

      {/* Log List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">운행 기록 로딩 중...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">이 달의 운행 기록이 없습니다</p>
          <p className="text-xs mt-1">이송 시작 버튼을 눌러 기록을 시작하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleLogSelection(log.id)}
              className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
                selectedLogs.includes(log.id)
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Date & Time Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(log.date)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(log.start_time)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{formatTime(log.end_time)}</span>
                </div>
              </div>
              
              {/* Route Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{log.start_location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{cleanHospitalName(log.hospital_name || log.end_location)}</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <Navigation className="w-4 h-4" />
                    {log.distance_km.toFixed(1)}km
                  </div>
                  {log.duration_minutes && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(log.duration_minutes)}
                    </span>
                  )}
                  {log.patient_name && (
                    <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                      {log.patient_name}
                    </span>
                  )}
                  {/* Revenue Info */}
                  {log.revenue_amount !== undefined && log.revenue_amount !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-foreground">
                        ₩{log.revenue_amount.toLocaleString()}
                      </span>
                      {log.payment_method && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          PAYMENT_METHOD_LABELS[log.payment_method]?.color || "text-gray-600 bg-gray-50"
                        }`}>
                          {PAYMENT_METHOD_LABELS[log.payment_method]?.label || log.payment_method}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {onDeleteLog && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLog(log.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DrivingLogHistory;
