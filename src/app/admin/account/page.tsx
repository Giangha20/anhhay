'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export default function AdminAccountPage() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Username change state
  const [authPasswordForUser, setAuthPasswordForUser] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage(null);

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
      setPwdLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPwdMessage({
          type: 'success',
          text: 'Đổi mật khẩu thành công! Các phiên đăng nhập cũ đã được thu hồi an toàn.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMessage({ type: 'error', text: data.error || 'Đổi mật khẩu thất bại' });
      }
    } catch {
      setPwdMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage(null);

    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: authPasswordForUser,
          newUsername,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUserMessage({
          type: 'success',
          text: `Đã đổi tên đăng nhập thành "${data.username}". Hãy ghi nhớ tên đăng nhập mới cho lần sau!`,
        });
        setAuthPasswordForUser('');
        setNewUsername('');
      } else {
        setUserMessage({ type: 'error', text: data.error || 'Đổi tên đăng nhập thất bại' });
      }
    } catch {
      setUserMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Quản lý tài khoản quản trị
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bảo mật thông tin đăng nhập máy chủ, đổi mật khẩu và đổi tên người quản trị
        </p>
      </div>

      {/* Form 1: Đổi mật khẩu */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <KeyRound className="w-5 h-5 text-emerald-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Đổi mật khẩu quản trị
            </h2>
            <p className="text-xs text-slate-500">
              Mật khẩu mới sẽ được băm bằng thuật toán Bcrypt 12 rounds an toàn.
            </p>
          </div>
        </div>

        {pwdMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              pwdMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
            }`}
          >
            {pwdMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{pwdMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu bạn đang dùng"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {pwdLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Cập nhật mật khẩu</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Form 2: Đổi tên đăng nhập */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-emerald-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Đổi tên đăng nhập admin
            </h2>
            <p className="text-xs text-slate-500">
              Yêu cầu nhập mật khẩu hiện tại để xác thực chủ quyền tài khoản.
            </p>
          </div>
        </div>

        {userMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              userMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
            }`}
          >
            {userMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{userMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Tên đăng nhập mới
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="VD: admin_chinh"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
              Mật khẩu hiện tại để xác thực
            </label>
            <input
              type="password"
              required
              value={authPasswordForUser}
              onChange={(e) => setAuthPasswordForUser(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={userLoading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {userLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu tên đăng nhập mới</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
