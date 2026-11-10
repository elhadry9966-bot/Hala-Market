import { createClient } from 'npm:@supabase/supabase-js@2';
import type { User } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const allowedOrigin = Deno.env.get('APP_ORIGIN') ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};

type UserRole = 'admin' | 'user';
type Action = 'list' | 'set-role' | 'invite';

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed' });
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(500, { error: 'User management is not configured on the server.' });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response(401, { error: 'Authentication required.' });

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: callerResult, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerResult.user) return response(401, { error: 'Invalid authentication token.' });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: membership, error: membershipError } = await serviceClient
    .from('admin_memberships')
    .select('role')
    .eq('user_id', callerResult.user.id)
    .maybeSingle();

  if (membershipError) return response(500, { error: 'Could not verify administrator permissions.' });
  if (membership?.role !== 'admin') return response(403, { error: 'Administrator access required.' });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response(400, { error: 'Invalid JSON body.' });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return response(400, { error: 'A JSON object is required.' });
  }
  const payload = body as { action?: Action; email?: unknown; userId?: unknown; role?: UserRole };

  if (payload.action === 'list') {
    const membershipsResult = await serviceClient.from('admin_memberships').select('user_id, role');
    if (membershipsResult.error) return response(500, { error: 'Could not load user roles.' });
    const allUsers: User[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return response(500, { error: 'Could not load users.' });
      allUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const roleByUser = new Map(membershipsResult.data.map((item) => [item.user_id, item.role]));
    return response(200, {
      users: allUsers.map((user) => ({
        id: user.id,
        email: user.email ?? '',
        role: roleByUser.get(user.id) ?? 'user',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      })),
    });
  }

  if (payload.action === 'set-role') {
    if (
      typeof payload.userId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.userId) ||
      (payload.role !== 'admin' && payload.role !== 'user')
    ) {
      return response(400, { error: 'A valid user ID and role are required.' });
    }

    const { error: roleError } = await serviceClient.rpc('set_catalog_user_role', {
      p_user_id: payload.userId,
      p_role: payload.role,
    });
    if (roleError) {
      const status = roleError.code === '23514' ? 400 : 500;
      return response(status, { error: roleError.message });
    }

    return response(200, { success: true });
  }

  if (payload.action === 'invite') {
    if (typeof payload.email !== 'string') return response(400, { error: 'A valid email address is required.' });
    const email = payload.email.trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return response(400, { error: 'A valid email address is required.' });
    }
    if (payload.role !== 'admin' && payload.role !== 'user') {
      return response(400, { error: 'A valid user role is required.' });
    }

    const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) return response(400, { error: inviteError.message });
    if (payload.role === 'admin') {
      const { error: roleError } = await serviceClient.rpc('set_catalog_user_role', {
        p_user_id: invited.user.id,
        p_role: 'admin',
      });
      if (roleError) return response(500, { error: 'The invitation was sent but the administrator role could not be assigned.' });
    }
    return response(200, { success: true });
  }

  return response(400, { error: 'Unsupported action.' });
});
