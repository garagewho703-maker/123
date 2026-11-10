import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle2, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ConsentForm } from '../types/consent';

interface CustomerConsentViewProps {
  consentId: string;
  isPreview?: boolean;
  onBackToAdmin?: () => void;
}

function formatDateTime(ts: ConsentForm['createdAt'] | ConsentForm['agreedAt']): string {
  if (!ts) return '-';
  const date = ts.toDate();
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function CustomerConsentView({
  consentId,
  isPreview = false,
  onBackToAdmin,
}: CustomerConsentViewProps) {
  const [consent, setConsent] = useState<ConsentForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchConsent() {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'consents', consentId);
        const snap = await getDoc(docRef);
        if (!active) return;
        if (!snap.exists()) {
          setError('요청하신 작업 동의서를 찾을 수 없습니다.');
          setConsent(null);
        } else {
          setConsent({ id: snap.id, ...snap.data() } as ConsentForm);
        }
      } catch (err) {
        if (!active) return;
        setError('동의서를 불러오는 중 오류가 발생했습니다.');
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchConsent();
    return () => {
      active = false;
    };
  }, [consentId]);

  const handleAgree = async () => {
    if (!consent || consent.status === 'agreed' || submitting) return;
    setSubmitting(true);
    const path = `consents/${consent.id}`;
    try {
      await updateDoc(doc(db, 'consents', consent.id), {
        status: 'agreed',
        agreedAt: serverTimestamp(),
      });
      const updatedSnap = await getDoc(doc(db, 'consents', consent.id));
      if (updatedSnap.exists()) {
        setConsent({ id: updatedSnap.id, ...updatedSnap.data() } as ConsentForm);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-neutral-100 rounded" />
            <div className="h-12 bg-neutral-100 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-neutral-100 rounded w-full" />
            <div className="h-4 bg-neutral-100 rounded w-5/6" />
            <div className="h-4 bg-neutral-100 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !consent) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-lg font-semibold text-neutral-900">동의서 확인 불가</h1>
          <p className="text-sm text-neutral-600">{error || '유효하지 않은 링크입니다.'}</p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              관리자 목록으로 돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAgreed = consent.status === 'agreed';

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {isPreview && onBackToAdmin && (
          <div className="flex items-center justify-between bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-sm">
            <span>관리자 미리보기 모드</span>
            <button
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 text-neutral-200 hover:text-white font-medium whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </button>
          </div>
        )}

        <main className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-6 py-6 sm:px-8 border-b border-neutral-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span>PPF 시공 작업 동의서</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{formatDateTime(consent.createdAt)}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  차량 보호 필름(PPF) 작업 동의서
                </h1>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 sm:px-8 bg-neutral-50/60 border-b border-neutral-200">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500 mb-0.5">고객명</dt>
                <dd className="font-semibold text-neutral-900">{consent.customerName}</dd>
              </div>
              {consent.customerPhone && (
                <div>
                  <dt className="text-xs text-neutral-500 mb-0.5">연락처</dt>
                  <dd className="font-mono tabular-nums text-neutral-900">{consent.customerPhone}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-neutral-500 mb-0.5">차량 모델</dt>
                <dd className="font-semibold text-neutral-900">{consent.vehicleModel}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500 mb-0.5">차량 번호</dt>
                <dd className="font-mono tabular-nums font-medium text-neutral-900">
                  {consent.licensePlate}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-neutral-500 mb-0.5">시공 부위 및 필름</dt>
                <dd className="font-medium text-neutral-900">{consent.workScope}</dd>
              </div>
              {consent.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-neutral-500 mb-0.5">특이사항 및 사전 안내</dt>
                  <dd className="text-neutral-700 whitespace-pre-wrap">{consent.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="px-6 py-6 sm:px-8 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">작업 안내 및 동의 약관</h2>
            <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {consent.termsContent}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 bg-white">
            {isAgreed ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      작업 동의가 완료되었습니다
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      동의 일시:{' '}
                      <span className="font-mono tabular-nums">
                        {formatDateTime(consent.agreedAt)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 text-center">
                  위 작업 내용 및 유의사항을 모두 확인하신 후 아래 버튼을 눌러 동의를 완료해 주세요.
                </p>
                <button
                  type="button"
                  onClick={handleAgree}
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 cursor-pointer"
                >
                  {submitting ? '동의 처리 중...' : '위 내용을 모두 확인하였으며 작업에 동의합니다'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
