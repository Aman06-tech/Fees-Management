'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { settingsService } from '@/lib/services';

interface Settings {
  id?: string;
  institution_name: string;
  institution_address: string;
  contact_number: string;
  email_address: string;
  academic_year: string;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  payment_reminders_enabled: boolean;
  late_fee_alerts_enabled: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Settings>({
    institution_name: '',
    institution_address: '',
    contact_number: '',
    email_address: '',
    academic_year: '',
    email_notifications_enabled: true,
    sms_notifications_enabled: true,
    payment_reminders_enabled: false,
    late_fee_alerts_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setToast(null);
      await settingsService.updateSettings(settings);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleChange = (field: keyof Settings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Tabs Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardBody className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter institution name"
                      value={settings.institution_name}
                      onChange={(e) => handleInputChange('institution_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Address
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      rows={3}
                      placeholder="Enter address"
                      value={settings.institution_address}
                      onChange={(e) => handleInputChange('institution_address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="Enter contact number"
                        value={settings.contact_number}
                        onChange={(e) => handleInputChange('contact_number', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        value={settings.email_address}
                        onChange={(e) => handleInputChange('email_address', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 2024-2025"
                      value={settings.academic_year}
                      onChange={(e) => handleInputChange('academic_year', e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="ghost" onClick={fetchSettings}>Cancel</Button>
                    <Button onClick={handleSaveSettings} isLoading={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <Button size="sm" onClick={() => alert('Add User functionality - Coming soon')}>Add User</Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { name: 'Admin User', email: 'admin@school.com', role: 'Admin' },
                      { name: 'John Accountant', email: 'accountant@school.com', role: 'Accountant' }
                    ].map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button variant="ghost" size="sm" className="mr-2" onClick={() => alert(`Edit user: ${user.name} - Coming soon`)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => confirm('Delete this user?') && alert(`Delete user: ${user.name} - Coming soon`)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {[
                    { key: 'email_notifications_enabled', title: 'Email Notifications', description: 'Send email notifications for payments and reminders' },
                    { key: 'sms_notifications_enabled', title: 'SMS Notifications', description: 'Send SMS alerts for important updates' },
                    { key: 'payment_reminders_enabled', title: 'Payment Reminders', description: 'Automatic reminders for due payments' },
                    { key: 'late_fee_alerts_enabled', title: 'Late Fee Alerts', description: 'Notify when late fees are applied' }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{setting.title}</p>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings[setting.key as keyof Settings] as boolean}
                          onChange={() => handleToggleChange(setting.key as keyof Settings)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                  <Button variant="ghost" onClick={fetchSettings}>Cancel</Button>
                  <Button onClick={handleSaveSettings} isLoading={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
