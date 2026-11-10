import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_PPF_TERMS } from '../types/consent';

interface CreateConsentModalProps {
  ownerUid: string;
  onClose: () => void;
  onCreated: (newId: string) => void;
}

export default function CreateConsentModal({
  ownerUid,
  onClose,
  onCreated,
}: CreateConsentModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [workScope, setWorkScope] = useState('전체 PPF');
  const [notes, setNotes] = useState('');
  const [termsContent, setTermsContent] = useState(DEFAULT_PPF_TERMS);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = customerName.trim();
    const trimmedVehicle = vehicleModel.trim();
    const trimmedPlate = licensePlate.trim();
    const trimmedScope = workScope.trim();
    const trimmedTerms = termsContent.trim();

    if (!trimmedName || !trimmedVehicle || !trimmedPlate || !trimmedScope || trimmedTerms.length < 10) {
      setFormError('필수 항목을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const path = 'consents';

    try {
      const docRef = await addDoc(collection(db, path), {
        customerName: trimmedName.slice(0, 100),
        customerPhone: customerPhone.trim().slice(0, 30),
        vehicleModel: trimmedVehicle.slice(0, 100),
        licensePlate: trimmedPlate.slice(0, 30),
        workScope: trimmedScope.slice(0, 200),
        notes: notes.trim().slice(0, 1000),
        termsContent: trimmedTerms.slice(0, 10000),
        status: 'pending',
        ownerUid,
        createdAt: serverTimestamp(),
      });
      onCreated(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-consent-title"
    >
      <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 id="create-consent-title" className="text-base font-semibold text-neutral-900">
            새 PPF 작업 동의서 작성
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                고객명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                연락처
              </label>
              <input
                type="tel"
                maxLength={30}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                차량 모델 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="포르쉐 911 카레라"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                차량 번호 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="123가 4567"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              시공 부위 및 필름 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={workScope}
              onChange={(e) => setWorkScope(e.target.value)}
              placeholder="예: 전체 PPF / 프론트 패키지"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              특이사항 및 사전 안내 (선택)
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 앞범퍼 좌측 스톤칩 1건 사전 확인 완료"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              동의서 약관 내용 <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={8}
              required
              minLength={10}
              maxLength={10000}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              className="w-full px-3 py-2 text-xs leading-relaxed border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer"
            >
              {submitting ? '생성 중...' : '동의서 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
