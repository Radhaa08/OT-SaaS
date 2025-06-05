/**
 * Helper functions for debugging authentication issues
 */

/**
 * Debug the user authentication state
 */
export function debugAuth(user: any, apiUser: any, isLoading: boolean, isApiLoading: boolean): void {
  console.log('Auth Debug --------');
  console.log('User from context:', user);
  console.log('User from API:', apiUser);
  console.log('Loading states - Context:', isLoading, 'API:', isApiLoading);
  console.log('-------------------');
}

/**
 * Check if a user has the required role
 * This is a more flexible role checking logic that handles different role naming conventions
 */
export function hasRequiredRole(
  userRole: string | undefined, 
  requiredRole: string | string[] | undefined
): boolean {
  // If no role requirement, any authenticated user is allowed
  if (!requiredRole) return true;
  
  // If user has no role defined, they can't match any required role
  if (!userRole) return false;

  // Convert requiredRole to array for consistent handling
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Check if the user's role matches any of the required roles
  // Include logic for role equivalents (e.g., 'member' === 'consultant')
  return requiredRoles.some(role => {
    if (role === 'consultant' && (userRole === 'consultant' || userRole === 'member')) {
      return true;
    }
    if (role === 'admin' && userRole === 'admin') {
      return true;
    }
    // For string comparison, make it case insensitive
    return role.toLowerCase() === userRole.toLowerCase();
  });
}
