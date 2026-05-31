import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    // Ambil password dari environment variable di server (100% aman, tidak bocor ke client)
    const secureAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === secureAdminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Password salah!' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
