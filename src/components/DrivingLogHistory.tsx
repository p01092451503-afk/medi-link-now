import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Clock, Navigation, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
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
    doc.setFontSize(20);
    doc.text("운행일지 (Driving Log)", 105, 20, { align: "center" });
    
    // Date range
    doc.setFontSize(10);
    const dateRange = `${logsToExport[logsToExport.length - 1]?.date} ~ ${logsToExport[0]?.date}`;
    doc.text(dateRange, 105, 30, { align: "center" });

    // Table header
    let yPosition = 45;
    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPosition - 5, 182, 8, "F");
    doc.text("날짜", 20, yPosition);
    doc.text("시작", 45, yPosition);
    doc.text("종료", 70, yPosition);
    doc.text("거리(km)", 95, yPosition);
    doc.text("환자명", 125, yPosition);
    doc.text("출발지", 155, yPosition);

    yPosition += 10;

    // Table rows
    logsToExport.forEach((log, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, yPosition - 5, 182, 8, "F");
      }

      doc.text(log.date, 20, yPosition);
      doc.text(log.startTime, 45, yPosition);
      doc.text(log.endTime, 70, yPosition);
      doc.text(log.distance.toString(), 95, yPosition);
      doc.text(log.patientName.substring(0, 10), 125, yPosition);
      doc.text(log.startLocation.substring(0, 15), 155, yPosition);

      yPosition += 8;
    });

    // Summary
    yPosition += 10;
    doc.setFillColor(230, 240, 255);
    doc.rect(14, yPosition - 5, 182, 15, "F");
    doc.setFontSize(10);
    const totalDistance = logsToExport.reduce((sum, log) => sum + log.distance, 0);
    doc.text(`총 운행 횟수: ${logsToExport.length}건`, 20, yPosition);
    doc.text(`총 운행 거리: ${totalDistance.toFixed(1)}km`, 20, yPosition + 8);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`생성일시: ${new Date().toLocaleString("ko-KR")}`, 105, 285, { align: "center" });
    doc.text("Medi-Link Pro - 자동 생성 운행일지", 105, 290, { align: "center" });

    // Save
    doc.save(`운행일지_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.pdf`);
    
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
