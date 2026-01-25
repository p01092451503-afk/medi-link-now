import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { syncNationwideHospitals, getHospitalCount } from "@/services/hospitalDbService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const REGION_BATCHES = [
  { name: "수도권", regions: ["seoul", "incheon", "gyeonggi"] },
  { name: "영남권", regions: ["busan", "daegu", "ulsan", "gyeongbuk", "gyeongnam"] },
  { name: "호남권", regions: ["gwangju", "jeonbuk", "jeonnam"] },
  { name: "충청권", regions: ["daejeon", "sejong", "chungbuk", "chungnam"] },
  { name: "강원/제주", regions: ["gangwon", "jeju"] },
];

interface SyncResult {
  batchName: string;
  success: boolean;
  hospitalsFound?: number;
  hospitalsInserted?: number;
  durationMs?: number;
  error?: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SyncResult[]>([]);

  const { data: hospitalCount = 0, refetch: refetchCount } = useQuery({
    queryKey: ["hospital-count"],
    queryFn: getHospitalCount,
  });

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setProgress(0);
    setResults([]);

    const newResults: SyncResult[] = [];

    for (let i = 0; i < REGION_BATCHES.length; i++) {
      const batch = REGION_BATCHES[i];
      setCurrentBatch(batch.name);
      setProgress(((i) / REGION_BATCHES.length) * 100);

      try {
        const result = await syncNationwideHospitals(batch.regions);
        
        newResults.push({
          batchName: batch.name,
          success: result.success,
          hospitalsFound: result.stats?.hospitalsFound,
          hospitalsInserted: result.stats?.hospitalsInserted,
          durationMs: result.stats?.durationMs,
          error: result.error,
        });
      } catch (error) {
        newResults.push({
          batchName: batch.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      setResults([...newResults]);
    }

    setProgress(100);
    setCurrentBatch(null);
    setIsSyncing(false);

    // Refresh hospital count and invalidate queries
    await refetchCount();
    queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    queryClient.invalidateQueries({ queryKey: ["realtime-hospitals"] });

    const successCount = newResults.filter(r => r.success).length;
    const totalHospitals = newResults.reduce((acc, r) => acc + (r.hospitalsInserted || 0), 0);

    toast({
      title: "동기화 완료",
      description: `${successCount}/${REGION_BATCHES.length} 배치 성공, 총 ${totalHospitals}개 병원 동기화`,
    });
  };

  const handleSyncBatch = async (batch: { name: string; regions: string[] }) => {
    setIsSyncing(true);
    setCurrentBatch(batch.name);

    try {
      const result = await syncNationwideHospitals(batch.regions);
      
      if (result.success) {
        toast({
          title: `${batch.name} 동기화 완료`,
          description: `${result.stats?.hospitalsInserted}개 병원 동기화 (${result.stats?.durationMs}ms)`,
        });
      } else {
        toast({
          title: "동기화 실패",
          description: result.error,
          variant: "destructive",
        });
      }

      await refetchCount();
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    } catch (error) {
      toast({
        title: "동기화 오류",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setCurrentBatch(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center gap-4 h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">관리자 페이지</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터베이스 현황
            </CardTitle>
            <CardDescription>현재 저장된 병원 데이터 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{hospitalCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">등록된 병원 수</p>
              </div>
              <Button
                onClick={handleSyncAll}
                disabled={isSyncing}
                size="lg"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    전체 동기화
                  </>
                )}
              </Button>
            </div>

            {isSyncing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentBatch} 처리 중...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Batch Cards */}
        <Card>
          <CardHeader>
            <CardTitle>지역별 동기화</CardTitle>
            <CardDescription>개별 지역 배치를 선택하여 동기화</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REGION_BATCHES.map((batch) => {
                const result = results.find(r => r.batchName === batch.name);
                const isCurrentBatch = currentBatch === batch.name;

                return (
                  <Card key={batch.name} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{batch.name}</h3>
                        {result && (
                          result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {batch.regions.map(r => (
                          <Badge key={r} variant="secondary" className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>

                      {result && result.success && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {result.hospitalsInserted}개 병원 ({result.durationMs}ms)
                        </p>
                      )}

                      {result && !result.success && (
                        <p className="text-xs text-destructive mb-2">
                          {result.error}
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isSyncing}
                        onClick={() => handleSyncBatch(batch)}
                      >
                        {isCurrentBatch ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            처리 중
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            동기화
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>동기화 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{result.batchName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.success ? (
                        <span>
                          {result.hospitalsInserted}개 병원 · {result.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-destructive">{result.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
