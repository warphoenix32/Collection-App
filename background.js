const DATABASE_NAME = "collection-platform-recovery";
const DATABASE_VERSION = 1;
const META_STORE = "checkpointMeta";
const CHUNK_STORE = "checkpointChunks";
const ACTIVE_KEY = "active";
const DEFAULT_CHUNK_SIZE = 500;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(META_STORE)) database.createObjectStore(META_STORE);
      if (!database.objectStoreNames.contains(CHUNK_STORE)) database.createObjectStore(CHUNK_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
  });
}

async function writeCheckpoint(checkpoint, chunkSize = DEFAULT_CHUNK_SIZE) {
  const database = await openDatabase();
  const messages = Array.isArray(checkpoint.messages) ? checkpoint.messages : [];
  const chunks = [];
  for (let index = 0; index < messages.length; index += chunkSize) chunks.push(messages.slice(index, index + chunkSize));
  const metadata = { ...checkpoint, messages: undefined, chunkCount: chunks.length, bufferedMessages: messages.length };
  const transaction = database.transaction([META_STORE, CHUNK_STORE], "readwrite");
  const metadataStore = transaction.objectStore(META_STORE);
  const chunkStore = transaction.objectStore(CHUNK_STORE);
  metadataStore.put(metadata, ACTIVE_KEY);
  chunkStore.clear();
  for (let index = 0; index < chunks.length; index += 1) chunkStore.put(chunks[index], `${ACTIVE_KEY}:${index}`);
  await transactionComplete(transaction);
  database.close();
  return { savedAt: metadata.savedAt, bufferedMessages: messages.length, chunkCount: chunks.length };
}

async function readCheckpoint() {
  const database = await openDatabase();
  const metadataTransaction = database.transaction(META_STORE, "readonly");
  const metadata = await requestResult(metadataTransaction.objectStore(META_STORE).get(ACTIVE_KEY));
  await transactionComplete(metadataTransaction);
  if (!metadata) {
    database.close();
    return null;
  }
  const chunkTransaction = database.transaction(CHUNK_STORE, "readonly");
  const store = chunkTransaction.objectStore(CHUNK_STORE);
  const chunkRequests = Array.from(
    { length: Number(metadata.chunkCount || 0) },
    (_, index) => requestResult(store.get(`${ACTIVE_KEY}:${index}`))
  );
  const chunks = await Promise.all(chunkRequests);
  await transactionComplete(chunkTransaction);
  database.close();
  return { ...metadata, messages: chunks.flatMap(chunk => Array.isArray(chunk) ? chunk : []) };
}

async function clearCheckpoint() {
  const database = await openDatabase();
  const transaction = database.transaction([META_STORE, CHUNK_STORE], "readwrite");
  transaction.objectStore(META_STORE).delete(ACTIVE_KEY);
  transaction.objectStore(CHUNK_STORE).clear();
  await transactionComplete(transaction);
  database.close();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.scope !== "collectionCheckpoint") return false;
  const operations = {
    read: () => readCheckpoint(),
    write: () => writeCheckpoint(request.checkpoint, request.chunkSize),
    clear: () => clearCheckpoint()
  };
  const operation = operations[request.action];
  if (!operation) {
    sendResponse({ success: false, error: `Unknown checkpoint action: ${request.action}` });
    return false;
  }
  operation()
    .then(value => sendResponse({ success: true, value }))
    .catch(error => sendResponse({ success: false, error: error.message }));
  return true;
});
