import { redirect } from 'next/navigation';

// Root "/" of the dashboard group → redirect to /dashboard
export default function DashboardIndex() {
  redirect('/dashboard');
}
