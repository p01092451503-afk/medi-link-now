import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LiveReport } from "@/components/LiveReportFAB";
import { RealtimeChannel } from "@supabase/supabase-js";

const CHANNEL_NAME = "live_reports";
const REPORT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const useRealtimeReports = () => {
  const [reports, setReports] = useState<LiveReport[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Clean up expired reports
  const cleanupExpiredReports = useCallback(() => {
    const now = Date.now();
    setReports((prev) => 
      prev.filter((report) => now - new Date(report.timestamp).getTime() < REPORT_EXPIRY_MS)
    );
  }, []);

  // Add a new report
  const addReport = useCallback((report: LiveReport) => {
    // Add locally
    setReports((prev) => {
      // Avoid duplicates
      if (prev.some((r) => r.id === report.id)) return prev;
      return [...prev, report];
    });

    // Broadcast to others
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "new_report",
        payload: {
          ...report,
          timestamp: report.timestamp.toISOString(),
        },
      });
    }

    // Schedule removal
    setTimeout(() => {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }, REPORT_EXPIRY_MS);
  }, [channel]);

  useEffect(() => {
    // Create channel for realtime reports
    const reportsChannel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: { self: false }, // Don't receive our own broadcasts
      },
    });

    // Listen for new reports from other users
    reportsChannel
      .on("broadcast", { event: "new_report" }, ({ payload }) => {
        const report: LiveReport = {
          ...payload,
          timestamp: new Date(payload.timestamp),
        };
        
        setReports((prev) => {
          if (prev.some((r) => r.id === report.id)) return prev;
          return [...prev, report];
        });

        // Schedule removal
        setTimeout(() => {
          setReports((prev) => prev.filter((r) => r.id !== report.id));
        }, REPORT_EXPIRY_MS);
      })
      .subscribe();

    setChannel(reportsChannel);

    // Cleanup interval
    const cleanupInterval = setInterval(cleanupExpiredReports, 60000);

    return () => {
      clearInterval(cleanupInterval);
      supabase.removeChannel(reportsChannel);
    };
  }, [cleanupExpiredReports]);

  return {
    reports,
    addReport,
  };
};
