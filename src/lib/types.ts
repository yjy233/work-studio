export interface WikiFile {
  path: string;
  title: string;
  tags: string[];
  excerpt: string;
  updatedAt: string;
  version: string;
  links: string[];
  content: string;
}
export interface WikiDocument {
  path: string;
  content: string;
  version: string;
}
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
export interface Conversation {
  id: string;
  mode: 'ask' | 'maintain';
  messages: ChatMessage[];
  threadId?: string;
}
export interface AgentStatus {
  available: boolean;
  loggedIn: boolean;
  detail: string;
}
export interface LintResult {
  broken: { path: string; target: string }[];
  orphans: string[];
  total: number;
}
