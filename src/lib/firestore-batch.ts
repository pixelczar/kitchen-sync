// Batched Firestore writes to avoid animation jank
// From docs/architecture.md - critical performance optimization

type WriteFn = () => Promise<void>;

let writeQueue: WriteFn[] = [];
let writeTimeout: NodeJS.Timeout | null = null;

/**
 * Queue a Firestore write operation to be batched
 * Writes execute after 500ms of inactivity
 */
export const queueFirestoreWrite = (writeFn: WriteFn): void => {
  writeQueue.push(writeFn);
  
  // Clear existing timeout
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }
  
  // Execute all queued writes after 500ms
  writeTimeout = setTimeout(async () => {
    const writes = [...writeQueue];
    writeQueue = [];
    writeTimeout = null;
    
    // Execute all writes in parallel
    await Promise.all(writes.map(fn => fn().catch(err => {
      console.error('Firestore write failed:', err);
    })));
  }, 500);
};

/**
 * Force immediate execution of all queued writes
 * Use sparingly - defeats the purpose of batching
 */
export const flushWriteQueue = async (): Promise<void> => {
  if (writeTimeout) {
    clearTimeout(writeTimeout);
    writeTimeout = null;
  }
  
  const writes = [...writeQueue];
  writeQueue = [];
  
  await Promise.all(writes.map(fn => fn().catch(err => {
    console.error('Firestore write failed:', err);
  })));
};

