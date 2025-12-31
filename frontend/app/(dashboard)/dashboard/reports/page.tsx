'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { reportService, type DashboardStats, type CollectionReport, type OutstandingDue, type Defaulter } from '@/lib/services/reports';

type ActiveView = 'overview' | 'collection' | 'outstanding' | 'defaulters';

export default function ReportsPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [collectionReport, setCollectionReport] = useState<CollectionReport | null>(null);
  const [outstandingDues, setOutstandingDues] = useState<OutstandingDue[]>([]);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, collectionData, outstandingData, defaultersData] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getCollectionReport(),
        reportService.getOutstandingDues(),
        reportService.getDefaulters()
      ]);

      setStats(statsData);
      setCollectionReport(collectionData);
      setOutstandingDues(outstandingData);
      setDefaulters(defaultersData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      const data = await reportService.getCollectionReport(dateRange.start, dateRange.end);
      setCollectionReport(data);
      setActiveView('collection');
    } catch (error) {
      console.error('Error applying date filter:', error);
      alert('Failed to load collection report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and view financial reports</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collection</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats ? formatCurrency(stats.totalCollection) : '₹0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats ? formatCurrency(stats.thisMonth) : '₹0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current month collection</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats ? formatCurrency(stats.pendingPayments) : '₹0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{outstandingDues.length} outstanding dues</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{defaulters.length} defaulters</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView('collection')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'collection'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Collection Report
        </button>
        <button
          onClick={() => setActiveView('outstanding')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'outstanding'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Outstanding Dues
        </button>
        <button
          onClick={() => setActiveView('defaulters')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeView === 'defaulters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Defaulters
        </button>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Generate Custom Report</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
                <Button onClick={applyDateFilter}>
                  Generate Collection Report
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('collection')}>
              <CardBody>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Collection Report
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      View payment collections and mode breakdown
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {collectionReport ? formatCurrency(collectionReport.total_collected) : '₹0'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('outstanding')}>
              <CardBody>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Outstanding Dues
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      List of all pending fee payments
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {outstandingDues.length} dues
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('defaulters')}>
              <CardBody>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Defaulters List
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Students with overdue payments
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {defaulters.length} students
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Collection Report View */}
      {activeView === 'collection' && collectionReport && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Collection Report</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const data = Object.entries(collectionReport.payment_mode_breakdown).map(([mode, amount]) => ({
                      'Payment Mode': mode,
                      'Amount': amount
                    }));
                    exportToCSV(data, 'collection_report');
                  }}
                >
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Date Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {collectionReport.date_range.start} to {collectionReport.date_range.end}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Collected</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(collectionReport.total_collected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {collectionReport.total_students}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Mode Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(collectionReport.payment_mode_breakdown).map(([mode, amount]) => (
                      <div key={mode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900 capitalize">{mode}</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Outstanding Dues View */}
      {activeView === 'outstanding' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Outstanding Dues</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = outstandingDues.map(due => ({
                    'Serial No': due.Student?.serial_number,
                    'Student Name': due.Student?.name,
                    'Fee Type': due.FeeStructure?.name,
                    'Course': due.FeeStructure?.course,
                    'Amount Due': due.amount_due,
                    'Amount Paid': due.amount_paid,
                    'Amount Remaining': due.amount_remaining,
                    'Due Date': formatDate(due.due_date),
                    'Status': due.status,
                    'Period': due.payment_period
                  }));
                  exportToCSV(data, 'outstanding_dues');
                }}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {outstandingDues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No outstanding dues found
                      </td>
                    </tr>
                  ) : (
                    outstandingDues.map((due) => (
                      <tr key={due.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{due.Student?.name}</div>
                            <div className="text-sm text-gray-500">{due.Student?.serial_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{due.FeeStructure?.name}</div>
                          <div className="text-sm text-gray-500">{due.FeeStructure?.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {due.payment_period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(parseFloat(due.amount_due.toString()))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(parseFloat(due.amount_paid.toString()))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {formatCurrency(parseFloat(due.amount_remaining.toString()))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(due.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            due.status === 'paid' ? 'bg-green-100 text-green-800' :
                            due.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            due.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {due.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Defaulters View */}
      {activeView === 'defaulters' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Fee Defaulters</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(defaulters, 'defaulters_list')}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {defaulters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No defaulters found
                      </td>
                    </tr>
                  ) : (
                    defaulters.map((defaulter) => (
                      <tr key={defaulter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{defaulter.student}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {defaulter.serialNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(defaulter.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(defaulter.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            defaulter.days > 60 ? 'bg-red-100 text-red-800' :
                            defaulter.days > 30 ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {defaulter.days} days
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
