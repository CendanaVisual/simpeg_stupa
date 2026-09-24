import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sipeg_token')?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      if (payload.role === 'admin') {
        redirect('/admin/dashboard');
      } else {
        redirect('/pegawai/dashboard');
      }
    }
  }

  redirect('/login');
}
