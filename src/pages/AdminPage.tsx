import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, RefreshCw, CheckCircle, AlertCircle, Loader2, BedDouble, Clock, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { syncNationwideHospitals, getHospitalCount } from "@/services/hospitalDbService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface RegionUpdateStatus {
  region: string;
  lastUpdated: string;
  hospitalCount: number;
}

const REGION_BATCHES = [
  { name: "수도권", regions: ["seoul", "incheon", "gyeonggi"] },
  { name: "영남권", regions: ["busan", "daegu", "ulsan", "gyeongbuk", "gyeongnam"] },
  { name: "호남권", regions: ["gwangju", "jeonbuk", "jeonnam"] },
  { name: "충청권", regions: ["daejeon", "sejong", "chungbuk", "chungnam"] },
  { name: "강원/제주", regions: ["gangwon", "jeju"] },
];

// City names for bed status API
const CITY_NAMES = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도", 
  "경상남도", "제주특별자치도"
];

interface SyncResult {
  batchName: string;
  success: boolean;
  hospitalsFound?: number;
  hospitalsInserted?: number;
  durationMs?: number;
  error?: string;
}

interface BedSyncResult {
  cityName: string;
  success: boolean;
  count?: number;
  error?: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: isAuthLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SyncResult[]>([]);
  
  // Bed sync states
  const [isSyncingBeds, setIsSyncingBeds] = useState(false);
  const [bedProgress, setBedProgress] = useState(0);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [bedResults, setBedResults] = useState<BedSyncResult[]>([]);

  // All hooks must be called before any conditional returns
  const { data: hospitalCount = 0, refetch: refetchCount } = useQuery({
    queryKey: ["hospital-count"],
    queryFn: getHospitalCount,
  });
  
  const { data: bedStatusCount = 0, refetch: refetchBedCount } = useQuery({
    queryKey: ["bed-status-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("hospital_status_cache")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });
  
  const { data: regionUpdateStatus = [], refetch: refetchRegionStatus } = useQuery({
    queryKey: ["region-update-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_status_cache")
        .select(`
          hospital_id,
          last_updated,
          hospitals!inner(region)
        `);
      
      if (error || !data) return [];
      
      const regionMap = new Map<string, { lastUpdated: string; count: number }>();
      
      data.forEach((item: any) => {
        const region = item.hospitals?.region || "Unknown";
        const current = regionMap.get(region);
        const itemDate = new Date(item.last_updated);
        
        if (!current) {
          regionMap.set(region, { lastUpdated: item.last_updated, count: 1 });
        } else {
          const currentDate = new Date(current.lastUpdated);
          if (itemDate > currentDate) {
            regionMap.set(region, { lastUpdated: item.last_updated, count: current.count + 1 });
          } else {
            regionMap.set(region, { ...current, count: current.count + 1 });
          }
        }
      });
      
      return Array.from(regionMap.entries()).map(([region, status]) => ({
        region,
        lastUpdated: status.lastUpdated,
        hospitalCount: status.count,
      })).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    },
    refetchInterval: 30000,
  });

  // Admin role guard
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate("/admin/login", { replace: true });
      return;
    }

    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (error || !data) {
          setIsAdmin(false);
          toast({
            title: "관리자 권한이 없습니다",
            description: "관리자 계정으로 다시 로그인해주세요.",
            variant: "destructive",
          });
          navigate("/admin/login", { replace: true });
        } else {
          setIsAdmin(true);
        }
      });
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  // Show loading while checking auth/role
  if (isAuthLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle bed status sync for all cities
  const handleSyncAllBeds = async () => {
    setIsSyncingBeds(true);
    setBedProgress(0);
    setBedResults([]);

    const newResults: BedSyncResult[] = [];

    for (let i = 0; i < CITY_NAMES.length; i++) {
      const city = CITY_NAMES[i];
      setCurrentCity(city);
      setBedProgress((i / CITY_NAMES.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke("fetch-er-data", {
          body: { city },
        });

        if (error) {
          newResults.push({ cityName: city, success: false, error: error.message });
        } else if (data?.success) {
          newResults.push({ cityName: city, success: true, count: data.count });
        } else {
          newResults.push({ cityName: city, success: false, error: data?.error || "Unknown error" });
        }
      } catch (error) {
        newResults.push({
          cityName: city,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      setBedResults([...newResults]);
    }

    setBedProgress(100);
    setCurrentCity(null);
    setIsSyncingBeds(false);
    
    await refetchBedCount();
    queryClient.invalidateQueries({ queryKey: ["realtime-hospitals"] });

    const successCount = newResults.filter(r => r.success).length;
    const totalBeds = newResults.reduce((acc, r) => acc + (r.count || 0), 0);

    toast({
      title: "병상 데이터 갱신 완료",
      description: `${successCount}/${CITY_NAMES.length} 지역 성공, 총 ${totalBeds}개 병원 병상 갱신`,
    });
  };

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
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">관리자 페이지</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="로그아웃">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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

        {/* Bed Status Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              실시간 병상 데이터
            </CardTitle>
            <CardDescription>전국 응급실 실시간 병상 현황 갱신</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{bedStatusCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">병상 데이터 보유 병원</p>
              </div>
              <Button
                onClick={handleSyncAllBeds}
                disabled={isSyncingBeds || isSyncing}
                size="lg"
                variant="secondary"
              >
                {isSyncingBeds ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    갱신 중...
                  </>
                ) : (
                  <>
                    <BedDouble className="h-4 w-4 mr-2" />
                    전국 병상 갱신
                  </>
                )}
              </Button>
            </div>

            {isSyncingBeds && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentCity} 처리 중...</span>
                  <span>{Math.round(bedProgress)}%</span>
                </div>
                <Progress value={bedProgress} className="bg-blue-100" />
              </div>
            )}

            {bedResults.length > 0 && !isSyncingBeds && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">마지막 갱신 결과</span>
                  <span className="font-medium">
                    {bedResults.filter(r => r.success).length}/{bedResults.length} 성공
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {bedResults.map((r, idx) => (
                    <Badge 
                      key={idx} 
                      variant={r.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {r.cityName.replace(/특별자치|광역|특별/, "").replace(/시|도/, "")}
                      {r.success && ` (${r.count})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Update Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              지역별 마지막 업데이트
            </CardTitle>
            <CardDescription>각 지역의 병상 데이터 갱신 시간 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {regionUpdateStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 갱신된 데이터가 없습니다
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {regionUpdateStatus.map((status) => {
                  const lastUpdatedDate = new Date(status.lastUpdated);
                  const now = new Date();
                  const diffMinutes = Math.floor((now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60));
                  
                  // Status color based on freshness
                  const isRecent = diffMinutes < 15;
                  const isStale = diffMinutes > 30;
                  
                  return (
                    <div 
                      key={status.region}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isRecent 
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
                          : isStale 
                            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                            : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${
                          isRecent ? "text-green-600" : isStale ? "text-amber-600" : "text-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{status.region}</p>
                          <p className="text-xs text-muted-foreground">
                            {status.hospitalCount}개 병원
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          isRecent ? "text-green-600" : isStale ? "text-amber-600" : "text-muted-foreground"
                        }`}>
                          {formatDistanceToNow(lastUpdatedDate, { addSuffix: true, locale: ko })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {lastUpdatedDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  15분 이내
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  15-30분
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  30분 이상
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetchRegionStatus()}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                새로고침
              </Button>
            </div>
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
