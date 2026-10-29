const Tickets = require('../models/ticketModel');
const Users = require('../models/userModel');
const Audit = require('../models/auditModel');
const { AppError } = require('../middleware/errorHandler');

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
// Workflow: which status may follow which.
const TRANSITIONS = {
  'Open': ['In Progress'],
  'In Progress': ['Resolved', 'Open'],
  'Resolved': ['Closed', 'In Progress'],
  'Closed': [],
};

// Employees may only see their own tickets; a 404 avoids leaking that others exist.
function load(user, id) {
  const t = Tickets.findById(id);
  if (!t || (user.role === 'employee' && t.created_by !== user.id)) throw new AppError(404, 'Ticket not found');
  return t;
}

const create = (user, { title, description, priority, category }) => {
  const id = Tickets.create({ title: title.trim(), description: description.trim(), priority, category, createdBy: user.id });
  Audit.log(user.id, 'TICKET_CREATED', 'ticket', id, { title: title.trim(), priority });
  return Tickets.findById(id);
};

const list = (user, query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 50);
  const filters = {
    status: query.status, priority: query.priority, category: query.category, q: query.q,
    assignedTo: query.assignedTo === 'me' ? user.id : query.assignedTo,
    createdBy: user.role === 'employee' ? user.id : undefined,
  };
  const { rows, total } = Tickets.list(filters, limit, (page - 1) * limit);
  return { data: rows, page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) };
};

const get = (user, id) => ({ ...load(user, id), comments: Tickets.comments(id) });

const changeStatus = (user, id, status) => {
  const t = load(user, id);
  if (!STATUSES.includes(status)) throw new AppError(400, `Status must be one of: ${STATUSES.join(', ')}`);
  if (user.role === 'employee' && !(t.status === 'Resolved' && status === 'Closed'))
    throw new AppError(403, 'Employees can only close their resolved tickets');
  if (!TRANSITIONS[t.status].includes(status))
    throw new AppError(409, `Cannot move ticket from "${t.status}" to "${status}"`);
  let assignee = t.assigned_to;
  if (status === 'In Progress' && !assignee) {
    if (user.role !== 'agent') throw new AppError(409, 'Assign the ticket to an agent first');
    assignee = user.id; // agent picking up the ticket takes ownership
  }
  Tickets.updateStatus(id, status, assignee);
  Audit.log(user.id, 'STATUS_CHANGED', 'ticket', id, { from: t.status, to: status });
  return get(user, id);
};

const assign = (user, id, assigneeId) => {
  const t = load(user, id);
  if (t.status === 'Closed') throw new AppError(409, 'Closed tickets cannot be reassigned');
  if (user.role === 'agent' && assigneeId && Number(assigneeId) !== user.id)
    throw new AppError(403, 'Agents can only assign tickets to themselves');
  const target = user.role === 'agent' ? user.id : Number(assigneeId);
  const agent = Users.findById(target);
  if (!agent || agent.role !== 'agent') throw new AppError(400, 'Assignee must be an existing agent');
  Tickets.assign(id, target);
  Audit.log(user.id, 'TICKET_ASSIGNED', 'ticket', id, { assignedTo: agent.name });
  return get(user, id);
};

const addComment = (user, id, body) => {
  const t = load(user, id);
  if (t.status === 'Closed') throw new AppError(409, 'Cannot comment on a closed ticket');
  Tickets.addComment(id, user.id, body.trim());
  Audit.log(user.id, 'COMMENT_ADDED', 'ticket', id, {});
  return Tickets.comments(id);
};

module.exports = { create, list, get, changeStatus, assign, addComment, TRANSITIONS };
