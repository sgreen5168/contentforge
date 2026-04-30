import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// In-memory job store (use Redis/Bull in production)
const jobs = new Map();
const emitter = new EventEmitter();

export function createJob(data) {
  const id = uuidv4();
  const job = {
    id,
    status: 'queued',
    progress: 0,
    step: 'Queued',
    data,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export function updateJob(id, updates) {
  const job = jobs.get(id);
  if (!job) return null;
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  emitter.emit(`job:${id}`, updated);
  return updated;
}

export function getAllJobs() {
  return Array.from(jobs.values()).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function onJobUpdate(id, callback) {
  emitter.on(`job:${id}`, callback);
  return () => emitter.off(`job:${id}`, callback);
}

export { emitter };
