import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { createInvitation } from '@/lib/invitations';
import { sendMail } from '@/lib/mailer';

// GET /api/invitations — list pending invitations for the org (admin only)
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const invitations = await prisma.invitation.findMany({
    where: {
      orgId: guard.session.orgId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json(invitations);
}

// POST /api/invitations — invite a user by email with an assigned role
// (admin only)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { email, role } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (role && role !== 'developer') {
    return NextResponse.json(
      { error: 'Role must be developer' }, { status: 400 }
    );
  }

  // Already a member?
  const existingMember = await prisma.admin.findUnique({ where: { email } });
  if (existingMember) {
    if (existingMember.orgId === guard.session.orgId) {
      return NextResponse.json(
        { error: 'This person is already a member of the organization' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'This email already belongs to another organization' },
      { status: 409 }
    );
  }

  const invitation = await createInvitation({
    email,
    role: role ?? 'developer',
    orgId: guard.session.orgId,
    invitedBy: guard.session.adminId,
  });

  const org = await prisma.organization.findUnique({
    where: { id: guard.session.orgId },
    select: { name: true },
  });

  const baseUrl = process.env.AUTH_BASE_URL ?? req.nextUrl.origin;
  const acceptUrl = `${baseUrl}/accept-invite?token=${invitation.token}`;

  let emailSent = false;
  try {
    await sendMail({
      to: email,
      subject: `You're invited to ${org?.name ?? 'an organization'} on Control Plane`,
      text: [
        `You've been invited to join ${org?.name ?? 'an organization'} as a ${invitation.role}.`,
        ``,
        `Accept the invitation here:`,
        acceptUrl,
        ``,
        `This link expires in 7 days.`,
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">You're invited</h2>
          <p>
            You've been invited to join
            <strong>${org?.name ?? 'an organization'}</strong> as a
            <strong>${invitation.role}</strong>.
          </p>
          <p>
            <a href="${acceptUrl}"
               style="display:inline-block;background:#0d9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
              Accept invitation
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px">This link expires in 7 days.</p>
        </div>
      `,
    });
    emailSent = true;
  } catch (err) {
    console.log(`\n[invitations] Email failed (${(err as Error).message}). Share this link manually:\n${acceptUrl}\n`);
  }

  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      emailSent,
      // Dev mode: surface the acceptance link when email couldn't be sent
      ...(emailSent ? {} : { inviteUrl: acceptUrl }),
    },
    { status: 201 }
  );
}
