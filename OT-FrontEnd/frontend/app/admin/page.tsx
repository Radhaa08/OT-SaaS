'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../../components/auth/UserProvider';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Navbar } from '../../components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import { Textarea } from '../../components/ui/textarea';
import { 
  Users, 
  Briefcase, 
  Settings, 
  Shield, 
  BarChart, 
  Activity, 
  Search,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Lock,
  Save,
  Check,
  Database
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

// Import all needed API hooks
import { 
  useGetAllUsersQuery, 
  useUpdatePaymentStatusMutation,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  User as UserType,
  ActivityLog 
} from '../../apiSlice/userApiSlice';
import { useGetAllJobsQuery } from '../../apiSlice/jobsApiSlice'; // Changed from useGetAllActiveJobsQuery
import { useGetRecentActivitiesQuery } from '../../apiSlice/activitiesApiSlice';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const [activityFilter, setActivityFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({ key: 'timestamp', direction: 'descending' });
  const [activeTab, setActiveTab] = useState('overview');

  // Form states for profile update
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    company: user?.company || '',
    position: user?.position || '',
  });

  // Form states for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Loading states for form submissions
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch data using RTK Query hooks
  const { data: users = [], isLoading: isLoadingUsers } = useGetAllUsersQuery({ limit: 100 });
  const { data: jobs = [], isLoading: isLoadingJobs } = useGetAllJobsQuery({ limit: 100 }); // Changed from useGetAllActiveJobsQuery
  const { data: activities = [], isLoading: isLoadingActivities } = useGetRecentActivitiesQuery({ limit: 100 });
  const { data: currentUser, isError: isUserError, error: userError } = useGetCurrentUserQuery();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [updateUser] = useUpdateUserMutation();
  const [changePassword] = useChangePasswordMutation();

  // State variables for server and database status
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [databaseStatus, setDatabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Check if backend server is running
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/`);
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('Server check error:', error);
        setServerStatus('offline');
      }
    };

    checkServerStatus();
  }, []);

  // Use the current user query to determine database connectivity
  useEffect(() => {
    if (currentUser) {
      setDatabaseStatus('connected');
    } else if (isUserError) {
      setDatabaseStatus('error');
    }
  }, [currentUser, isUserError]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) || 
    job.company.toLowerCase().includes(jobSearchTerm.toLowerCase())
  );

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.entityType === activityFilter;
  });

  // Sort activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    
    if (sortConfig.key === 'timestamp') {
      return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
    }
    
    // For other fields (can expand as needed)
    const valueA = a[sortConfig.key as keyof ActivityLog];
    const valueB = b[sortConfig.key as keyof ActivityLog];
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortConfig.direction === 'ascending' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    return 0;
  });

  // Toggle activity expansion
  const toggleActivityExpansion = (id: string) => {
    setExpandedActivities({
      ...expandedActivities,
      [id]: !expandedActivities[id]
    });
  };

  // Handle sort click
  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
      });
    } else {
      setSortConfig({
        key,
        direction: 'descending'
      });
    }
  };

  // Handle payment status toggle - Updated to handle network errors
  const handlePaymentStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await updatePaymentStatus({
        userId: userId,
        status: { isPaid: !currentStatus }
      }).unwrap();
      
      // Show success feedback to the user
      toast({
        title: "Success",
        description: `Payment status ${!currentStatus ? 'granted' : 'revoked'} successfully`,
        duration: 3000,
      });
    } catch (error: any) {
      // Check if it's a network error
      const isNetworkError = error instanceof Error && 
        (error.name === 'TypeError' || 
         error.message.includes('NetworkError') ||
         error.message.includes('Failed to fetch'));
      
      // Extract meaningful error message
      const errorMessage = isNetworkError 
        ? "Network error. Please check your connection."
        : error.data?.error || 
          error.data?.message || 
          error.error || 
          "Failed to update payment status";
      
      console.error('Failed to update payment status', errorMessage);
      
      // Show error feedback to the user
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Handle profile form input changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form input changes
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUpdatingProfile(true);
      
      const updateData = {
        name: profileForm.name,
        phone: profileForm.phone,
        bio: profileForm.bio,
        location: profileForm.location,
        company: profileForm.company,
        position: profileForm.position,
      };
      
      const updatedUser = await updateUser(updateData).unwrap();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: error?.data?.message || "There was an error updating your profile.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure your new password and confirmation match.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }).unwrap();
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast({
        title: "Password Change Failed",
        description: error?.data?.message || "There was an error changing your password.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get activity type badge color
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'job':
        return 'bg-green-100 text-green-800';
      case 'jobseeker':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get user role badge color
  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Admin
          </Badge>
        );
      case 'member':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Consultant
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {role}
          </Badge>
        );
    }
  };

  // Calculate summary stats for the dashboard
  const stats = {
    totalUsers: users.length,
    totalMembers: users.filter(u => u.role === 'member').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
    paidUsers: users.filter(u => u.isPaid).length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    closedJobs: jobs.filter(j => j.status === 'closed').length,
    totalActivities: activities.length,
    recentActivities: activities.filter(a => 
      new Date(a.timestamp) > subDays(new Date(), 7)
    ).length
  };

  // Get activity counts by type
  const activityCountsByType = activities.reduce((acc, activity) => {
    acc[activity.entityType] = (acc[activity.entityType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get the most recent activity timestamp for the "last backup" display
  const getMostRecentActivityTime = () => {
    if (!activities || activities.length === 0) {
      return format(new Date(), 'MMM d, yyyy h:mm a');
    }
    
    // Find the most recent activity by sorting timestamps
    const sortedByTime = [...activities].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Return the formatted timestamp of the most recent activity
    return formatDate(sortedByTime[0].timestamp);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, monitor activities, and configure system settings
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-2 rounded-md">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Logged in as Admin: {user?.name || 'Administrator'}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Activity Logs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingUsers ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.totalUsers
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Admins: {stats.totalAdmins}</span>
                    <span>Consultants: {stats.totalMembers}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingJobs ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.totalJobs
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Active: {stats.activeJobs}</span>
                    <span>Closed: {stats.closedJobs}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Paid Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingUsers ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.paidUsers
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalUsers > 0 
                      ? `${Math.round((stats.paidUsers / stats.totalUsers) * 100)}% of users` 
                      : 'No users'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingActivities ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      stats.totalActivities
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.recentActivities} in the last 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system status and connectivity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`flex justify-between items-center p-3 ${
                      serverStatus === 'online' 
                        ? 'bg-green-50 text-green-800' 
                        : serverStatus === 'offline'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-amber-50 text-amber-800'
                      } rounded-md`}>
                      <div className="flex items-center gap-2">
                        <div className={`${
                          serverStatus === 'online' 
                            ? 'bg-green-200' 
                            : serverStatus === 'offline'
                              ? 'bg-red-200'
                              : 'bg-amber-200'
                          } p-1 rounded-full`}>
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {serverStatus === 'online' 
                            ? 'Backend server operational' 
                            : serverStatus === 'offline'
                              ? 'Backend server offline'
                              : 'Checking server status...'}
                        </span>
                      </div>
                      <span className="text-sm">
                        {serverStatus === 'online' 
                          ? 'OK' 
                          : serverStatus === 'offline'
                            ? 'Error'
                            : 'Checking...'}
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 ${
                      databaseStatus === 'connected' 
                        ? 'bg-green-50 text-green-800' 
                        : databaseStatus === 'error'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-amber-50 text-amber-800'
                      } rounded-md`}>
                      <div className="flex items-center gap-2">
                        <div className={`${
                          databaseStatus === 'connected' 
                            ? 'bg-green-200' 
                            : databaseStatus === 'error'
                              ? 'bg-red-200'
                              : 'bg-amber-200'
                          } p-1 rounded-full`}>
                          <Database className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {databaseStatus === 'connected' 
                            ? 'Database successfully connected' 
                            : databaseStatus === 'error'
                              ? 'Database connection error'
                              : 'Checking database connection...'}
                        </span>
                      </div>
                      <span className="text-sm">
                        {databaseStatus === 'connected' 
                          ? 'OK' 
                          : databaseStatus === 'error'
                            ? 'Error'
                            : 'Checking...'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-200 p-1 rounded-full">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          Database last backup: {isLoadingActivities 
                            ? 'Loading...' 
                            : getMostRecentActivityTime()}
                        </span>
                      </div>
                      <span className="text-sm">Last Activity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Distribution of system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-200 animate-pulse rounded w-full"></div>
                      <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 animate-pulse rounded w-1/2"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(activityCountsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className="w-24 font-medium capitalize">{type}</div>
                          <div className="flex-1 mx-4">
                            <div className="rounded-full bg-gray-200 h-4">
                              <div 
                                className={`rounded-full h-4 ${
                                  type === 'user' ? 'bg-blue-500' : 
                                  type === 'job' ? 'bg-green-500' : 
                                  type === 'jobseeker' ? 'bg-purple-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${Math.round((count / activities.length) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-12 text-right font-medium">{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => setActiveTab('activities')}
                  >
                    View All Activity Logs
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>Latest actions performed in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4 items-start pb-4 border-b">
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-4 items-start pb-4 border-b last:border-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          activity.entityType === 'user' ? 'bg-blue-100' : 
                          activity.entityType === 'job' ? 'bg-green-100' : 
                          activity.entityType === 'jobseeker' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {activity.entityType === 'user' ? (
                            <Users className="h-5 w-5 text-blue-600" />
                          ) : activity.entityType === 'job' ? (
                            <Briefcase className="h-5 w-5 text-green-600" />
                          ) : activity.entityType === 'jobseeker' ? (
                            <UserCheck className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.details || `${activity.action} on ${activity.entityType}`}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(activity.timestamp)}</span>
                            <Badge variant="outline" className={`text-xs ${getActivityBadgeColor(activity.entityType)}`}>
                              {activity.entityType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setActiveTab('activities')}
                >
                  View All Activity Logs
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and permissions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search users..." 
                      className="pl-8 w-[250px]"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded w-full"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 border-b bg-muted/50 p-3">
                      <div className="font-medium">Name</div>
                      <div className="font-medium">Email</div>
                      <div className="font-medium">Role</div>
                      <div className="font-medium">Status</div>
                      <div className="font-medium">Created</div>
                    </div>
                    <div className="divide-y">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="grid grid-cols-5 px-3 py-3">
                          <div className="font-medium">{user.name || 'N/A'}</div>
                          <div className="text-muted-foreground">{user.email}</div>
                          <div>
                            {getUserRoleBadge(user.role)}
                          </div>
                          <div>
                            <Badge className={user.isPaid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {user.isPaid ? 'Paid' : 'Free'}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {filteredUsers.length === 0 && !isLoadingUsers && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found matching search criteria</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <Button variant="outline" size="sm" disabled>
                  Export Users
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>Monitor all system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Select value={activityFilter} onValueChange={setActivityFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="user">User Activities</SelectItem>
                        <SelectItem value="job">Job Activities</SelectItem>
                        <SelectItem value="jobseeker">Job Seeker Activities</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setActivityFilter('all')}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredActivities.length} of {activities.length} activities
                  </div>
                </div>
                
                {isLoadingActivities ? (
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 animate-pulse rounded w-full"></div>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 animate-pulse rounded w-full"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 border-b bg-muted/50 p-3">
                      <div 
                        className="font-medium flex items-center cursor-pointer"
                        onClick={() => handleSort('entityType')}
                      >
                        Type
                        {sortConfig.key === 'entityType' && (
                          sortConfig.direction === 'ascending' 
                            ? <ChevronUp className="ml-1 h-4 w-4" /> 
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                      <div className="font-medium">Details</div>
                      <div className="font-medium">User ID</div>
                      <div 
                        className="font-medium flex items-center cursor-pointer"
                        onClick={() => handleSort('timestamp')}
                      >
                        Timestamp
                        {sortConfig.key === 'timestamp' && (
                          sortConfig.direction === 'ascending' 
                            ? <ChevronUp className="ml-1 h-4 w-4" /> 
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                      <div className="font-medium">IP Address</div>
                    </div>
                    <div className="divide-y">
                      {sortedActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="grid grid-cols-5 px-3 py-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleActivityExpansion(activity.id)}
                        >
                          <div>
                            <Badge className={getActivityBadgeColor(activity.entityType)}>
                              {activity.entityType}
                            </Badge>
                          </div>
                          <div className="font-medium">
                            {activity.details || activity.action || 'No details'}
                          </div>
                          <div className="text-muted-foreground">
                            {activity.consultantId}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {formatDate(activity.timestamp)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {activity.ipAddress || 'Unknown'}
                          </div>
                          
                          {/* Expanded view */}
                          {expandedActivities[activity.id] && (
                            <div className="col-span-5 mt-3 p-3 bg-muted/20 rounded-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm font-medium">Action</div>
                                  <div className="text-sm">{activity.action}</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Entity ID</div>
                                  <div className="text-sm">{activity.entityId}</div>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-sm font-medium">Full Details</div>
                                  <div className="text-sm whitespace-pre-wrap">
                                    {activity.details || 'No additional details available'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {filteredActivities.length === 0 && !isLoadingActivities && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No activities found matching filters</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Click on any row to see more details
                </div>
                <Button variant="outline" size="sm" disabled>
                  Export Logs
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Admin Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>Admin Profile</span>
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                        <Input 
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          value={profileForm.name || ''}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input 
                          id="email"
                          type="email"
                          value={profileForm.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                        <Input 
                          id="phone"
                          name="phone"
                          placeholder="Your phone number"
                          value={profileForm.phone || ''}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="company" className="text-sm font-medium">Company</label>
                        <Input 
                          id="company"
                          name="company"
                          placeholder="Your company"
                          value={profileForm.company || ''}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="position" className="text-sm font-medium">Position</label>
                        <Input 
                          id="position"
                          name="position"
                          placeholder="Your position"
                          value={profileForm.position || ''}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="location" className="text-sm font-medium">Location</label>
                        <Input 
                          id="location"
                          name="location"
                          placeholder="Your location"
                          value={profileForm.location || ''}
                          onChange={handleProfileInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                        <Textarea 
                          id="bio"
                          name="bio"
                          placeholder="A brief description about yourself"
                          value={profileForm.bio || ''}
                          onChange={handleProfileInputChange}
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full flex items-center gap-2"
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Profile</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Password Change Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium">Current Password</label>
                        <Input 
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          placeholder="Your current password"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                        <Input 
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          placeholder="Your new password"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                        <Input 
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm your new password"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="secondary"
                      className="w-full flex items-center gap-2"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
