import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    await deleteSession()
    
    const cookieStore = await cookies()
    cookieStore.delete('session_id')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الخروج' },
      { status: 500 }
    )
  }
}

