import cron, { ScheduledTask } from 'node-cron';
import Agent from './agents.models';
import Contact from '../contacts/contacts.models';
import { initiateAiCall } from '../ai/ai.services';
import { VoiceOption } from '../calls/calls.models';
import { emitGlobal } from '../websocket';

/** Map of agentId -> cron task */
const activeTasks = new Map<string, ScheduledTask>();

/**
 * Execute scheduled calls for an agent - calls each selected contact
 */
const executeScheduledCalls = async (agentId: string): Promise<void> => {
  try {
    const agent = await Agent.findById(agentId);
    if (!agent || !agent.schedule.isActive) return;

    const contacts = await Contact.find({
      _id: { $in: agent.schedule.contactIds },
    });

    if (contacts.length === 0) {
      console.log(`[Scheduler] Agent ${agent.name}: no contacts to call`);
      return;
    }

    console.log(
      `[Scheduler] Agent ${agent.name}: calling ${contacts.length} contact(s)`
    );

    // Update lastRunAt
    await Agent.findByIdAndUpdate(agentId, {
      'schedule.lastRunAt': new Date(),
    });

    // Initiate calls for each contact (sequentially to avoid rate limits)
    for (const contact of contacts) {
      if (!contact.phone) continue;
      try {
        await initiateAiCall(
          contact.phone,
          agent.greeting,
          agent.voice as VoiceOption,
          agent.systemPrompt,
          agentId,
          agent.userId.toString(),
          'en-IN'
        );
        console.log(
          `[Scheduler] Agent ${agent.name}: called ${contact.firstName} ${contact.lastName} at ${contact.phone}`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[Scheduler] Agent ${agent.name}: failed to call ${contact.phone} - ${msg}`
        );
      }
    }

    emitGlobal('schedule:executed', {
      agentId,
      agentName: agent.name,
      contactCount: contacts.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Scheduler] Error executing schedule for agent ${agentId}: ${msg}`);
  }
};

/**
 * Start or restart a CRON job for an agent
 */
export const startSchedule = (agentId: string, cronExpression: string): void => {
  // Stop existing task if any
  stopSchedule(agentId);

  if (!cronExpression || !cron.validate(cronExpression)) {
    console.warn(
      `[Scheduler] Invalid cron expression "${cronExpression}" for agent ${agentId}`
    );
    return;
  }

  const task = cron.schedule(cronExpression, () => {
    executeScheduledCalls(agentId);
  });

  activeTasks.set(agentId, task);
  console.log(
    `[Scheduler] Started schedule for agent ${agentId}: ${cronExpression}`
  );
};

/**
 * Stop a CRON job for an agent
 */
export const stopSchedule = (agentId: string): void => {
  const existing = activeTasks.get(agentId);
  if (existing) {
    existing.stop();
    activeTasks.delete(agentId);
    console.log(`[Scheduler] Stopped schedule for agent ${agentId}`);
  }
};

/**
 * Initialize all active schedules from DB on server start
 */
export const initAllSchedules = async (): Promise<void> => {
  try {
    const agents = await Agent.find({
      'schedule.isActive': true,
      'schedule.cronExpression': { $ne: '' },
    });

    for (const agent of agents) {
      startSchedule(agent._id.toString(), agent.schedule.cronExpression);
    }

    if (agents.length > 0) {
      console.log(`[Scheduler] Initialized ${agents.length} active schedule(s)`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Scheduler] Failed to initialize schedules: ${msg}`);
  }
};

/**
 * Stop all running schedules (for graceful shutdown)
 */
export const stopAllSchedules = (): void => {
  for (const [agentId, task] of activeTasks) {
    task.stop();
    console.log(`[Scheduler] Stopped schedule for agent ${agentId}`);
  }
  activeTasks.clear();
};

/**
 * Get number of currently active schedules
 */
export const getActiveScheduleCount = (): number => activeTasks.size;
