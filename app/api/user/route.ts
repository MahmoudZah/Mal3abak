import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { name, phone, currentPassword, newPassword } = await request.json()

    // Prepare update data
    const updateData: { name?: string; phone?: string; password?: string } = {}

    if (name) {
      updateData.name = name
    }

    if (phone !== undefined) {
      updateData.phone = phone || null
    }

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'يجب إدخال كلمة المرور الحالية' },
          { status: 400 }
        )
      }

      // Get full user with password
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
      })

      if (!fullUser) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        )
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, fullUser.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
          { status: 400 }
        )
      }

      updateData.password = await hashPassword(newPassword)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث البيانات' },
      { status: 500 }
    )
  }
}

