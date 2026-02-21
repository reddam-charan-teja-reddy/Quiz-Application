import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  useGetProfileQuery,
  useEditProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useImportQuizMutation,
} from '../store/api/apiSlice';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [editProfile] = useEditProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [importQuiz] = useImportQuizMutation();

  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [keepQuizzes, setKeepQuizzes] = useState(true);

  if (profile && !profileLoaded) {
    setDisplayName(profile.display_name || '');
    setEmail(profile.email || '');
    setProfileLoaded(true);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await editProfile({ display_name: displayName, email }).unwrap();
      setToast({ message: 'Profile updated', type: 'success' });
    } catch (err) {
      setToast({ message: err.data?.detail || 'Failed to update profile', type: 'error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'warning' });
      return;
    }
    if (newPassword !== confirmNewPass) {
      setToast({ message: 'Passwords do not match', type: 'warning' });
      return;
    }
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPass('');
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.data?.detail || 'Failed to change password', type: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount({ password: deletePassword, keep_quizzes: keepQuizzes }).unwrap();
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      setToast({ message: err.data?.detail || 'Failed to delete account', type: 'error' });
    }
    setShowDeleteConfirm(false);
  };

  const handleImportQuiz = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importQuiz(data).unwrap();
      setToast({ message: 'Quiz imported successfully!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to import quiz — check file format', type: 'error' });
    }
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="settings-container">
        <Sidebar />
        <div className="settings-content">
          <LoadingSpinner text="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <Sidebar />
      <div className="settings-content">
        <h1>Settings</h1>

        <section className="settings-section">
          <h2>Profile</h2>
          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="form-group">
              <label>Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={100}
              />
            </div>
            <button type="submit" className="save-btn">Save Profile</button>
          </form>
        </section>

        <section className="settings-section">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPass}
                onChange={(e) => setConfirmNewPass(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="save-btn">Change Password</button>
          </form>
        </section>

        <section className="settings-section">
          <h2>Import Quiz</h2>
          <p className="section-desc">Import a quiz from a JSON file.</p>
          <label className="file-upload-btn">
            📥 Choose File
            <input type="file" accept=".json" onChange={handleImportQuiz} hidden />
          </label>
        </section>

        <section className="settings-section danger-zone">
          <h2>Danger Zone</h2>
          <p className="section-desc">
            Permanently delete your account. This action cannot be undone.
          </p>
          <button
            className="delete-account-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        </section>

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Your Account"
          message="This will permanently delete your account. Enter your password to confirm."
          confirmText="Delete My Account"
          variant="danger"
          loading={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        >
          <div className="delete-confirm-form">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={keepQuizzes}
                onChange={(e) => setKeepQuizzes(e.target.checked)}
              />
              Keep my quizzes public after deletion
            </label>
          </div>
        </ConfirmDialog>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
};

export default Settings;
