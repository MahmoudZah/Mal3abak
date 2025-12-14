import { redirect } from 'next/navigation';

export default function OwnerSettingsPage() {
  // Redirect to profile page for settings
  redirect('/profile');
}

