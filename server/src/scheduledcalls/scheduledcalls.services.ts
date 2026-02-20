import cron, { ScheduledTask } from 'node-cron';
import ScheduledCall, { IScheduledCall } from './scheduledcalls.models';
import Agent from '../agents/agents.models';
import Contact from '../contacts/contacts.models';
import { initiateAiCall } from '../ai/ai.services';
import { VoiceOption } from '../calls/calls.models';
import { emitGlobal } from '../websocket';
import { escapeRegex } from '../utils/regex';
import {
  CreateScheduledCallInput,
  UpdateScheduledCallInput,
  ScheduledCallListQueryInput,
} from './scheduledcalls.validators';

/** CRON tasks for recurring scheduled calls */
const recurringTasks = new Map<string, ScheduledTask>();

/* ─── CRUD ───────────────────────────────────────────────────── */

export const createScheduledCall = async (
  userId: string,
  data: CreateScheduledCallInput
): Promise<IScheduledCall> => {
  let manualOnly = false;

  // Check if agent allows scheduling
  if (data.agentId) {
    const agent = await Agent.findById(data.agentId);
    if (agent && !agent.allowScheduling) {
      manualOnly = true;
    }
  }

  const scheduledCall = await ScheduledCall.create({
    userId,
    contactId: data.contactId,
    agentId: data.agentId || null,
    scheduledAt: new Date(data.scheduledAt),
    source: data.source,
    reason: data.reason,
    cronExpression: data.cronExpression,
    isRecurring: data.isRecurring,
    note: data.note,
    voice: data.voice,
    language: data.language,
    systemPrompt: data.systemPrompt,
    message: data.message,
    aiEnabled: data.aiEnabled,
    manualOnly,
    status: manualOnly ? 'manual_required' : 'pending',
  });

  // If recurring, start CRON
  if (data.isRecurring && data.cronExpression && !manualOnly) {
    startRecurringTask(scheduledCall._id.toString(), data.cronExpression, userId);
  }

  // Emit event
  emitGlobal('scheduledcall:created', { scheduledCallId: scheduledCall._id });

  return scheduledCall.populate([
    { path: 'contactId', select: 'firstName lastName phone email' },
    { path: 'agentId', select: 'name' },
  ]);
};

export const getScheduledCalls = async (
  userId: string,
  query: ScheduledCallListQueryInput
) => {
  const { page, pageSize, status, contactId, agentId, source, sortBy, sortOrder, search } = query;
  const filter: Record<string, unknown> = { userId };

  if (status) filter.status = status;
  if (contactId) filter.contactId = contactId;
  if (agentId) filter.agentId = agentId;
  if (source) filter.source = source;

  // Text search: match against contact name/phone or reason/note
  if (search) {
    const regex = escapeRegex(search);
    const matchingContacts = await Contact.find({
      $or: [
        { firstName: { $regex: regex, $options: 'i' } },
        { lastName: { $regex: regex, $options: 'i' } },
        { phone: { $regex: regex, $options: 'i' } },
      ],
    }).select('_id').lean();
    const contactIds = matchingContacts.map((c) => c._id);
    filter.$or = [
      { contactId: { $in: contactIds } },
      { reason: { $regex: regex, $options: 'i' } },
      { note: { $regex: regex, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    ScheduledCall.find(filter)
      .populate('contactId', 'firstName lastName phone email')
      .populate('agentId', 'name')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ScheduledCall.countDocuments(filter),
  ]);

  return { data, pagination: { page, pageSize, total } };
};

export const getScheduledCallById = async (userId: string, id: string) => {
  return ScheduledCall.findOne({ _id: id, userId })
    .populate('contactId', 'firstName lastName phone email')
    .populate('agentId', 'name')
    .lean();
};

export const getScheduledCallsByContact = async (userId: string, contactId: string) => {
  return ScheduledCall.find({ userId, contactId })
    .populate('agentId', 'name')
    .sort({ scheduledAt: 1 })
    .lean();
};

export const updateScheduledCall = async (
  userId: string,
  id: string,
  data: UpdateScheduledCallInput
): Promise<IScheduledCall | null> => {
  const existing = await ScheduledCall.findOne({ _id: id, userId });
  if (!existing) return null;

  // If cancelling, stop recurring task
  if (data.status === 'cancelled') {
    stopRecurringTask(id);
  }

  // Update recurring CRON if changed
  if (data.cronExpression !== undefined || data.isRecurring !== undefined) {
    const newCron = data.cronExpression ?? existing.cronExpression;
    const newRecurring = data.isRecurring ?? existing.isRecurring;
    if (newRecurring && newCron) {
      startRecurringTask(id, newCron, userId);
    } else {
      stopRecurringTask(id);
    }
  }

  Object.assign(existing, data);
  if (data.scheduledAt) existing.scheduledAt = new Date(data.scheduledAt);
  await existing.save();

  return existing.populate([
    { path: 'contactId', select: 'firstName lastName phone email' },
    { path: 'agentId', select: 'name' },
  ]);
};

export const deleteScheduledCall = async (userId: string, id: string) => {
  stopRecurringTask(id);
  return ScheduledCall.findOneAndDelete({ _id: id, userId });
};

/* ─── Execute a scheduled call ───────────────────────────────── */

export const executeScheduledCall = async (
  scheduledCallId: string,
  userId: string,
  /** When true (e.g. 'Execute Now' from UI), bypass the manualOnly guard */
  force: boolean = false
): Promise<void> => {
  const sc = await ScheduledCall.findById(scheduledCallId).populate('contactId', 'firstName lastName phone');
  if (!sc || sc.status === 'completed' || sc.status === 'cancelled') return;

  // Only block automatic execution; forced (manual) execution is allowed
  if (sc.manualOnly && !force) {
    sc.status = 'manual_required';
    await sc.save();
    emitGlobal('scheduledcall:manual_required', {
      scheduledCallId: sc._id,
      message: 'You need to call this user manually, as scheduling is not enabled for your account.',
    });
    return;
  }

  const contact = sc.contactId as unknown as { firstName: string; lastName: string; phone: string };
  if (!contact?.phone) {
    sc.status = 'failed';
    sc.note = 'Contact has no phone number';
    await sc.save();
    return;
  }

  let agent = null;
  if (sc.agentId) {
    agent = await Agent.findById(sc.agentId);
  }

  // Mark as in-progress and broadcast so the UI updates live
  sc.status = 'in_progress';
  await sc.save();
  emitGlobal('scheduledcall:in_progress', {
    scheduledCallId: sc._id,
    contactName: `${contact.firstName} ${contact.lastName}`,
  });

  try {
    // Use per-schedule overrides when present, else fall back to agent defaults
    const voice = (sc.voice || agent?.voice || 'shubh') as VoiceOption;
    const greeting = sc.message || agent?.greeting || 'Hello! I am calling as scheduled.';
    const systemPrompt = sc.systemPrompt || agent?.systemPrompt;
    const language = sc.language || 'en-IN';

    const result = await initiateAiCall(
      contact.phone,
      greeting,
      voice,
      systemPrompt,
      sc.agentId?.toString(),
      userId,
      language
    );

    sc.status = 'completed';
    sc.callSid = result.data?.callSid || null;
    sc.lastExecutedAt = new Date();
    await sc.save();

    emitGlobal('scheduledcall:executed', {
      scheduledCallId: sc._id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      callSid: sc.callSid,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    sc.status = 'failed';
    sc.note = msg;
    await sc.save();
    console.error(`[ScheduledCall] Failed to execute ${scheduledCallId}: ${msg}`);
  }
};

/* ─── Recurring CRON tasks ───────────────────────────────────── */

const startRecurringTask = (scheduledCallId: string, cronExpression: string, userId: string) => {
  stopRecurringTask(scheduledCallId);
  if (!cron.validate(cronExpression)) return;

  const task = cron.schedule(cronExpression, async () => {
    // Reset status to pending for next execution
    await ScheduledCall.findByIdAndUpdate(scheduledCallId, { status: 'pending' });
    await executeScheduledCall(scheduledCallId, userId);
  });

  recurringTasks.set(scheduledCallId, task);
};

const stopRecurringTask = (scheduledCallId: string) => {
  const task = recurringTasks.get(scheduledCallId);
  if (task) {
    task.stop();
    recurringTasks.delete(scheduledCallId);
  }
};

/* ─── Process pending scheduled calls (called by interval) ──── */

export const processPendingScheduledCalls = async (): Promise<void> => {
  const now = new Date();
  const pendingCalls = await ScheduledCall.find({
    status: 'pending',
    isRecurring: false,
    scheduledAt: { $lte: now },
  });

  for (const sc of pendingCalls) {
    await executeScheduledCall(sc._id.toString(), sc.userId.toString());
  }
};

/* ─── Init recurring tasks on startup ────────────────────────── */

export const initRecurringScheduledCalls = async (): Promise<void> => {
  const recurring = await ScheduledCall.find({
    status: 'pending',
    isRecurring: true,
    cronExpression: { $ne: '' },
    manualOnly: false,
  });

  for (const sc of recurring) {
    startRecurringTask(sc._id.toString(), sc.cronExpression, sc.userId.toString());
  }

  if (recurring.length > 0) {
    console.log(`[ScheduledCalls] Initialized ${recurring.length} recurring task(s)`);
  }
};

export const stopAllRecurringTasks = (): void => {
  for (const [id, task] of recurringTasks) {
    task.stop();
    console.log(`[ScheduledCalls] Stopped recurring task ${id}`);
  }
  recurringTasks.clear();
};
