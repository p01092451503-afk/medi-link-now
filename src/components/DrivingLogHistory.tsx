import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Clock, Navigation, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DrivingLog } from "./DrivingLogWidget";

interface DrivingLogHistoryProps {
  logs: DrivingLog[];
  onDeleteLog?: (id: string) => void;
}

const DrivingLogHistory = ({ logs, onDeleteLog }: DrivingLogHistoryProps) => {
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

  const exportToPDF = () => {
    const logsToExport = selectedLogs.length > 0 
      ? logs.filter((log) => selectedLogs.includes(log.id))
      : logs;

    if (logsToExport.length === 0) {
      toast({
        title: "내보낼 운행 기록이 없습니다",
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
    
    // Date range
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const dateRange = `기간: ${logsToExport[logsToExport.length - 1]?.date} ~ ${logsToExport[0]?.date}`;
    doc.text(dateRange, 105, 38, { align: "center" });

    // Summary box
    const totalDistance = logsToExport.reduce((sum, log) => sum + log.distance, 0);
    const totalDuration = logsToExport.reduce((sum, log) => {
      const [startH, startM] = log.startTime.split(":").map(Number);
      const [endH, endM] = log.endTime.split(":").map(Number);
      return sum + ((endH * 60 + endM) - (startH * 60 + startM));
    }, 0);
    const totalHours = Math.floor(totalDuration / 60);
    const totalMins = totalDuration % 60;

    doc.setFillColor(240, 245, 255);
    doc.roundedRect(14, 45, 182, 25, 3, 3, "F");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`총 운행 횟수: ${logsToExport.length}건`, 25, 55);
    doc.text(`총 운행 거리: ${totalDistance.toFixed(1)}km`, 85, 55);
    doc.text(`총 운행 시간: ${totalHours}시간 ${totalMins}분`, 145, 55);

    // Table using autotable
    const tableData = logsToExport.map((log) => [
      log.date,
      log.startTime,
      log.endTime,
      `${log.distance}km`,
      log.patientName,
      log.startLocation.length > 20 ? log.startLocation.substring(0, 20) + "..." : log.startLocation
    ]);

    autoTable(doc, {
      startY: 78,
      head: [["날짜", "시작", "종료", "거리", "환자명", "출발지"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 85, 255],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 30 },
        5: { cellWidth: 62 },
      },
      margin: { left: 14, right: 14 },
    });

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
      doc.text("Medi-Link Pro - 자동 생성 운행일지", 105, 290, { align: "center" });
    }

    // Save
    const fileName = `운행일지_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "PDF 내보내기 완료",
      description: `${logsToExport.length}건의 운행 기록이 저장되었습니다`,
    });
  };

  const totalDistance = logs.reduce((sum, log) => sum + log.distance, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          운행 기록
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="text-xs"
          >
            {selectedLogs.length === logs.length ? "전체 해제" : "전체 선택"}
          </Button>
          <Button
            onClick={exportToPDF}
            size="sm"
            className="bg-primary"
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">총 운행</p>
            <p className="text-2xl font-bold text-foreground">{logs.length}건</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">총 거리</p>
            <p className="text-2xl font-bold text-primary">{totalDistance.toFixed(1)}km</p>
          </div>
        </div>
      </div>

      {/* Log List */}
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">운행 기록이 없습니다</p>
          <p className="text-xs mt-1">운행 시작 버튼을 눌러 기록을 시작하세요</p>
        </div>
      ) : (
        <div className="space-y-2">
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{log.date}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.startTime} - {log.endTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Navigation className="w-4 h-4" />
                      {log.distance}km
                    </div>
                    <span className="text-muted-foreground">{log.patientName}</span>
                  </div>
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
