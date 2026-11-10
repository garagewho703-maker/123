import { useEffect, useMemo, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  LogOut,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ConsentForm } from '../types/consent';
import CreateConsentModal from './CreateConsentModal';
import CustomerConsentView from './CustomerConsentView';

interface AdminDashboardProps {
  user: User;
}

type StatusFilter = 'all' | 'pending' | 'agreed';

function formatDate(ts: ConsentForm['createdAt'] | ConsentForm['agreedAt']): string {
  if (!ts) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts.toDate());
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [consents, setConsents] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const path = 'consents';
    const isAdminUser = user.email === 'garagewho703@gmail.com' && user.emailVerified;
    const q = isAdminUser
      ? query(collection(db, path), orderBy('createdAt', 'desc'))
      : query(
          collection(db, path),
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ConsentForm[];
        setConsents(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const total = consents.length;
    const agreed = consents.filter((c) => c.status === 'agreed').length;
    const pending = total - agreed;
    return { total, agreed, pending };
  }, [consents]);

  const filteredConsents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return consents.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!q) return true;
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.vehicleModel.toLowerCase().includes(q) ||
        item.licensePlate.toLowerCase().includes(q) ||
        item.workScope.toLowerCase().includes(q)
      );
    });
  }, [consents, filter, searchQuery]);

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/?id=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const path = `consents/${id}`;
    try {
      await deleteDoc(doc(db, 'consents', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (previewId) {
    return (
      <CustomerConsentView
        consentId={previewId}
        isPreview
        onBackToAdmin={() => setPreviewId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <span className="text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0">
            PPF 작업 동의서
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              새 동의서 작성
            </button>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-xs font-medium text-neutral-500">전체 동의서</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-xs font-medium text-neutral-500">동의 완료</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
              {stats.agreed}
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <p className="text-xs font-medium text-neutral-500">고객 확인 대기중</p>
            <p className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
              {stats.pending}
            </p>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start">
              {(
                [
                  { key: 'all', label: '전체' },
                  { key: 'pending', label: '대기중' },
                  { key: 'agreed', label: '동의완료' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab.key
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="고객명, 차량 모델, 차량번호 검색"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              <div className="h-10 bg-neutral-100 rounded" />
              <div className="h-10 bg-neutral-100 rounded" />
              <div className="h-10 bg-neutral-100 rounded" />
            </div>
          ) : filteredConsents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-medium text-neutral-900">
                {consents.length === 0
                  ? '아직 작성된 작업 동의서가 없습니다.'
                  : '검색 조건에 맞는 동의서가 없습니다.'}
              </p>
              <p className="text-xs text-neutral-500">
                새 동의서를 작성하고 고객에게 링크를 공유해 보세요.
              </p>
              {consents.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  첫 동의서 작성하기
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500">
                    <th className="py-3 px-4 sm:px-6">고객명</th>
                    <th className="py-3 px-4">차량 정보</th>
                    <th className="py-3 px-4">시공 부위</th>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">생성 / 동의 일시</th>
                    <th className="py-3 px-4 sm:px-6 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {filteredConsents.map((item) => {
                    const isAgreed = item.status === 'agreed';
                    const isCopied = copiedId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-neutral-900">{item.customerName}</div>
                          {item.customerPhone && (
                            <div className="text-xs text-neutral-500 font-mono tabular-nums mt-0.5">
                              {item.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-neutral-900">{item.vehicleModel}</div>
                          <div className="text-xs text-neutral-500 font-mono tabular-nums mt-0.5">
                            {item.licensePlate}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-700">{item.workScope}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAgreed ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              동의완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <Clock className="w-4 h-4 text-amber-600" />
                              대기중
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-500 font-mono tabular-nums whitespace-nowrap">
                          <div>생성: {formatDate(item.createdAt)}</div>
                          {item.agreedAt && (
                            <div className="text-emerald-700 mt-0.5">
                              동의: {formatDate(item.agreedAt)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
                              title="고객 동의 링크 복사"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">복사됨</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>링크 복사</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewId(item.id)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                              title="동의서 보기"
                              aria-label="동의서 보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="삭제"
                              aria-label="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <CreateConsentModal
          ownerUid={user.uid}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newId) => {
            setShowCreateModal(false);
            handleCopyLink(newId);
          }}
        />
      )}
    </div>
  );
}
