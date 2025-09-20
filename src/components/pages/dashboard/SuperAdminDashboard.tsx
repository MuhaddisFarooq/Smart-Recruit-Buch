"use client"
import React from 'react';
import { StatCard } from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  UserCheck,
  Clock,
  X,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Building,
  Award,
  CreditCard,
  DollarSign,
  UserPlus,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle2,
  Star,
  Target,
  Zap,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { getDashboardStats, getApplicationTrends, getEnrollmentTrends, getProgramDistribution, getRevenueTrends } from '@/lib/api/ApiFunctions';
import { useQuery } from '@tanstack/react-query';

const applicationData = [
  { month: 'Jan', total: 120, approved: 95, rejected: 15, pending: 10 },
  { month: 'Feb', total: 150, approved: 120, rejected: 20, pending: 10 },
  { month: 'Mar', total: 180, approved: 140, rejected: 25, pending: 15 },
  { month: 'Apr', total: 200, approved: 160, rejected: 30, pending: 10 },
  { month: 'May', total: 220, approved: 180, rejected: 25, pending: 15 },
  { month: 'Jun', total: 250, approved: 200, rejected: 35, pending: 15 },
];

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
  { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 },
];

const enrollmentData = [
  { semester: 'Fall 2023', students: 980 },
  { semester: 'Spring 2024', students: 1120 },
  { semester: 'Summer 2024', students: 890 },
  { semester: 'Fall 2024', students: 1247 },
];

const pieData = [
  { name: 'Approved', value: 850, color: '#aaca52' },
  { name: 'Pending', value: 245, color: '#f59e0b' },
  { name: 'Rejected', value: 150, color: '#ef4444' },
];

/*
const programData = [
  { name: 'Engineering', students: 425, color: '#3b82f6' },
  { name: 'Business', students: 320, color: '#8b5cf6' },
  { name: 'Arts & Sciences', students: 290, color: '#10b981' },
  { name: 'Medicine', students: 180, color: '#f59e0b' },
  { name: 'Law', students: 32, color: '#ef4444' },
]; */

const COLORS = ['#aaca52', '#f59e0b', '#ef4444'];
const PROGRAM_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function SuperAdminDashboard() {

  // Application Trends

const { data: applicationTrendsRaw, isLoading, error } = useQuery({
  queryKey: ["application-trends"],
  queryFn: getApplicationTrends,
  select: (data) =>
    data.map((item: any) => ({
      ...item,
      total: Number(item.total),
      approved: Number(item.approved),
      rejected: Number(item.rejected),
    })),
});

  // Dashboard stats

const applicationTrends = applicationTrendsRaw || [];

  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });
  
  const applications = dashboardStats?.applications;
  const admissions = dashboardStats?.admissions;
  const academicStructure = {
    sessions: dashboardStats?.sessions,
    sections: dashboardStats?.sections,
    subjects: dashboardStats?.subjects,
    departments: dashboardStats?.departments,
    designations: dashboardStats?.designations,
  };
  const program = dashboardStats?.program;
  const users = dashboardStats?.users;
  const leaveApplications = dashboardStats?.leaveApplications;
  const feeRecords = dashboardStats?.feeRecords;
  const installmentRequests = dashboardStats?.installmentRequests;
  const discountRequests = dashboardStats?.discountRequests;

  // Enrollment Trends

  const {
    data: enrollmentTrendsRaw,
    isLoading: isEnrollmentTrendsLoading,
    error: enrollmentTrendsError,
  } = useQuery({
    queryKey: ["enrollment-trends"],
    queryFn: getEnrollmentTrends,
    select: (programs) => {

      const currentMonthIndex = new Date().getMonth();

      const months = programs[0]?.monthly
        ?.map((m: any) => m.month)
        .slice(0, currentMonthIndex + 1) || [];

      return months.map((m : any) => {
        const row: any = { month: m };
        programs.forEach((p: any) => {
          const monthData = p.monthly.find((x: any) => x.month === m);
          row[p.programTitle] = monthData ? Number(monthData.count) : 0;
        });
        return row;
      });
    },
  });

const enrollmentTrends = enrollmentTrendsRaw || [];

  // Program Distribution

  const { 
    data: programDataRaw,
    isLoading: isProgramDistributionLoading,
    error: programDistributionError } = useQuery({
    queryKey: ["program-distribution"],
    queryFn: getProgramDistribution,
    select: (data) =>
      data.map((p: any) => ({
        name: p.programTitle,
        students: p.count,
        percentage: p.percentage,
      })),
  });

  const programData = programDataRaw || [];

  // Revenue Trends

  const {
    data: revenueTrendsRaw, 
    isLoading: isRevenueTrendsLoading,
    error: revenueTrendsError } = useQuery({
    queryKey: ["revenue-trends"],
    queryFn: getRevenueTrends,
    select: (data) =>
      data.map((item: any) => ({
        year: item.year,
        month: item.month,
        revenue: Number(item.revenue),
      })),
  });

const revenueTrends = revenueTrendsRaw || [];

  return (
    <div className="p-8 space-y-8  min-h-full">
    {/* Welcome Header */}
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
        
        {/* Left Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Welcome back, Administrator
          </h1>
          <p className="text-emerald-100 text-base sm:text-lg mb-4">
            Here's what's happening with your institution today
          </p>
          
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="bg-white/20 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              📊 {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="bg-white/20 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              🌟 All Systems Operational
            </div>
            <div className="bg-white/20 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              ⚡ {users?.total ?? "-"} Active Users
            </div>
          </div>
        </div>

        {/* Right Section (hidden on small screens) */}
        <div className="hidden md:block">
          <div className="bg-white/10 p-6 md:p-6 rounded-2xl backdrop-blur-sm border border-white/20 text-center">
            <Activity className="h-12 w-12 md:h-16 md:w-16 text-white mb-3 md:mb-4" />
            <p className="text-emerald-100 text-sm md:text-lg font-medium">Live Analytics</p>
            <p className="text-emerald-200 text-xs md:text-sm">Real-time monitoring</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-20 sm:-translate-y-32 translate-x-20 sm:translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"></div>
    </div>

      {/* Applications Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Application Management</h2>
            <p className="text-gray-600">Monitor and track all student applications</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none shadow-md">
          Real-time Updates
        </Badge>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{applications?.total ?? '-'}</div>
            <div className="text-emerald-100 text-sm mb-3">Total Applications</div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">+12%</div>
              <span className="text-emerald-200 text-xs">vs last month</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <UserCheck className="h-6 w-6" />
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{applications?.approved ?? '-'}</div>
            <div className="text-green-100 text-sm mb-3">Approved Applications</div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">68% rate</div>
              <span className="text-green-200 text-xs">excellent performance</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <Target className="h-5 w-5 text-amber-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{applications?.pending ?? '-'}</div>
            <div className="text-amber-100 text-sm mb-3">Pending Review</div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">3-5 days</div>
              <span className="text-amber-200 text-xs">avg review time</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <X className="h-6 w-6" />
              </div>
              <Star className="h-5 w-5 text-red-200" />
            </div>
            <div className="text-3xl font-bold mb-2">{applications?.rejected ?? '-'}</div>
            <div className="text-red-100 text-sm mb-3">Rejected Applications</div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">12% rate</div>
              <span className="text-red-200 text-xs">within standards</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admissions & Academic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Academic Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Academic Excellence</h2>
              <p className="text-gray-600">Students, faculty, and programs overview</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <span className="text-green-700 text-sm font-medium">+5%</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{users?.students ?? '-'}</div>
              <div className="text-gray-600 text-sm mb-3">Total Students</div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-700 text-sm font-medium">Active</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{program?.total ?? '-'}</div>
              <div className="text-gray-600 text-sm mb-3">Academic Programs</div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="bg-teal-100 px-3 py-1 rounded-full">
                  <span className="text-teal-700 text-sm font-medium">Faculty</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{users?.teachers ?? '-'}</div>
              <div className="text-gray-600 text-sm mb-3">Teaching Staff</div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-3 rounded-xl">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="bg-rose-100 px-3 py-1 rounded-full">
                  <span className="text-rose-700 text-sm font-medium">Support</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{users?.staff ?? '-'}</div>
              <div className="text-gray-600 text-sm mb-3">Support Staff</div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>
          
          {/* Academic Structure */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{academicStructure?.sessions ?? '-'}</div>
              <div className="text-cyan-100 text-sm">Sessions</div>
            </div>
            <div className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Building className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{academicStructure?.sections ?? '-'}</div>
              <div className="text-violet-100 text-sm">Sections</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Building className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{academicStructure?.departments ?? '-'}</div>
              <div className="text-emerald-100 text-sm">Departments</div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white text-center shadow-lg">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{academicStructure?.subjects ?? '-'}</div>
              <div className="text-orange-100 text-sm">Subjects</div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Stats & Admissions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Admissions</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div>
                  <div className="text-2xl font-bold text-green-700">{admissions?.confirmed ?? '-'}</div>
                  <div className="text-green-600 text-sm">Confirmed Admissions</div>
                </div>
                <div className="bg-green-500 p-2 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div>
                  <div className="text-2xl font-bold text-amber-700">{admissions?.pending ?? '-'}</div>
                  <div className="text-amber-600 text-sm">Pending Confirmation</div>
                </div>
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Quick Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Admission Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-green-400 to-green-500"></div>
                  </div>
                  <span className="text-green-600 font-medium">68%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Staff Satisfaction</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-11/12 h-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  </div>
                  <span className="text-blue-600 font-medium">94%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Course Completion</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-5/6 h-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                  </div>
                  <span className="text-purple-600 font-medium">87%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Sessions</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                  </div>
                  <span className="text-emerald-600 font-medium">89%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-6 w-6" />
              <h3 className="text-lg font-bold">Today's Highlights</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-indigo-100">15 applications approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-indigo-100">3 new faculty members</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-indigo-100">$45K fees collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-indigo-100">2 programs launched</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Financial Performance</h2>
            <p className="text-gray-600">Revenue, expenses, and financial health</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-200" />
            </div>
            <div className="text-3xl font-bold mb-2">Pkr {feeRecords?.totalAmount ?? '-'}</div>
            <div className="text-emerald-100 text-sm mb-3">Total Revenue</div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">+18%</div>
              <span className="text-emerald-200 text-xs">this year</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-3 rounded-xl">
                <Award className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{discountRequests?.total ?? '-'}</div>
            <div className="text-gray-600 text-sm mb-3">Discount Requests</div>
            <div className="text-xs text-gray-500">{discountRequests?.approved} approved • {discountRequests?.rejected} rejected • {discountRequests?.pending} pending</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Active</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{installmentRequests?.total ?? '-'}</div>
            <div className="text-gray-600 text-sm mb-3">Installment Plans</div>
            <div className="text-xs text-gray-500">{installmentRequests?.approved} approved • {installmentRequests?.rejected} rejected • {installmentRequests?.pending} pending</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Applications Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Application Trends</h3>
              <p className="text-gray-600 text-sm">Monthly application statistics</p>
            </div>
          </div>
              <div>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[280px] text-gray-500">Loading application trends...</div>
                ) : error ? (
                  <div className="flex justify-center items-center h-[280px] text-red-500">
                    Failed to load application trends
                  </div>
                ) : applicationTrends.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4">No application data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={applicationTrends}  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(v) => String(v).slice(0, 3)}
                      />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="total" fill="#aaca52" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
        </div>

        {/* Revenue Analysis */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Financial Overview</h3>
              <p className="text-gray-600 text-sm">Revenue vs expenses analysis</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorExpenses)"
                name="Expenses"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section - HR and Program Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HR Management */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Human Resources</h2>
              <p className="text-gray-600">Staff management and organization</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl p-4 text-white text-center shadow-lg">
              <UserPlus className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{users?.total ?? '-'}</div>
              <div className="text-pink-100 text-sm">System Roles</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{leaveApplications?.total ?? '-'}</div>
              <div className="text-indigo-100 text-sm">Leave Requests</div>
            </div>
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{academicStructure?.designations ?? '-'}</div>
              <div className="text-teal-100 text-sm">Designations</div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 text-white text-center shadow-lg">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{users?.staff ?? '-'}</div>
              <div className="text-green-100 text-sm">Total Staff</div>
            </div>
          </div>
        </div>

        {/* Program Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Program Distribution</h3>
              <p className="text-gray-600 text-sm">Students enrolled by program</p>
            </div>
          </div>
          
            {isProgramDistributionLoading ? (
              <div className="flex justify-center items-center h-[280px] text-gray-500">Loading program distribution... </div>
            ) : programDistributionError ? (
              <div className="flex justify-center items-center h-[280px] text-red-500">Failed to load program distribution</div>
            ) : (
            <ResponsiveContainer width="100%" height={280}>
            <RechartsPieChart>
              <Pie
                data={programData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="students"
              >
                {programData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PROGRAM_COLORS[index % PROGRAM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
            <p className="text-gray-600 text-sm">Latest updates and notifications</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, text: "15 applications approved", time: "2 hours ago", type: "success", color: "from-green-400 to-green-500" },
            { icon: UserPlus, text: "3 new teachers added", time: "4 hours ago", type: "info", color: "from-blue-400 to-blue-500" },
            { icon: DollarSign, text: "Fee collection updated", time: "6 hours ago", type: "success", color: "from-emerald-400 to-emerald-500" },
            { icon: BookOpen, text: "2 new programs launched", time: "1 day ago", type: "info", color: "from-purple-400 to-purple-500" },
            { icon: Award, text: "Scholarship awarded", time: "1 day ago", type: "warning", color: "from-amber-400 to-amber-500" },
            { icon: Users, text: "Staff meeting scheduled", time: "2 days ago", type: "info", color: "from-indigo-400 to-indigo-500" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
              <div className={`bg-gradient-to-r ${activity.color} p-2 rounded-lg shadow-sm`}>
                <activity.icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{activity.text}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Enrollment Trends per Program */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Enrollment Trends</h2>
            <p className="text-sm text-gray-600">Monthly enrollments by program</p>
          </div>
        </div>

        {isEnrollmentTrendsLoading ? (
          <div className="flex justify-center items-center h-[280px] text-gray-500">Loading enrollment trends...</div>
        ) : enrollmentTrendsError ? (
          <div className="flex justify-center items-center h-[280px] text-red-500">
            Failed to load enrollment trends
          </div>
        ) : enrollmentTrends.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">No enrollment data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentTrends} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => v.slice(0, 3)}
                tick={{ angle: -45, textAnchor: "end" } as any}
                interval={0}
                height={60}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              {Object.keys(enrollmentTrends[0] || {})
                .filter((key) => key !== "month")
                .map((program, idx) => (
                  <Bar
                    key={program}
                    dataKey={program}
                    fill={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"][idx % 6]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Yearly Revenue Trends */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Revenue Trends</h2>
            <p className="text-sm text-gray-600">Revenue trends by month and year</p>
          </div>
        </div>
        {isRevenueTrendsLoading ? (
          <div className="flex justify-center items-center h-[280px] text-gray-500">Loading revenue trends...</div>
        ) : revenueTrendsError ? (
          <div className="flex justify-center items-center h-[280px] text-red-500">
            Failed to load revenue trends
          </div>
        ) : revenueTrends.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">No revenue data yet</div>
        ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => v.slice(0, 3)}
                tick={{ angle: -45, textAnchor: "end" } as any}
                interval={0}
                height={60}
              />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#aaca52" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
      </div>
    </div>
  );
}