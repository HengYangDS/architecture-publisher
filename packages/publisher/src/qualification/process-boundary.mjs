import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail, hasExactFields } from '../source/manifest.mjs';
import {
  runOwnedProcess,
  terminatePosixGroup,
  withOwnedProcessScope,
} from '../runtime/process-tree.mjs';

const ACK = 'qualification-ownership-ack';
const EVENT = 'qualification-ownership-event';
const MAX_OWNED_WORKERS = 128;
const QUALIFICATION_DEADLINE_MS = 120_000;
const qualificationWorker = fileURLToPath(new URL('./worker.mjs', import.meta.url));

function validEvent(value) {
  return (
    hasExactFields(value, ['kind', 'action', 'id', 'pid']) &&
    value.kind === EVENT &&
    ['register', 'release'].includes(value.action) &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    Number.isSafeInteger(value.pid) &&
    value.pid > 0
  );
}

/** Run one qualification worker under the existing process lifecycle. */
export async function runBoundedQualification({
  worker,
  requestPath,
  scratch,
  timeoutMs,
  maximumBytes,
  decode,
}) {
  const owned = new Set();
  let protocolError = false;
  let unreleasedAtCleanup = 0;
  return runOwnedProcess({
    worker,
    args: [],
    requestPath,
    scratch,
    timeoutMs,
    maximumBytes,
    failurePrefix: 'qualification',
    retainIpc: true,
    registerOwned: async (outerPid, child) => {
      child.on('message', (message) => {
        if (!validEvent(message)) {
          protocolError = true;
          return;
        }
        const accepted =
          message.action === 'register'
            ? message.pid !== outerPid && !owned.has(message.pid) && owned.size < MAX_OWNED_WORKERS
            : owned.has(message.pid);
        if (!accepted) protocolError = true;
        else if (message.action === 'register') owned.add(message.pid);
        else owned.delete(message.pid);
        child.send({ kind: ACK, id: message.id, accepted }, (error) => {
          if (error) protocolError = true;
        });
      });
    },
    releaseOwned: async () => {},
    ...(process.platform === 'win32'
      ? {}
      : {
          terminateTree: async (outerPid) => {
            unreleasedAtCleanup = owned.size;
            const failures = [];
            for (const pid of owned) {
              try {
                await terminatePosixGroup(pid);
              } catch (error) {
                failures.push(error);
              }
            }
            try {
              await terminatePosixGroup(outerPid);
            } catch (error) {
              failures.push(error);
            }
            if (failures.length) fail('qualification_cleanup_unproved');
          },
        }),
    decode(raw, state, reason, closedBeforeCleanup) {
      if (reason === 'timeout') fail('qualification_timeout');
      if (protocolError) fail('qualification_ownership_protocol_invalid');
      if (unreleasedAtCleanup || owned.size) fail('qualification_ownership_unreleased');
      if (reason !== 'reply' || closedBeforeCleanup || state.stderrBytes)
        fail('qualification_worker_failed');
      return decode(raw, state, reason, closedBeforeCleanup);
    },
  });
}

/** One private invocation owner for both v2 verification and public replay. */
export async function invokeQualificationWorker(operation, selection, executionChoice = []) {
  if (!['input', 'replay'].includes(operation) || !Array.isArray(executionChoice))
    fail('qualification_invocation_invalid');
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-qualification-'),
  );
  let retain = false;
  try {
    for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
    const requestPath = path.join(scratch, 'invocation.json');
    await fs.writeFile(
      requestPath,
      JSON.stringify({
        schema: 'architecture.qualification-invocation/v1',
        operation,
        selection: structuredClone(selection),
        executionChoice: structuredClone(executionChoice),
      }),
      { flag: 'wx', mode: 0o600 },
    );
    return await runBoundedQualification({
      worker: qualificationWorker,
      requestPath,
      scratch,
      timeoutMs: QUALIFICATION_DEADLINE_MS,
      maximumBytes: 16 * 1024 * 1024,
      decode(raw) {
        let envelope;
        try {
          envelope = JSON.parse(raw);
        } catch {
          fail('qualification_worker_reply_invalid');
        }
        if (hasExactFields(envelope, ['status', 'code']) && envelope.status === 'error') {
          if (typeof envelope.code !== 'string' || !/^[a-z][a-z0-9_]+$/u.test(envelope.code))
            fail('qualification_worker_reply_invalid');
          fail(envelope.code);
        }
        if (!hasExactFields(envelope, ['status', 'result']) || envelope.status !== 'ok')
          fail('qualification_worker_reply_invalid');
        return envelope.result;
      },
    });
  } catch (error) {
    retain = ['qualification_cleanup_unproved', 'qualification_cleanup_failed'].includes(
      error?.code,
    );
    if (retain) error.retainedScratch = scratch;
    throw error;
  } finally {
    if (!retain) await fs.rm(scratch, { recursive: true, force: true });
  }
}

/** Register each nested group with the independent parent before its code starts. */
export async function withQualificationOwnership(operation) {
  if (typeof operation !== 'function' || typeof process.send !== 'function')
    fail('qualification_owner_unavailable');
  let nextId = 0;
  const pending = new Map();
  const onMessage = (message) => {
    if (
      !hasExactFields(message, ['kind', 'id', 'accepted']) ||
      message.kind !== ACK ||
      !Number.isSafeInteger(message.id) ||
      typeof message.accepted !== 'boolean'
    )
      return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.accepted) waiter.resolve();
    else
      waiter.reject(
        Object.assign(new Error('qualification_ownership_rejected'), {
          code: 'qualification_ownership_rejected',
        }),
      );
  };
  const onDisconnect = () => {
    for (const waiter of pending.values())
      waiter.reject(
        Object.assign(new Error('qualification_owner_lost'), {
          code: 'qualification_owner_lost',
        }),
      );
    pending.clear();
  };
  process.on('message', onMessage);
  process.once('disconnect', onDisconnect);
  const exchange = (action, pid) => {
    if (!process.connected) fail('qualification_owner_lost');
    const id = ++nextId;
    const result = new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      process.send({ kind: EVENT, action, id, pid }, (error) => {
        if (!error) return;
        pending.delete(id);
        reject(error);
      });
    });
    result.catch(() => {});
    return result;
  };
  try {
    return await withOwnedProcessScope(
      {
        registerOwned: (pid) => exchange('register', pid),
        releaseOwned: (pid) => exchange('release', pid),
      },
      operation,
    );
  } finally {
    process.removeListener('message', onMessage);
    process.removeListener('disconnect', onDisconnect);
  }
}
