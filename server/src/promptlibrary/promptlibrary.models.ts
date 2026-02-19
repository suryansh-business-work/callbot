import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  language: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const promptTemplateSchema = new Schema<IPromptTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    systemPrompt: { type: String, required: true },
    firstMessage: { type: String, default: '' },
    language: { type: String, default: 'en-IN' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const PromptTemplate = mongoose.model<IPromptTemplate>('PromptTemplate', promptTemplateSchema);
export default PromptTemplate;
