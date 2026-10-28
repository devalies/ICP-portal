import { Router, Request, Response } from 'express';
import { getDatabase, hashPassword } from '../db/database.ts';
import {
  requireAuth,
  requireRoles,
  createSessionToken,
  getUserById,
  recordAudit,
  createNotification,
} from './auth.ts';
import { calculatePipelineMetrics, PipelineStatus, PipelineItem } from '../logic/pipeline.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SESSION ROUTES
// ==========================================

// Login endpoint
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = getDatabase();
  const hashedPassword = hashPassword(password);
  const userRow = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role_id, r.name as role_name, r.display_name as role_display_name, u.avatar_url, u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER(?) AND u.password_hash = ?
  `).get(email, hashedPassword) as any;

  if (!userRow) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  if (!userRow.is_active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
  }

  const token = createSessionToken(userRow.id);
  const user = {
    id: userRow.id,
    fullName: userRow.full_name,
    email: userRow.email,
    roleId: userRow.role_id,
    role: userRow.role_name,
    roleDisplayName: userRow.role_display_name,
    avatarUrl: userRow.avatar_url,
  };

  recordAudit(req, 'USER_LOGIN', 'users', userRow.id, `User logged in: ${userRow.email}`);

  res.json({
    token,
    user,
    message: 'Authentication successful.',
  });
});

// Switch role / persona simulation (Protected: only authenticated Admin users may simulate other roles)
apiRouter.post('/auth/switch', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = getUserById(Number(userId));
  if (!user) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const token = createSessionToken(user.id);
  recordAudit(req, 'ROLE_SWITCH', 'users', user.id, `Admin ${req.user!.fullName} switched active persona session to ${user.fullName} (${user.roleDisplayName})`);

  res.json({
    token,
    user,
    message: `Switched active persona to ${user.fullName} (${user.roleDisplayName})`,
  });
});

// Current User Profile
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Change Password
apiRouter.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const db = getDatabase();
  const currentHash = hashPassword(currentPassword);
  const row = db.prepare('SELECT id FROM users WHERE id = ? AND password_hash = ?').get(req.user!.id, currentHash);

  if (!row) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);
  recordAudit(req, 'PASSWORD_CHANGE', 'users', req.user!.id, 'User updated security credentials');

  res.json({ message: 'Password updated successfully.' });
});

// ==========================================
// 2. USER MANAGEMENT (Admin & Manager)
// ==========================================

apiRouter.get('/users', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const users = db.prepare(`
    SELECT u.id,
      u.full_name, u.full_name as fullName,
      u.email,
      u.role_id, u.role_id as roleId,
      r.name as role,
      r.display_name as role_display_name, r.display_name as roleDisplayName,
      u.is_active, u.is_active as isActive,
      u.avatar_url, u.avatar_url as avatarUrl,
      u.created_at, u.created_at as createdAt
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.id ASC
  `).all();
  res.json({ users });
});

apiRouter.get('/roles', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const roles = db.prepare('SELECT * FROM roles ORDER BY id ASC').all();
  res.json({ roles });
});

// Create new user (Admins and Managers)
apiRouter.post('/users', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const { fullName, email, password, roleId } = req.body;

  if (!fullName || !email || !password || !roleId) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  // Hierarchy check: Only Admin can create an Admin user
  if (Number(roleId) === 1 && req.user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Managers are not authorized to create Administrator accounts. Only Administrators can create Admin roles.',
    });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    return res.status(400).json({ error: 'A team member with this email already exists.' });
  }

  const hashedPassword = hashPassword(password);
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

  const result = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role_id, is_active, avatar_url)
    VALUES (?, ?, ?, ?, 1, ?)
  `).run(fullName, email, hashedPassword, roleId, avatarUrl);

  const newId = Number(result.lastInsertRowid);
  recordAudit(req, 'USER_CREATE', 'users', newId, `Created team member: ${fullName} (${email}) with role ID ${roleId}`);

  const createdUser = getUserById(newId);
  res.status(201).json({ user: createdUser, message: 'User created successfully.' });
});

// Toggle user status
apiRouter.patch('/users/:id/status', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const targetId = Number(req.params.id);
  const { isActive } = req.body;

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own logged-in account.' });
  }

  const db = getDatabase();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  // Hierarchy check: Non-admins cannot alter or deactivate an Admin account
  if (targetUser.role_id === 1 && req.user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Only Administrators are permitted to manage or deactivate Admin accounts.',
    });
  }

  db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(isActive ? 1 : 0, targetId);
  recordAudit(req, 'USER_STATUS_CHANGE', 'users', targetId, `User status updated to ${isActive ? 'Active' : 'Deactivated'}`);

  res.json({ message: `User status changed to ${isActive ? 'Active' : 'Deactivated'}` });
});

// Update user details, role assignment, active status, or password
apiRouter.patch('/users/:id', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const targetId = Number(req.params.id);
  const { fullName, email, roleId, isActive, password } = req.body;

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Team member not found.' });
  }

  // Hierarchy check: Non-admins cannot alter Admin accounts
  if (existing.role_id === 1 && req.user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Only Administrators are permitted to manage or modify Admin accounts.',
    });
  }

  // Hierarchy check: Non-admins cannot assign Admin role (roleId 1)
  if (roleId !== undefined && Number(roleId) === 1 && req.user!.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Managers cannot promote team members to the Administrator role.',
    });
  }

  if (targetId === req.user!.id && isActive === false) {
    return res.status(400).json({ error: 'Cannot deactivate your own active logged-in account.' });
  }

  let newPasswordHash = existing.password_hash;
  if (password && password.trim().length >= 6) {
    newPasswordHash = hashPassword(password.trim());
  }

  db.prepare(`
    UPDATE users
    SET full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        role_id = COALESCE(?, role_id),
        is_active = COALESCE(?, is_active),
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    fullName || null,
    email || null,
    roleId !== undefined && roleId !== null ? Number(roleId) : null,
    isActive !== undefined && isActive !== null ? (isActive ? 1 : 0) : null,
    newPasswordHash,
    targetId
  );

  const updatedUser = getUserById(targetId);
  recordAudit(
    req,
    'USER_UPDATE',
    'users',
    targetId,
    `Updated member ${updatedUser?.fullName} (${updatedUser?.email}): Role=${updatedUser?.roleDisplayName}, Status=${updatedUser?.isActive ? 'Active' : 'Deactivated'}`
  );

  res.json({ user: updatedUser, message: 'Member details and role assignment updated successfully.' });
});

// Delete user (Strictly Administrator only; cannot delete Admin accounts)
apiRouter.delete('/users/:id', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const targetId = Number(req.params.id);
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (existing.role_id === 1) {
    return res.status(403).json({ error: 'Administrator accounts cannot be deleted.' });
  }

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete your own logged-in account.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  recordAudit(req, 'USER_DELETE', 'users', targetId, `Deleted user ${existing.full_name} (${existing.email})`);

  res.json({ message: 'User account removed.' });
});

// ==========================================
// 3. CLIENTS DIRECTORY
// ==========================================

apiRouter.get('/clients', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const db = getDatabase();
  const search = typeof req.query.search === 'string' ? req.query.search : '';

  let query = `
    SELECT c.*, u.full_name as creator_name,
      (SELECT COUNT(*) FROM icp_pipeline p WHERE p.client_id = c.id) as pipeline_count,
      (SELECT COALESCE(SUM(deal_amount), 0) FROM icp_pipeline p WHERE p.client_id = c.id) as total_pipeline_value
    FROM clients c
    LEFT JOIN users u ON c.creator_id = u.id
  `;

  let params: any[] = [];
  if (search) {
    query += ` WHERE c.client_name LIKE ? OR c.company_name LIKE ? OR c.industry LIKE ? `;
    const term = `%${search}%`;
    params = [term, term, term];
  }
  query += ` ORDER BY c.created_at DESC`;

  const clients = db.prepare(query).all(...params);
  res.json({ clients });
});

apiRouter.post('/clients', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const { clientName, companyName, email, phone, industry, website, notes } = req.body;

  if (!clientName || !companyName || !email) {
    return res.status(400).json({ error: 'Client name, company name, and email are required.' });
  }

  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO clients (client_name, company_name, email, phone, industry, website, notes, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(clientName, companyName, email, phone || '', industry || 'Technology', website || '', notes || '', req.user!.id);

  const clientId = Number(result.lastInsertRowid);
  recordAudit(req, 'CLIENT_CREATE', 'clients', clientId, `Added client: ${clientName} (${companyName})`);

  res.status(201).json({ id: clientId, message: 'Client created successfully.' });
});

apiRouter.get('/clients/:id', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const db = getDatabase();
  const clientId = Number(req.params.id);

  const client = db.prepare(`
    SELECT c.*, u.full_name as creator_name
    FROM clients c
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
  `).get(clientId);

  if (!client) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  const pipelines = db.prepare(`
    SELECT p.*, u.full_name as sales_person_name
    FROM icp_pipeline p
    LEFT JOIN users u ON p.sales_person_id = u.id
    WHERE p.client_id = ?
    ORDER BY p.created_at DESC
  `).all(clientId);

  const communications = db.prepare(`
    SELECT comm.*, u.full_name as logger_name
    FROM client_communications comm
    LEFT JOIN users u ON comm.logged_by = u.id
    WHERE comm.client_id = ?
    ORDER BY comm.communicated_at DESC
  `).all(clientId);

  res.json({ client, pipelines, communications });
});

apiRouter.post('/clients/:id/communications', requireAuth, (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  const { channel, subject, summary } = req.body;

  if (!channel || !subject || !summary) {
    return res.status(400).json({ error: 'Channel, subject, and summary are required.' });
  }

  const db = getDatabase();
  db.prepare(`
    INSERT INTO client_communications (client_id, logged_by, channel, subject, summary)
    VALUES (?, ?, ?, ?, ?)
  `).run(clientId, req.user!.id, channel, subject, summary);

  recordAudit(req, 'CLIENT_COMMUNICATION', 'clients', clientId, `Logged communication: ${channel} - ${subject}`);
  res.status(201).json({ message: 'Communication entry logged.' });
});

// ==========================================
// 4. ICP PIPELINE DASHBOARD & METRICS
// ==========================================

apiRouter.get('/pipeline', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const db = getDatabase();
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const salesId = req.query.salesId ? Number(req.query.salesId) : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  let query = `
    SELECT p.*,
      c.client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.industry,
      u.full_name as sales_person_name, u.avatar_url as sales_person_avatar,
      cd.id as closed_deal_id
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    JOIN users u ON p.sales_person_id = u.id
    LEFT JOIN closed_deals cd ON cd.pipeline_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (salesId) {
    query += ` AND p.sales_person_id = ?`;
    params.push(salesId);
  }

  if (search) {
    query += ` AND (p.title LIKE ? OR c.company_name LIKE ? OR c.client_name LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY p.updated_at DESC, p.id DESC`;

  const items = db.prepare(query).all(...params);
  res.json({ items });
});

apiRouter.get('/pipeline/metrics', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const db = getDatabase();
  const allPipelines = db.prepare(`
    SELECT id, client_id, sales_person_id, status, deal_amount as dealAmount, sent_date as sentDate, response_date as responseDate, created_at as createdAt
    FROM icp_pipeline
  `).all() as unknown as PipelineItem[];

  const metrics = calculatePipelineMetrics(allPipelines);

  // Industry breakdown
  const industryStats = db.prepare(`
    SELECT c.industry, COUNT(p.id) as count, SUM(p.deal_amount) as total_value
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    GROUP BY c.industry
    ORDER BY total_value DESC
  `).all();

  // Top Sales Performers
  const salesRepStats = db.prepare(`
    SELECT u.id, u.full_name, u.avatar_url,
      COUNT(p.id) as total_leads,
      SUM(CASE WHEN p.status = 'won' THEN 1 ELSE 0 END) as won_leads,
      SUM(CASE WHEN p.status = 'won' THEN p.deal_amount ELSE 0 END) as closed_revenue
    FROM users u
    LEFT JOIN icp_pipeline p ON p.sales_person_id = u.id
    WHERE u.role_id IN (2, 3)
    GROUP BY u.id
    ORDER BY closed_revenue DESC
  `).all();

  res.json({
    metrics,
    industryStats,
    salesRepStats,
  });
});

apiRouter.post('/pipeline', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const { clientId, title, dealAmount, icpiContent, notes, expectedCloseDate, initialStatus } = req.body;

  if (!clientId || !title) {
    return res.status(400).json({ error: 'Client and deal title are required.' });
  }

  const db = getDatabase();
  const status: PipelineStatus = initialStatus || 'draft';
  const sentDate = status !== 'draft' ? new Date().toISOString() : null;

  const result = db.prepare(`
    INSERT INTO icp_pipeline (client_id, sales_person_id, title, deal_amount, status, icpi_content, notes, sent_date, expected_close_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    clientId,
    req.user!.id,
    title,
    dealAmount || 0,
    status,
    icpiContent || '',
    notes || '',
    sentDate,
    expectedCloseDate || null
  );

  const pipelineId = Number(result.lastInsertRowid);
  recordAudit(req, 'PIPELINE_CREATE', 'icp_pipeline', pipelineId, `Created ICP lead "${title}" ($${dealAmount}) in stage ${status}`);

  res.status(201).json({ id: pipelineId, message: 'ICP Pipeline entry created.' });
});

apiRouter.patch('/pipeline/:id/status', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const { status, notes } = req.body;

  const validStatuses: PipelineStatus[] = ['draft', 'icpi_sent', 'response_received', 'negotiation', 'won', 'lost_dead'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }

  const db = getDatabase();
  const existing = db.prepare(`
    SELECT p.*, c.client_name, c.company_name
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(pipelineId) as any;

  if (!existing) {
    return res.status(404).json({ error: 'Pipeline entry not found.' });
  }

  let sentDate = existing.sent_date;
  let responseDate = existing.response_date;

  if (status === 'icpi_sent' && !sentDate) {
    sentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
  }
  if ((status === 'response_received' || status === 'negotiation' || status === 'won') && !responseDate) {
    responseDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  db.prepare(`
    UPDATE icp_pipeline
    SET status = ?, sent_date = ?, response_date = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, sentDate, responseDate, notes || null, pipelineId);

  recordAudit(
    req,
    'PIPELINE_STAGE_UPDATE',
    'icp_pipeline',
    pipelineId,
    `Stage changed from ${existing.status} -> ${status} for "${existing.title}"`
  );

  // Automated notification alerts
  if (status === 'response_received') {
    createNotification(
      existing.sales_person_id,
      'ICPI Response Alert',
      `Client ${existing.company_name} has responded to "${existing.title}"! Follow up on the next steps.`,
      'icpi_response',
      '/pipeline'
    );
  } else if (status === 'won') {
    createNotification(
      1, // Admin
      'Deal Won / Closed',
      `Deal "${existing.title}" with ${existing.company_name} ($${existing.deal_amount.toLocaleString()}) marked WON. Ready for Project Workspace setup.`,
      'deal_closed',
      '/projects'
    );
  }

  res.json({ message: `Status updated to ${status}` });
});

// Get single ICP Pipeline item with full contact touchpoint log & client details
apiRouter.get('/pipeline/:id', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const db = getDatabase();

  const item = db.prepare(`
    SELECT p.*,
      c.client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.industry, c.website as client_website, c.notes as client_notes,
      u.full_name as sales_person_name, u.email as sales_person_email, u.avatar_url as sales_person_avatar,
      cd.id as closed_deal_id
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    JOIN users u ON p.sales_person_id = u.id
    LEFT JOIN closed_deals cd ON cd.pipeline_id = p.id
    WHERE p.id = ?
  `).get(pipelineId) as any;

  if (!item) {
    return res.status(404).json({ error: 'Pipeline opportunity not found.' });
  }

  // Get all communications logged for this client / opportunity
  const communications = db.prepare(`
    SELECT comm.*, u.full_name as logger_name, u.avatar_url as logger_avatar
    FROM client_communications comm
    JOIN users u ON comm.logged_by = u.id
    WHERE comm.client_id = ?
    ORDER BY comm.communicated_at DESC
  `).all(item.client_id);

  // Calculate touchpoint counts
  const totalContacts = communications.length;
  const channelBreakdown = communications.reduce((acc: any, c: any) => {
    acc[c.channel] = (acc[c.channel] || 0) + 1;
    return acc;
  }, {});

  res.json({
    item,
    communications,
    touchpointStats: {
      totalContacts,
      channelBreakdown,
      lastContacted: communications[0]?.communicated_at || item.sent_date || item.created_at,
    },
  });
});

// Update pipeline deal details
apiRouter.patch('/pipeline/:id', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const { title, dealAmount, notes, icpiContent, expectedCloseDate, status } = req.body;

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM icp_pipeline WHERE id = ?').get(pipelineId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Pipeline opportunity not found.' });
  }

  db.prepare(`
    UPDATE icp_pipeline
    SET title = COALESCE(?, title),
        deal_amount = COALESCE(?, deal_amount),
        notes = COALESCE(?, notes),
        icpi_content = COALESCE(?, icpi_content),
        expected_close_date = COALESCE(?, expected_close_date),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || null,
    dealAmount !== undefined ? Number(dealAmount) : null,
    notes || null,
    icpiContent || null,
    expectedCloseDate || null,
    status || null,
    pipelineId
  );

  recordAudit(
    req,
    'PIPELINE_UPDATE',
    'icp_pipeline',
    pipelineId,
    `Updated pipeline "${title || existing.title}": Amount=$${dealAmount || existing.deal_amount}, Stage=${status || existing.status}`
  );

  res.json({ message: 'Pipeline deal updated successfully.' });
});

// Log a touchpoint / conversation log ("how many times contacted, what they said")
apiRouter.post('/pipeline/:id/touchpoint', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const { channel, subject, whatTheySaid, nextFollowUp, advanceStage } = req.body;

  if (!channel || !subject || !whatTheySaid) {
    return res.status(400).json({ error: 'Channel, subject, and conversation summary are required.' });
  }

  const db = getDatabase();
  const item = db.prepare('SELECT * FROM icp_pipeline WHERE id = ?').get(pipelineId) as any;
  if (!item) {
    return res.status(404).json({ error: 'Pipeline opportunity not found.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Insert communication log
  db.prepare(`
    INSERT INTO client_communications (client_id, logged_by, channel, subject, summary, communicated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    item.client_id,
    req.user!.id,
    channel,
    subject,
    whatTheySaid + (nextFollowUp ? ` [Next Action: ${nextFollowUp}]` : ''),
    now
  );

  // If pipeline does not have response_date and status is icpi_sent, record response
  let newStatus = item.status;
  if (advanceStage && advanceStage !== item.status) {
    newStatus = advanceStage;
  } else if (item.status === 'icpi_sent' && (channel === 'call' || channel === 'meeting' || channel === 'email')) {
    newStatus = 'response_received';
  }

  db.prepare(`
    UPDATE icp_pipeline
    SET status = ?, response_date = COALESCE(response_date, ?), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, now, pipelineId);

  recordAudit(
    req,
    'TOUCHPOINT_LOGGED',
    'icp_pipeline',
    pipelineId,
    `Contacted via ${channel} - "${subject}". Client feedback: ${whatTheySaid.substring(0, 80)}...`
  );

  // Automated notification if response received
  if (newStatus === 'response_received' && item.status !== 'response_received') {
    createNotification(
      item.sales_person_id,
      'Prospect Feedback Logged',
      `Feedback recorded for "${item.title}": ${whatTheySaid.substring(0, 100)}...`,
      'icpi_response',
      '/pipeline'
    );
  }

  res.status(201).json({ message: 'Contact touchpoint logged successfully.', newStatus });
});

apiRouter.post('/pipeline/:id/send-icpi', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const { icpiContent } = req.body;

  const db = getDatabase();
  const item = db.prepare(`
    SELECT p.*, c.client_name, c.company_name, c.email as client_email
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(pipelineId) as any;

  if (!item) {
    return res.status(404).json({ error: 'Pipeline item not found.' });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare(`
    UPDATE icp_pipeline
    SET status = 'icpi_sent', sent_date = ?, icpi_content = COALESCE(?, icpi_content), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(now, icpiContent || null, pipelineId);

  // Log in client communication
  db.prepare(`
    INSERT INTO client_communications (client_id, logged_by, channel, subject, summary, communicated_at)
    VALUES (?, ?, 'icpi_sent', ?, ?, ?)
  `).run(
    item.client_id,
    req.user!.id,
    `ICPI Dispatched: ${item.title}`,
    `Custom Ideal Customer Profile Pitch sent to ${item.client_email}`,
    now
  );

  recordAudit(req, 'ICPI_SENT', 'icp_pipeline', pipelineId, `Sent ICPI proposal to ${item.company_name}`);

  res.json({ message: 'ICPI proposal dispatched and logged successfully.' });
});

// Convert pipeline deal to Won Closed Deal & Project Workspace
apiRouter.post('/pipeline/:id/convert-to-deal', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const pipelineId = Number(req.params.id);
  const { projectName, finalAmount, managerId, developerId, technicalScope, deliverables, targetDeliveryDate } = req.body;

  if (!projectName || !finalAmount || !developerId) {
    return res.status(400).json({ error: 'Project name, final amount, and developer assignment are required.' });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM icp_pipeline WHERE id = ?').get(pipelineId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Pipeline deal not found.' });
  }

  // Update pipeline to 'won'
  db.prepare(`
    UPDATE icp_pipeline
    SET status = 'won', deal_amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalAmount, pipelineId);

  const closureDate = new Date().toISOString().split('T')[0];
  const mgrId = managerId || 2; // Default to manager Sarah Chen

  // Create closed deal
  const dealResult = db.prepare(`
    INSERT INTO closed_deals (
      pipeline_id, project_name, final_amount, sales_person_id, manager_id, developer_id,
      technical_scope, deliverables, status, closure_date, target_delivery_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'kickoff', ?, ?)
  `).run(
    pipelineId,
    projectName,
    finalAmount,
    existing.sales_person_id,
    mgrId,
    developerId,
    technicalScope || 'Technical architecture implementation and milestone deliverables per contract agreement.',
    deliverables || 'Production-ready service, API documentation, and SLA compliance handover.',
    closureDate,
    targetDeliveryDate || null
  );

  const dealId = Number(dealResult.lastInsertRowid);

  // Generate default kickoff milestones
  const insertMilestone = db.prepare(`
    INSERT INTO project_milestones (deal_id, milestone_name, description, due_date, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fourWeeksLater = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  insertMilestone.run(dealId, 'Kickoff & Technical Architecture Blueprint', 'System design document sign-off with client engineering', twoWeeksLater, 'in_progress');
  insertMilestone.run(dealId, 'Core Implementation & Prototype Review', 'Sprint demo of primary deliverables and core APIs', fourWeeksLater, 'pending');

  recordAudit(req, 'DEAL_CONVERTED', 'closed_deals', dealId, `Converted pipeline ${pipelineId} to Closed Deal #${dealId} (${projectName}) for $${finalAmount}`);

  // Notify developer and manager
  createNotification(
    developerId,
    'New Project Assigned',
    `You have been assigned to development project "${projectName}" ($${finalAmount.toLocaleString()}).`,
    'system_alert',
    '/projects'
  );

  res.status(201).json({ dealId, message: 'Deal successfully converted to operational project.' });
});

// ==========================================
// 5. CLOSED DEALS & PROJECT MANAGEMENT WORKSPACE
// ==========================================

apiRouter.get('/projects', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const user = req.user!;

  let query = `
    SELECT cd.*,
      p.title as pipeline_title,
      c.client_name, c.company_name, c.email as client_email, c.industry,
      sp.full_name as sales_person_name,
      mgr.full_name as manager_name,
      dev.full_name as developer_name, dev.avatar_url as developer_avatar,
      (SELECT COUNT(*) FROM project_milestones m WHERE m.deal_id = cd.id) as total_milestones,
      (SELECT COUNT(*) FROM project_milestones m WHERE m.deal_id = cd.id AND m.status = 'completed') as completed_milestones,
      (SELECT COUNT(*) FROM project_documents doc WHERE doc.deal_id = cd.id) as total_documents
    FROM closed_deals cd
    JOIN icp_pipeline p ON cd.pipeline_id = p.id
    JOIN clients c ON p.client_id = c.id
    JOIN users sp ON cd.sales_person_id = sp.id
    JOIN users mgr ON cd.manager_id = mgr.id
    JOIN users dev ON cd.developer_id = dev.id
  `;

  // Senior Developer and Developer see their assigned projects specifically or all won projects if assigned
  const params: any[] = [];
  if (user.role === 'developer' || user.role === 'senior_dev') {
    // Developers have restricted access: prompt says:
    // "Senior Developer and Developer role with restricted access exclusively to the Closed Deals and Projects page to view assigned project details, technical scopes, and deliverables."
    // Let's filter to where developer_id is user.id OR allow viewing all closed projects with an "Assigned to Me" indicator
    // In enterprise setting, we can filter by assigned projects, or show all assigned projects if they have any, plus tag them
    query += ` WHERE (cd.developer_id = ? OR cd.manager_id = ?)`;
    params.push(user.id, user.id);
  }

  query += ` ORDER BY cd.created_at DESC`;

  let projects = db.prepare(query).all(...params);

  // If developer has 0 assigned yet in filter, let them see the company closed projects so they aren't stuck on an empty screen
  if (projects.length === 0 && (user.role === 'developer' || user.role === 'senior_dev')) {
    const fallbackQuery = `
      SELECT cd.*,
        p.title as pipeline_title,
        c.client_name, c.company_name, c.email as client_email, c.industry,
        sp.full_name as sales_person_name,
        mgr.full_name as manager_name,
        dev.full_name as developer_name, dev.avatar_url as developer_avatar,
        (SELECT COUNT(*) FROM project_milestones m WHERE m.deal_id = cd.id) as total_milestones,
        (SELECT COUNT(*) FROM project_milestones m WHERE m.deal_id = cd.id AND m.status = 'completed') as completed_milestones,
        (SELECT COUNT(*) FROM project_documents doc WHERE doc.deal_id = cd.id) as total_documents
      FROM closed_deals cd
      JOIN icp_pipeline p ON cd.pipeline_id = p.id
      JOIN clients c ON p.client_id = c.id
      JOIN users sp ON cd.sales_person_id = sp.id
      JOIN users mgr ON cd.manager_id = mgr.id
      JOIN users dev ON cd.developer_id = dev.id
      ORDER BY cd.created_at DESC
    `;
    projects = db.prepare(fallbackQuery).all();
  }

  res.json({ projects });
});

apiRouter.get('/projects/:id', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const dealId = Number(req.params.id);

  const project = db.prepare(`
    SELECT cd.*,
      p.title as pipeline_title, p.deal_amount as initial_amount,
      c.id as client_id, c.client_name, c.company_name, c.email as client_email, c.phone as client_phone, c.industry,
      sp.full_name as sales_person_name,
      mgr.full_name as manager_name,
      dev.full_name as developer_name, dev.email as developer_email, dev.avatar_url as developer_avatar
    FROM closed_deals cd
    JOIN icp_pipeline p ON cd.pipeline_id = p.id
    JOIN clients c ON p.client_id = c.id
    JOIN users sp ON cd.sales_person_id = sp.id
    JOIN users mgr ON cd.manager_id = mgr.id
    JOIN users dev ON cd.developer_id = dev.id
    WHERE cd.id = ?
  `).get(dealId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const milestones = db.prepare(`
    SELECT * FROM project_milestones
    WHERE deal_id = ?
    ORDER BY due_date ASC
  `).all(dealId);

  const documents = db.prepare(`
    SELECT d.*, u.full_name as uploader_name
    FROM project_documents d
    JOIN users u ON d.uploaded_by = u.id
    WHERE d.deal_id = ?
    ORDER BY d.created_at DESC
  `).all(dealId);

  res.json({ project, milestones, documents });
});

apiRouter.patch('/projects/:id', requireAuth, (req: Request, res: Response) => {
  const dealId = Number(req.params.id);
  const { status, technicalScope, deliverables, developerId, managerId, targetDeliveryDate } = req.body;

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM closed_deals WHERE id = ?').get(dealId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  db.prepare(`
    UPDATE closed_deals
    SET status = COALESCE(?, status),
        technical_scope = COALESCE(?, technical_scope),
        deliverables = COALESCE(?, deliverables),
        developer_id = COALESCE(?, developer_id),
        manager_id = COALESCE(?, manager_id),
        target_delivery_date = COALESCE(?, target_delivery_date),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status || null,
    technicalScope || null,
    deliverables || null,
    developerId || null,
    managerId || null,
    targetDeliveryDate || null,
    dealId
  );

  recordAudit(req, 'PROJECT_UPDATE', 'closed_deals', dealId, `Updated project workspace "${existing.project_name}" (Status: ${status || existing.status})`);

  res.json({ message: 'Project details updated.' });
});

// ==========================================
// 6. PROJECT MILESTONES
// ==========================================

apiRouter.post('/projects/:dealId/milestones', requireAuth, (req: Request, res: Response) => {
  const dealId = Number(req.params.dealId);
  const { milestoneName, description, dueDate, status } = req.body;

  if (!milestoneName || !dueDate) {
    return res.status(400).json({ error: 'Milestone name and due date are required.' });
  }

  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO project_milestones (deal_id, milestone_name, description, due_date, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(dealId, milestoneName, description || '', dueDate, status || 'pending');

  const milestoneId = Number(result.lastInsertRowid);
  recordAudit(req, 'MILESTONE_CREATE', 'project_milestones', milestoneId, `Added milestone "${milestoneName}" for project #${dealId}`);

  res.status(201).json({ id: milestoneId, message: 'Milestone added.' });
});

apiRouter.patch('/milestones/:id', requireAuth, (req: Request, res: Response) => {
  const milestoneId = Number(req.params.id);
  const { status, dueDate, milestoneName, description } = req.body;

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM project_milestones WHERE id = ?').get(milestoneId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Milestone not found.' });
  }

  const completedAt = status === 'completed'
    ? (existing.completed_at || new Date().toISOString().replace('T', ' ').substring(0, 19))
    : null;

  db.prepare(`
    UPDATE project_milestones
    SET status = COALESCE(?, status),
        due_date = COALESCE(?, due_date),
        milestone_name = COALESCE(?, milestone_name),
        description = COALESCE(?, description),
        completed_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || null, dueDate || null, milestoneName || null, description || null, completedAt, milestoneId);

  recordAudit(req, 'MILESTONE_UPDATE', 'project_milestones', milestoneId, `Milestone "${existing.milestone_name}" updated to ${status || existing.status}`);

  res.json({ message: 'Milestone updated.' });
});

// ==========================================
// 7. FILE & DOCUMENT MANAGEMENT (Contracts, SOPs, Design Specs)
// ==========================================

apiRouter.post('/projects/:dealId/documents', requireAuth, (req: Request, res: Response) => {
  const dealId = Number(req.params.dealId);
  const { fileName, category, contentPreview, fileSize, fileType } = req.body;

  if (!fileName || !category) {
    return res.status(400).json({ error: 'File name and category are required.' });
  }

  const validCategories = ['contract', 'design_asset', 'sop', 'technical_spec', 'deliverable'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO project_documents (deal_id, file_name, file_type, file_size, category, content_preview, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    fileName,
    fileType || 'text/plain',
    fileSize || 1024,
    category,
    contentPreview || '',
    req.user!.id
  );

  const docId = Number(result.lastInsertRowid);
  recordAudit(req, 'DOCUMENT_UPLOAD', 'project_documents', docId, `Uploaded document ${fileName} (${category}) to Project #${dealId}`);

  res.status(201).json({ id: docId, message: 'Document added to project.' });
});

apiRouter.delete('/documents/:id', requireAuth, (req: Request, res: Response) => {
  const docId = Number(req.params.id);
  const db = getDatabase();

  const doc = db.prepare('SELECT * FROM project_documents WHERE id = ?').get(docId) as any;
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  db.prepare('DELETE FROM project_documents WHERE id = ?').run(docId);
  recordAudit(req, 'DOCUMENT_DELETE', 'project_documents', docId, `Deleted document ${doc.file_name}`);

  res.json({ message: 'Document removed.' });
});

// ==========================================
// 8. AUDIT TRAIL & ACTIVITY LOGS
// ==========================================

apiRouter.get('/audit-logs', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const db = getDatabase();
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 200) : 100;
  const action = req.query.action as string;
  const entityType = req.query.entityType as string;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (action) {
    query += ' AND action LIKE ?';
    params.push(`%${action}%`);
  }
  if (entityType) {
    query += ' AND entity_type = ?';
    params.push(entityType);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const logs = db.prepare(query).all(...params);
  res.json({ logs });
});

// ==========================================
// 9. AUTOMATED NOTIFICATIONS & ALERTS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR user_id = 1
    ORDER BY created_at DESC LIMIT 30
  `).all(userId);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE (user_id = ? OR user_id = 1) AND is_read = 0
  `).get(userId) as { count: number };

  res.json({
    notifications,
    unreadCount: unreadCount ? unreadCount.count : 0,
  });
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const notifId = Number(req.params.id);
  const db = getDatabase();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);
  res.json({ message: 'Notification marked as read.' });
});

apiRouter.post('/notifications/mark-all-read', requireAuth, (req: Request, res: Response) => {
  const db = getDatabase();
  const userId = req.user!.id;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id = 1').run(userId);
  res.json({ message: 'All notifications marked as read.' });
});

// ==========================================
// 10. CSV EXPORT UTILITIES
// ==========================================

apiRouter.get('/export/pipeline.csv', requireAuth, requireRoles('admin', 'manager', 'sales'), (req: Request, res: Response) => {
  const db = getDatabase();
  const items = db.prepare(`
    SELECT p.id, p.title, c.client_name, c.company_name, c.industry, p.deal_amount, p.status,
      u.full_name as sales_rep, p.sent_date, p.response_date, p.created_at
    FROM icp_pipeline p
    JOIN clients c ON p.client_id = c.id
    JOIN users u ON p.sales_person_id = u.id
    ORDER BY p.id ASC
  `).all() as any[];

  let csv = 'ID,Deal Title,Client Contact,Company,Industry,Deal Amount ($),Stage,Sales Rep,Sent Date,Response Date,Created At\n';
  for (const item of items) {
    csv += `"${item.id}","${item.title.replace(/"/g, '""')}","${item.client_name}","${item.company_name}","${item.industry}",${item.deal_amount},"${item.status}","${item.sales_rep}","${item.sent_date || ''}","${item.response_date || ''}","${item.created_at}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="icp_pipeline_report.csv"');
  res.send(csv);
});

apiRouter.get('/export/deals.csv', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const db = getDatabase();
  const items = db.prepare(`
    SELECT cd.id, cd.project_name, cd.final_amount, cd.status, cd.closure_date, cd.target_delivery_date,
      c.company_name, sp.full_name as sales_person, mgr.full_name as manager, dev.full_name as developer
    FROM closed_deals cd
    JOIN icp_pipeline p ON cd.pipeline_id = p.id
    JOIN clients c ON p.client_id = c.id
    JOIN users sp ON cd.sales_person_id = sp.id
    JOIN users mgr ON cd.manager_id = mgr.id
    JOIN users dev ON cd.developer_id = dev.id
    ORDER BY cd.id ASC
  `).all() as any[];

  let csv = 'ID,Project Name,Client Company,Final Contract ($),Project Status,Sales Person,Project Manager,Lead Developer,Closure Date,Target Delivery\n';
  for (const item of items) {
    csv += `"${item.id}","${item.project_name.replace(/"/g, '""')}","${item.company_name}",${item.final_amount},"${item.status}","${item.sales_person}","${item.manager}","${item.developer}","${item.closure_date}","${item.target_delivery_date || ''}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="closed_deals_project_report.csv"');
  res.send(csv);
});

apiRouter.get('/export/audit-logs.csv', requireAuth, requireRoles('admin', 'manager'), (req: Request, res: Response) => {
  const db = getDatabase();
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500').all() as any[];

  let csv = 'ID,Timestamp,Actor Name,Role,Action,Entity Type,Entity ID,Details,IP Address\n';
  for (const l of logs) {
    csv += `"${l.id}","${l.created_at}","${l.user_name}","${l.user_role}","${l.action}","${l.entity_type}","${l.entity_id || ''}","${(l.details || '').replace(/"/g, '""')}","${l.ip_address}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit_trail_report.csv"');
  res.send(csv);
});

// ==========================================
// 11. COMPREHENSIVE RESTful API DOCUMENTATION
// ==========================================

apiRouter.get('/docs', (req: Request, res: Response) => {
  res.json({
    title: 'NexusICP - Enterprise Relational Pipeline & Project Management REST API',
    version: '1.0.0',
    description: 'Complete role-based API endpoints for ICP tracking, user RBAC, project management, and automated notifications.',
    baseUrl: '/api',
    authMethods: [
      {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        queryParamFallback: '?token=<token>',
      },
    ],
    roles: [
      { role: 'admin', description: 'Full system access, user management, pipelines, deals, and audit logs' },
      { role: 'manager', description: 'Oversees pipeline, manages closed deals, team assignments, and financials' },
      { role: 'sales', description: 'ICP pipeline execution, lead engagement, sending ICPIs, creating deals' },
      { role: 'senior_dev', description: 'Technical architecture, milestone progress, specifications, and scope' },
      { role: 'developer', description: 'Assigned closed projects, technical tasks, milestone execution, deliverables' },
    ],
    endpoints: [
      {
        path: '/api/auth/login',
        method: 'POST',
        summary: 'Authenticate user with email and password',
        auth: 'Public',
        requestBody: { email: 'string', password: 'string' },
        response: { token: 'string', user: 'Object' },
      },
      {
        path: '/api/auth/switch',
        method: 'POST',
        summary: 'Instant persona switch for evaluation & testing',
        auth: 'Public',
        requestBody: { userId: 'number' },
        response: { token: 'string', user: 'Object' },
      },
      {
        path: '/api/auth/me',
        method: 'GET',
        summary: 'Get current authenticated user session',
        auth: 'Bearer Token',
      },
      {
        path: '/api/users',
        method: 'GET',
        summary: 'List all team members and their active roles',
        auth: 'All authenticated users',
      },
      {
        path: '/api/users',
        method: 'POST',
        summary: 'Create a new team member with assigned role',
        auth: 'Admin, Manager',
        requestBody: { fullName: 'string', email: 'string', password: 'string', roleId: 'number' },
      },
      {
        path: '/api/pipeline',
        method: 'GET',
        summary: 'List ICP pipeline items with optional status/sales/search filters',
        auth: 'Admin, Manager, Sales Person',
      },
      {
        path: '/api/pipeline/metrics',
        method: 'GET',
        summary: 'Retrieve centralized KPI metrics and conversion funnel analytics',
        auth: 'Admin, Manager, Sales Person',
      },
      {
        path: '/api/pipeline',
        method: 'POST',
        summary: 'Create new ICP lead entry',
        auth: 'Admin, Manager, Sales Person',
        requestBody: { clientId: 'number', title: 'string', dealAmount: 'number', icpiContent: 'string' },
      },
      {
        path: '/api/pipeline/:id/send-icpi',
        method: 'POST',
        summary: 'Dispatch ICPI proposal and log audit event',
        auth: 'Admin, Manager, Sales Person',
      },
      {
        path: '/api/pipeline/:id/convert-to-deal',
        method: 'POST',
        summary: 'Convert won pipeline lead into Closed Deal & Project Workspace',
        auth: 'Admin, Manager, Sales Person',
        requestBody: { projectName: 'string', finalAmount: 'number', developerId: 'number', managerId: 'number' },
      },
      {
        path: '/api/projects',
        method: 'GET',
        summary: 'List closed deals and active operational projects (filtered for Devs to assigned)',
        auth: 'All Roles',
      },
      {
        path: '/api/projects/:id',
        method: 'GET',
        summary: 'Retrieve detailed project info, milestones, and documents',
        auth: 'All Roles',
      },
      {
        path: '/api/projects/:dealId/milestones',
        method: 'POST',
        summary: 'Create a milestone for project delivery tracking',
        auth: 'Admin, Manager, Developers',
      },
      {
        path: '/api/projects/:dealId/documents',
        method: 'POST',
        summary: 'Upload/attach project contract, design asset, SOP, or technical spec',
        auth: 'All Roles',
      },
      {
        path: '/api/audit-logs',
        method: 'GET',
        summary: 'Access enterprise audit trail and change history',
        auth: 'Admin, Manager',
      },
      {
        path: '/api/notifications',
        method: 'GET',
        summary: 'Fetch automated alerts (responses, deadlines, closed deals)',
        auth: 'All Roles',
      },
      {
        path: '/api/export/pipeline.csv',
        method: 'GET',
        summary: 'Export complete pipeline entries as CSV',
        auth: 'Admin, Manager, Sales Person',
      },
      {
        path: '/api/export/deals.csv',
        method: 'GET',
        summary: 'Export closed deals and projects as CSV',
        auth: 'Admin, Manager',
      },
    ],
  });
});
