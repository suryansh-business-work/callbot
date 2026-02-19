import PromptTemplate, { IPromptTemplate } from './promptlibrary.models';
import { CreatePromptInput, UpdatePromptInput, PromptListQueryInput } from './promptlibrary.validators';

export const createPrompt = async (userId: string, data: CreatePromptInput): Promise<IPromptTemplate> => {
  return PromptTemplate.create({ userId, ...data });
};

export const getPrompts = async (
  userId: string,
  query: PromptListQueryInput
): Promise<{ prompts: IPromptTemplate[]; total: number }> => {
  const { page = 1, pageSize = 20, search } = query;
  const filter: Record<string, unknown> = { userId };

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
      { tags: { $in: [new RegExp(escaped, 'i')] } },
    ];
  }

  const [prompts, total] = await Promise.all([
    PromptTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    PromptTemplate.countDocuments(filter),
  ]);

  return { prompts, total };
};

export const getPromptById = async (userId: string, promptId: string): Promise<IPromptTemplate | null> => {
  return PromptTemplate.findOne({ _id: promptId, userId });
};

export const updatePrompt = async (
  userId: string,
  promptId: string,
  data: UpdatePromptInput
): Promise<IPromptTemplate | null> => {
  return PromptTemplate.findOneAndUpdate({ _id: promptId, userId }, data, { new: true, runValidators: true });
};

export const deletePrompt = async (userId: string, promptId: string): Promise<boolean> => {
  const result = await PromptTemplate.findOneAndDelete({ _id: promptId, userId });
  return !!result;
};
