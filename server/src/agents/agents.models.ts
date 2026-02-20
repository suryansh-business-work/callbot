import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule {
  cronExpression: string;
  contactIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

export interface IAgent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  systemPrompt: string;
  voice: string;
  greeting: string;
  image: string | null;
  allowScheduling: boolean;
  schedule: ISchedule;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    systemPrompt: { type: String, required: true },
    voice: { type: String, default: 'shubh' },
    greeting: {
      type: String,
      default: 'Hello! I am your AI assistant. How can I help you today?',
    },
    image: { type: String, default: null },
    allowScheduling: { type: Boolean, default: true },
    schedule: {
      cronExpression: { type: String, default: '' },
      contactIds: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
      isActive: { type: Boolean, default: false },
      lastRunAt: { type: Date, default: null },
      nextRunAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const Agent = mongoose.model<IAgent>('Agent', agentSchema);
export default Agent;
