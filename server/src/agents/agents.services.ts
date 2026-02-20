import Agent, { IAgent } from './agents.models';
import { CreateAgentInput, UpdateAgentInput, AgentListQueryInput } from './agents.validators';
import { escapeRegex } from '../utils/regex';
import { startSchedule, stopSchedule } from './agents.scheduler';

export const createAgent = async (userId: string, data: CreateAgentInput): Promise<IAgent> => {
  const agent = await Agent.create({ userId, ...data });

  // Start schedule if configured and active
  if (data.schedule?.isActive && data.schedule?.cronExpression) {
    startSchedule(agent._id.toString(), data.schedule.cronExpression);
  }

  return agent;
};

export const getAgents = async (
  userId: string,
  query: AgentListQueryInput
): Promise<{ agents: IAgent[]; total: number }> => {
  const { page = 1, pageSize = 10, search } = query;
  const filter: Record<string, unknown> = { userId };

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  const [agents, total] = await Promise.all([
    Agent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('schedule.contactIds', 'firstName lastName phone'),
    Agent.countDocuments(filter),
  ]);

  return { agents, total };
};

export const getAgentById = async (userId: string, agentId: string): Promise<IAgent | null> => {
  return Agent.findOne({ _id: agentId, userId }).populate('schedule.contactIds', 'firstName lastName phone');
};

export const updateAgent = async (
  userId: string,
  agentId: string,
  data: UpdateAgentInput
): Promise<IAgent | null> => {
  // First fetch the existing agent to safely merge schedule fields
  const existing = await Agent.findOne({ _id: agentId, userId });
  if (!existing) return null;

  // Merge incoming schedule with existing schedule to prevent accidental overwrite
  if (data.schedule) {
    const existingSchedule = {
      cronExpression: existing.schedule.cronExpression,
      contactIds: existing.schedule.contactIds.map((id) => id.toString()),
      isActive: existing.schedule.isActive,
    };
    const mergedSchedule = { ...existingSchedule, ...data.schedule };
    data = { ...data, schedule: mergedSchedule as UpdateAgentInput['schedule'] };
  }

  const agent = await Agent.findOneAndUpdate(
    { _id: agentId, userId },
    data,
    { returnDocument: 'after', runValidators: true }
  );

  // Manage schedule based on merged values
  if (agent && data.schedule) {
    const { isActive, cronExpression } = agent.schedule;
    if (isActive && cronExpression && agent.allowScheduling) {
      startSchedule(agentId, cronExpression);
    } else {
      stopSchedule(agentId);
    }
  }

  return agent;
};

export const deleteAgent = async (userId: string, agentId: string): Promise<boolean> => {
  // Stop any active schedule before deleting
  stopSchedule(agentId);
  const result = await Agent.findOneAndDelete({ _id: agentId, userId });
  return !!result;
};
