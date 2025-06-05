import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowUnauthenticated={true} bypassPaymentCheck={true}>
      {children}
    </ProtectedRoute>
  );
}
