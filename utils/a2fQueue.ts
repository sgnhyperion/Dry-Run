// utils/a2fQueue.ts
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 1 }); // Only 1 at a time

export const addToQueue = <T>(fn: () => Promise<T>): Promise<T> => {
  return queue.add(fn);
};
