import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// DELETE /api/invitations/[id] — revoke a pending invitation (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;

  const invitation = await prisma.invitation.findFirst({
    where: { id, orgId: guard.session.orgId, acceptedAt: null },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  await prisma.invitation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
