import mongoose, { Schema, Document } from 'mongoose';

export type ScheduledCallStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'manual_required';
export type ScheduledCallSource = 'manual' | 'ai_detected' | 'agent_cron';

export interface IScheduledCall extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId | null;
  scheduledAt: Date;
  status: ScheduledCallStatus;
  source: ScheduledCallSource;
  reason: string;
  callSid: string | null;
  /** If the agent has allowScheduling=false, this will be true */
  manualOnly: boolean;
  /** Optional CRON expression for recurring scheduled calls */
  cronExpression: string;
  isRecurring: boolean;
  lastExecutedAt: Date | null;
  note: string;
  /** Call configuration overrides */
  voice: string;
  language: string;
  systemPrompt: string;
  message: string;
  aiEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledCallSchema = new Schema<IScheduledCall>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', default: null },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed', 'manual_required'],
      default: 'pending',
      index: true,
    },
    source: {
      type: String,
      enum: ['manual', 'ai_detected', 'agent_cron'],
      default: 'manual',
    },
    reason: { type: String, default: '' },
    callSid: { type: String, default: null },
    manualOnly: { type: Boolean, default: false },
    cronExpression: { type: String, default: '' },
    isRecurring: { type: Boolean, default: false },
    lastExecutedAt: { type: Date, default: null },
    note: { type: String, default: '' },
    voice: { type: String, default: '' },
    language: { type: String, default: '' },
    systemPrompt: { type: String, default: '' },
    message: { type: String, default: '' },
    aiEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

scheduledCallSchema.index({ userId: 1, status: 1, scheduledAt: 1 });
scheduledCallSchema.index({ contactId: 1, status: 1 });

const ScheduledCall = mongoose.model<IScheduledCall>('ScheduledCall', scheduledCallSchema);
export default ScheduledCall;
