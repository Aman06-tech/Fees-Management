'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'fees', name: 'Fee Types', icon: '💰' },
    { id: 'classes', name: 'Classes', icon: '🏫' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="space-y-6">
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
                      defaultValue="ABC School"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Address
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="Enter address"
                      defaultValue="123 Main Street, City, State - 123456"
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
                        defaultValue="1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        defaultValue="info@school.com"
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
                      defaultValue="2024-2025"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="ghost" onClick={() => alert('Changes cancelled')}>Cancel</Button>
                    <Button onClick={() => alert('Settings saved successfully!')}>Save Changes</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'fees' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Fee Types</h2>
                  <Button size="sm" onClick={() => alert('Add Fee Type functionality')}>Add Fee Type</Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200">
                  {['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Sports Fee'].map((fee, index) => (
                    <div key={index} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fee}</p>
                        <p className="text-xs text-gray-500">Recurring fee</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => alert(`Edit ${fee}`)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => confirm('Delete this fee type?') && alert(`Deleted ${fee}`)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'classes' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Classes & Sections</h2>
                  <Button size="sm" onClick={() => alert('Add Class functionality')}>Add Class</Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((classNum) => (
                    <div key={classNum} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Class {classNum}</p>
                        <p className="text-xs text-gray-500">Sections: A, B, C</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => alert(`Edit Class ${classNum}`)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => alert(`Manage sections for Class ${classNum}`)}>Manage Sections</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <Button size="sm" onClick={() => alert('Add User functionality')}>Add User</Button>
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
                          <Button variant="ghost" size="sm" className="mr-2" onClick={() => alert(`Edit user: ${user.name}`)}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => confirm('Delete this user?') && alert(`Deleted user: ${user.name}`)}>Delete</Button>
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
                    { title: 'Email Notifications', description: 'Send email notifications for payments and reminders' },
                    { title: 'SMS Notifications', description: 'Send SMS alerts for important updates' },
                    { title: 'Payment Reminders', description: 'Automatic reminders for due payments' },
                    { title: 'Late Fee Alerts', description: 'Notify when late fees are applied' }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{setting.title}</p>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
