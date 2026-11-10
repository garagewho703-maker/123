/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { FileText } from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import AdminDashboard from './components/AdminDashboard';
import CustomerConsentView from './components/CustomerConsentView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const consentId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (consentId) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [consentId]);

  if (consentId) {
    return <CustomerConsentView consentId={consentId} />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const handleLogin = async () => {
      setLoginError(null);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        setLoginError('로그인에 실패했습니다. 팝업 차단을 해제한 뒤 다시 시도해 주세요.');
        console.error(err);
      }
    };

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-6">
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-neutral-900" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-neutral-900">PPF 작업 동의서 관리</h1>
            <p className="text-sm text-neutral-500">
              동의서 작성 및 전체 내역 확인을 위해 로그인해 주세요.
            </p>
          </div>
          {loginError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {loginError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Google 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard user={user} />;
}
