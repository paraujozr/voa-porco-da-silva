// Legacy Firebase adapter, retained for emulator regression checks.
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {createHandlers} from '../core/handlers.js';
initializeApp();
const handlers = createHandlers(getFirestore(), HttpsError);
const wrap = name =>
  onCall(
    {region: 'southamerica-east1', maxInstances: 3, timeoutSeconds: 30, memory: '256MiB'},
    req => {
      if (!req.auth || req.auth.token.firebase?.sign_in_provider === 'anonymous')
        throw new HttpsError('unauthenticated', 'Entre na sua conta.');
      return handlers[name](req.auth.uid, req.data || {});
    },
  );
export const ensureProfile = wrap('ensureProfile');
export const setNickname = wrap('setNickname');
export const buyItem = wrap('buyItem');
export const beginRun = wrap('beginRun');
export const settleRun = wrap('settleRun');
export const continueRun = wrap('continueRun');
export const createRoom = wrap('createRoom');
export const joinRoom = wrap('joinRoom');
export const readyRoom = wrap('readyRoom');
export const duelTick = wrap('duelTick');
export const leaveRoom = wrap('leaveRoom');
