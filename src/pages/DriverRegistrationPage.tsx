import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, Upload, FileText, ShieldCheck, CheckCircle,
  Loader2, ArrowRight, ArrowLeft, Camera, X, AlertCircle, Building2, Car
} from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SubPageHeader from "@/components/SubPageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDriverVerification } from "@/hooks/useDriverVerification";
import { toast } from "@/hooks/use-toast";

const STEPS = ["기본 정보", "면허·사업자 정보", "서류 업로드", "제출 완료"];

const DOCUMENT_TYPES = [
  { key: "operation_permit", label: "응급환자이송업 허가증 사본", desc: "이미지 또는 PDF", icon: ShieldCheck },
  { key: "qualification", label: "응급구조사 자격증 / 운전면허증", desc: "이미지 또는 PDF", icon: FileText },
  { key: "vehicle_registration", label: "차량 등록증", desc: "이미지 또는 PDF", icon: Car },
];

const DriverRegistrationPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { verification, createVerification, uploadDocument, isLoading } = useDriverVerification();
  
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseType, setLicenseType] = useState("emt");
  const [experienceYears, setExperienceYears] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [vehicleRegNumber, setVehicleRegNumber] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Redirect if not authenticated
  if (!isAuthLoading && !isAuthenticated) {
    navigate("/login?mode=driver&returnTo=/driver-registration");
    return null;
  }

  // Show existing verification status
  if (verification) {
    const statusConfig: Record<string, { color: string; label: string; icon: typeof CheckCircle }> = {
      pending: { color: "text-warning", label: "검토 중", icon: Loader2 },
      approved: { color: "text-green-600", label: "인증 완료", icon: CheckCircle },
      rejected: { color: "text-destructive", label: "반려됨", icon: AlertCircle },
    };
    const status = statusConfig[verification.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SubPageHeader title="기사 인증" backTo="/driver-intro" />
        <main className="flex-1 flex flex-col items-center justify-center px-5 max-w-lg mx-auto w-full">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              verification.status === "approved" ? "bg-green-100 dark:bg-green-950/30" :
              verification.status === "rejected" ? "bg-red-100 dark:bg-red-950/30" :
              "bg-amber-100 dark:bg-amber-950/30"
            }`}>
              <StatusIcon className={`w-10 h-10 ${status.color} ${verification.status === "pending" ? "animate-spin" : ""}`} />
            </div>
            <h2 className="text-xl font-bold mb-2">{status.label}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {verification.status === "pending" && "서류가 제출되었습니다. 관리자 검토 후 승인됩니다."}
              {verification.status === "approved" && `인증이 완료되었습니다. 만료일: ${new Date(verification.expires_at!).toLocaleDateString("ko-KR")}`}
              {verification.status === "rejected" && `반려 사유: ${verification.rejection_reason || "사유 없음"}`}
            </p>
            <Button onClick={() => navigate("/driver")} className="rounded-2xl">
              대시보드로 이동
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleFileSelect = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "파일 크기가 10MB를 초과합니다", variant: "destructive" });
        return;
      }
      setFiles(prev => ({ ...prev, [docType]: file }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createVerification.mutateAsync({
        name, phone, licenseType, experienceYears,
        licenseNumber, businessRegNumber, vehicleRegNumber,
      });

      // Upload documents
      for (const [docType, file] of Object.entries(files)) {
        if (file) {
          await uploadDocument(result.id, docType, file);
        }
      }

      setStep(3);
      toast({ title: "인증 신청이 완료되었습니다!" });
    } catch (error) {
      toast({ title: "오류가 발생했습니다", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep0 = name.trim() && phone.trim();
  const canProceedStep1 = licenseNumber.trim() && businessRegNumber.trim() && vehicleRegNumber.trim();
  const canProceedStep2 = Object.keys(files).length >= 2;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="기사 인증 신청" backTo="/driver-intro" />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-1">기본 정보 입력</h2>
                <p className="text-sm text-muted-foreground">인증에 필요한 기본 정보를 입력해주세요</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="name" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} className="pl-10 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" placeholder="010-1234-5678" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>자격 유형</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "emt", label: "응급구조사" },
                      { value: "driver_license", label: "운전면허" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLicenseType(opt.value)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                          licenseType === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">경력 (년)</Label>
                  <Input id="experience" type="number" min={0} max={50} value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} className="rounded-xl" />
                </div>
              </div>

              <Button onClick={() => setStep(1)} disabled={!canProceedStep0} className="w-full rounded-2xl py-6">
                다음 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: License & Business Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-1">면허·사업자 정보</h2>
                <p className="text-sm text-muted-foreground">응급환자이송업 관련 필수 정보를 입력해주세요</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">응급환자이송업 허가번호 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="licenseNumber"
                      placeholder="허가번호를 입력하세요"
                      value={licenseNumber}
                      onChange={e => setLicenseNumber(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">시·도지사가 발급한 응급환자이송업 허가번호</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessRegNumber">사업자등록번호 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="businessRegNumber"
                      placeholder="000-00-00000"
                      value={businessRegNumber}
                      onChange={e => setBusinessRegNumber(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleRegNumber">구급차 등록번호 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="vehicleRegNumber"
                      placeholder="12가 3456"
                      value={vehicleRegNumber}
                      onChange={e => setVehicleRegNumber(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-2xl py-6">
                  <ArrowLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="flex-1 rounded-2xl py-6">
                  다음 <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-1">서류 업로드</h2>
                <p className="text-sm text-muted-foreground">인증에 필요한 서류를 업로드해주세요 (최소 2개)</p>
              </div>

              <div className="space-y-3">
                {DOCUMENT_TYPES.map(doc => {
                  const file = files[doc.key];
                  const DocIcon = doc.icon;

                  return (
                    <div key={doc.key} className={`p-4 rounded-2xl border transition-colors ${
                      file ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                          <DocIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{doc.label}</p>
                          <p className="text-xs text-muted-foreground">{doc.desc}</p>
                        </div>
                        {file && (
                          <button onClick={() => setFiles(prev => { const n = { ...prev }; delete n[doc.key]; return n; })}>
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      {file ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate flex-1">{file.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {(file.size / 1024).toFixed(0)}KB
                          </Badge>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRefs.current[doc.key]?.click()}
                          className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          파일 선택 또는 촬영
                        </button>
                      )}

                      <input
                        ref={el => { fileInputRefs.current[doc.key] = el; }}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={e => handleFileSelect(doc.key, e)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-2xl py-6">
                  <ArrowLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button onClick={handleSubmit} disabled={!canProceedStep2 || isSubmitting} className="flex-1 rounded-2xl py-6">
                  {isSubmitting ? <AmbulanceLoader variant="inline" /> : <>제출하기 <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">신청이 완료되었습니다!</h2>
              <p className="text-sm text-muted-foreground mb-8">
                관리자 검토 후 인증이 승인됩니다.<br />
                승인까지 1~2 영업일이 소요될 수 있습니다.
              </p>
              <Button onClick={() => navigate("/driver")} className="rounded-2xl px-8">
                대시보드로 이동
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DriverRegistrationPage;
