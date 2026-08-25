import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// PATCH /api/members/[id] — change a member's role (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const { role } = await req.json();

  if (role !== 'admin' && role !== 'developer') {
    return NextResponse.json(
      { error: 'Role must be admin or developer' }, { status: 400 }
    );
  }

  const member = await prisma.admin.findFirst({
    where: { id, orgId: guard.session.orgId },
  });
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Prevent locking the org out: an admin cannot demote themselves
  if (id === guard.session.adminId && role !== 'admin') {
    return NextResponse.json(
      { error: 'You cannot change your own role' }, { status: 400 }
    );
  }

  const updated = await prisma.admin.update({
    where: { id },
    data:  { role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/members/[id] — remove a member from the organization (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;

  if (id === guard.session.adminId) {
    return NextResponse.json(
      { error: 'You cannot remove yourself' }, { status: 400 }
    );
  }

  const member = await prisma.admin.findFirst({
    where: { id, orgId: guard.session.orgId },
  });
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
