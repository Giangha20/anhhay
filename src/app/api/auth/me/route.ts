import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await getAuthenticatedAdmin();

  if (!auth) {
    return NextResponse.json({ authenticated: false, admin: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: auth.admin.id,
      username: auth.admin.username,
      mustChangePassword: auth.admin.mustChangePassword,
      createdAt: auth.admin.createdAt,
    },
  });
}
