'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Navbar } from "../../components/navbar";
import { useUser } from '../../components/auth/UserProvider';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '../../components/ui/conformationModel';

// Import API slice hooks
import {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  type UserUpdateData
} from '../../apiSlice/userApiSlice';
import { useGetJobSeekersForConsultantQuery } from '../../apiSlice/jobSeekersApiSlice';

function ProfilePage() {
  const { user: authUser } = useUser();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('bio');
  const router = useRouter();
  
  // API queries
  const { data: currentUser, isLoading: isUserLoading } = useGetCurrentUserQuery();
  
  // Only fetch job seekers if we have currentUser (to get the consultantId)
  const { 
    data: jobSeekers = [], 
    isLoading: isJobSeekersLoading 
  } = useGetJobSeekersForConsultantQuery(
    { consultantId: currentUser?.id?.toString() || '0' },
    { skip: !currentUser?.id }
  );

  // API mutations
  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  
  // Form state
  const [formData, setFormData] = useState<UserUpdateData>({
    name: '',
    phone: '',
    bio: '',
    company: '',
    position: '',
    location: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Confirmation modals state
  const [profileUpdateModal, setProfileUpdateModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [passwordUpdateModal, setPasswordUpdateModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [accountDeleteModal, setAccountDeleteModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        company: currentUser.company || '',
        position: currentUser.position || '',
        location: currentUser.location || '',
      });
    }
  }, [currentUser]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      await updateProfile(formData).unwrap();
      setProfileUpdateModal({
        isOpen: true,
        title: "Success",
        message: "Profile updated successfully",
        onConfirm: () => {
          setProfileUpdateModal(prev => ({ ...prev, isOpen: false }));
          setIsEditMode(false);
        }
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update profile"
      });
      console.error('Update error:', error);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "New passwords do not match"
      });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();
      
      setPasswordUpdateModal({
        isOpen: true,
        title: "Success",
        message: "Password updated successfully",
        onConfirm: () => {
          setPasswordUpdateModal(prev => ({ ...prev, isOpen: false }));
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to change password"
      });
      console.error('Password change error:', error);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      setAccountDeleteModal({
        isOpen: true,
        title: "Success",
        message: "Account deleted successfully",
        onConfirm: () => {
          setAccountDeleteModal(prev => ({ ...prev, isOpen: false }));
          router.push('/sign-in');
        }
      });
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to delete account"
      });
      console.error('Delete account error:', error);
    }
  };  

  // Calculate metrics from real data
  const activePlacements = jobSeekers?.filter(js => js.skills.includes('Placed')).length || 0;
  const successRate = jobSeekers && jobSeekers.length > 0 
    ? Math.round((activePlacements / jobSeekers.length) * 100) 
    : 0;

  // Show loading state
  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="flex-1 space-y-6 container px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          {isEditMode ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Profile Overview */}
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} alt={currentUser?.name || ""} />
                  <AvatarFallback>{currentUser?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h3 className="text-2xl font-bold">{currentUser?.name}</h3>
                  <p className="text-muted-foreground">{currentUser?.position || "Consultant"}</p>
                  <p className="text-muted-foreground">{currentUser?.company || "Not specified"}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser?.phone || "Not specified"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{currentUser?.location || "Not specified"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDate(currentUser?.createdAt)}</span>
                </div>
                
                {/* Subscription Status */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-medium mb-2">Subscription Status</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex h-2 w-2 rounded-full ${currentUser?.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{currentUser?.isPaid ? 'Active' : 'Inactive'}</span>
                  </div>
                  
                  {currentUser?.isPaid && currentUser?.expiryDate && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">
                        Expires on {formatDate(currentUser.expiryDate)}
                      </span>
                    </div>
                  )}
                  
                  {(!currentUser?.isPaid || !currentUser?.expiryDate) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      asChild
                    >
                      <Link href="/pricing">Upgrade Plan</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
            {isEditMode && (
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Upload New Photo
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Bio and Job Seekers */}
          <Card className="md:col-span-4">
            <CardHeader>
              {/* Replace Tabs with custom buttons */}
              <div className="grid w-full grid-cols-2 mb-4">
                <Button 
                  variant={activeSection === 'bio' ? "default" : "outline"} 
                  className="rounded-r-none"
                  onClick={() => setActiveSection('bio')}
                >
                  Bio
                </Button>
                <Button 
                  variant={activeSection === 'job-seekers' ? "default" : "outline"} 
                  className="rounded-l-none"
                  onClick={() => setActiveSection('job-seekers')}
                >
                  Job Seekers
                </Button>
              </div>
              
              {/* Bio content */}
              {activeSection === 'bio' && (
                <div className="space-y-4 pt-4">
                  <div>
                    <CardTitle>About Me</CardTitle>
                    {isEditMode ? (
                      <textarea
                        name="bio"
                        className="w-full mt-2 p-2 rounded-md border border-input bg-background"
                        rows={5}
                        value={formData.bio || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <CardDescription className="mt-2">
                        {currentUser?.bio || "No bio information available. Click 'Edit Profile' to add your bio."}
                      </CardDescription>
                    )}
                  </div>
                  {isEditMode && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <input 
                          type="text" 
                          name="position"
                          value={formData.position || ""}
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-md border border-input bg-background" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Company</label>
                        <input 
                          type="text" 
                          name="company"
                          value={formData.company || ""}
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-md border border-input bg-background" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input 
                          type="text" 
                          name="location"
                          value={formData.location || ""}
                          onChange={handleInputChange}
                          className="w-full p-2 rounded-md border border-input bg-background" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Job Seekers content */}
              {activeSection === 'job-seekers' && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>My Job Seekers</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/job-seekers">View All</Link>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {isJobSeekersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : jobSeekers && jobSeekers.length > 0 ? (
                      jobSeekers.slice(0, 5).map((jobSeeker) => (
                        <div key={jobSeeker.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{jobSeeker.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{jobSeeker.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {jobSeeker.skills.slice(0, 3).join(", ")}
                              {jobSeeker.skills.length > 3 && "..."}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/job-seekers/${jobSeeker.id}`}>View</Link>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No job seekers found.</p>
                        <Link href="/job-seekers/new" className="text-primary hover:underline mt-2 inline-block">
                          Add your first job seeker
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Contact Information (Edit Mode) */}
        {isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md border border-input bg-background" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full p-2 rounded-md border border-input bg-background opacity-60" 
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md border border-input bg-background" 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Job Seekers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isJobSeekersLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  jobSeekers?.length || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Placements</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isJobSeekersLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  activePlacements
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isJobSeekersLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${successRate}%`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">Change your password</p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" disabled>Coming Soon</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account</p>
              </div>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 rounded-md border border-input bg-background" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 rounded-md border border-input bg-background" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 rounded-md border border-input bg-background" 
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasswordSubmit}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Account</h3>
            <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Confirmation Modals */}
      <ConfirmationModal
        isOpen={profileUpdateModal.isOpen}
        onClose={() => setProfileUpdateModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={profileUpdateModal.onConfirm}
        title={profileUpdateModal.title}
        message={profileUpdateModal.message}
      />

      <ConfirmationModal
        isOpen={passwordUpdateModal.isOpen}
        onClose={() => setPasswordUpdateModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={passwordUpdateModal.onConfirm}
        title={passwordUpdateModal.title}
        message={passwordUpdateModal.message}
      />

      <ConfirmationModal
        isOpen={accountDeleteModal.isOpen}
        onClose={() => setAccountDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={accountDeleteModal.onConfirm}
        title={accountDeleteModal.title}
        message={accountDeleteModal.message}
      />

      <ConfirmationModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}