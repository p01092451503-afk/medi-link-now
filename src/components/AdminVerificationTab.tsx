import { useState } from "react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import {
  ShieldCheck, ShieldX, Eye, CheckCircle, XCircle,
  FileText, Clock, User, Phone, Building2, Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminVerifications, VerificationDocument } from "@/hooks/useDriverVerification";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "대기 중", variant: "secondary" },
  approved: { label: "승인됨", variant: "default" },
  rejected: { label: "반려됨", variant: "destructive" },
};

const CHECKLIST_ITEMS = [
  { key: "license", label: "응급환자이송업 허가번호 확인" },
  { key: "business", label: "사업자등록번호 일치 확인" },
  { key: "vehicle", label: "차량 등록 확인" },
  { key: "docs", label: "서류 사본 육안 확인" },
] as const;

const AdminVerificationTab = () => {
  const {
    pendingVerifications,
    isLoading,
    getDocuments,
    getDocumentUrl,
    approveVerification,
    rejectVerification,
  } = useAdminVerifications();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>({});

  const selected = pendingVerifications.find(v => v.id === selectedId);

  const getChecklist = (id: string) => checklist[id] || {};
  const allChecked = (id: string) => CHECKLIST_ITEMS.every(item => getChecklist(id)[item.key]);

  const toggleCheck = (verId: string, key: string) => {
    setChecklist(prev => ({
      ...prev,
      [verId]: { ...(prev[verId] || {}), [key]: !(prev[verId]?.[key]) },
    }));
  };

  const handleViewDocs = async (verificationId: string) => {
    setSelectedId(verificationId);
    setIsLoadingDocs(true);
    try {
      const documents = await getDocuments(verificationId);
      setDocs(documents);
      const urls: Record<string, string> = {};
      for (const doc of documents) {
        const url = await getDocumentUrl(doc.file_path);
        if (url) urls[doc.id] = url;
      }
      setDocUrls(urls);
    } catch {
      setDocs([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleApprove = (id: string) => {
    approveVerification.mutate({ id });
    setSelectedId(null);
    setChecklist(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleReject = () => {
    if (rejectingId && rejectReason.trim()) {
      rejectVerification.mutate({ id: rejectingId, reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectingId(null);
      setSelectedId(null);
    }
  };

  const pendingCount = pendingVerifications.filter(v => v.status === "pending").length;

  if (isLoading) {
    return <AmbulanceLoader variant="section" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            기사 인증 관리
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} 대기</Badge>
            )}
          </CardTitle>
          <CardDescription>기사 인증 신청을 검토하고 승인/반려합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              인증 신청이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {pendingVerifications.map(v => {
                const badge = statusBadge[v.status] || statusBadge.pending;
                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      selectedId === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{v.driver_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {v.driver_phone}
                          </div>
                        </div>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    {/* License & Business Info */}
                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      <Badge variant="secondary">
                        {v.license_type === "emt" ? "응급구조사" : "운전면허"}
                      </Badge>
                      {v.experience_years && (
                        <Badge variant="secondary">{v.experience_years}년 경력</Badge>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ko })}
                      </div>
                    </div>

                    {/* Registration details */}
                    {(v.license_number || v.business_reg_number || v.vehicle_reg_number) && (
                      <div className="p-3 rounded-lg bg-muted/50 mb-3 space-y-1.5 text-xs">
                        {v.license_number && (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">허가번호:</span>
                            <span className="font-mono font-medium text-foreground">{v.license_number}</span>
                          </div>
                        )}
                        {v.business_reg_number && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">사업자번호:</span>
                            <span className="font-mono font-medium text-foreground">{v.business_reg_number}</span>
                          </div>
                        )}
                        {v.vehicle_reg_number && (
                          <div className="flex items-center gap-2">
                            <Car className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">차량번호:</span>
                            <span className="font-mono font-medium text-foreground">{v.vehicle_reg_number}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocs(v.id)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        서류 보기
                      </Button>
                      {v.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(v.id)}
                            disabled={approveVerification.isPending || !allChecked(v.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            승인
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { setRejectingId(v.id); setRejectDialogOpen(true); }}
                            className="flex-1"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            반려
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Verification Checklist */}
                    {v.status === "pending" && (
                      <div className="mt-4 pt-3 border-t space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">검증 체크리스트</p>
                        {CHECKLIST_ITEMS.map(item => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={!!getChecklist(v.id)[item.key]}
                              onCheckedChange={() => toggleCheck(v.id, item.key)}
                            />
                            <span className={getChecklist(v.id)[item.key] ? "text-foreground" : "text-muted-foreground"}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                        {!allChecked(v.id) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            모든 항목을 확인해야 승인할 수 있습니다
                          </p>
                        )}
                      </div>
                    )}

                    {/* Document Preview */}
                    {selectedId === v.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {isLoadingDocs ? (
                          <div className="flex items-center justify-center py-4">
                            <AmbulanceLoader variant="inline" />
                          </div>
                        ) : docs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">업로드된 서류가 없습니다</p>
                        ) : (
                          docs.map(doc => (
                            <div key={doc.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    {doc.document_type === "operation_permit" && "허가증 사본"}
                                    {doc.document_type === "qualification" && "자격증/면허증"}
                                    {doc.document_type === "vehicle_registration" && "차량 등록증"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">{doc.file_name}</span>
                              </div>
                              {docUrls[doc.id] && (
                                doc.file_name.toLowerCase().endsWith(".pdf") ? (
                                  <a
                                    href={docUrls[doc.id]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                  >
                                    PDF 열기 →
                                  </a>
                                ) : (
                                  <img
                                    src={docUrls[doc.id]}
                                    alt={doc.file_name}
                                    className="w-full rounded-lg border max-h-60 object-contain bg-white"
                                  />
                                )
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {v.rejection_reason && (
                      <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                        반려 사유: {v.rejection_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>인증 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">반려 사유를 입력해주세요:</p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="서류가 불분명하거나 유효기간이 만료되었습니다..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>취소</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectVerification.isPending}
            >
              {rejectVerification.isPending ? <AmbulanceLoader variant="inline" /> : "반려하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationTab;
