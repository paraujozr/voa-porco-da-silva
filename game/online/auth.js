import {scryptAsync} from '@noble/hashes/scrypt.js';
import {randomBytes, createHash, timingSafeEqual} from 'node:crypto';
export class ApiError extends Error {constructor(code,message){super(message);this.code=code;}}
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const secret=()=>randomBytes(32).toString('hex');
export function username(value){if(typeof value!=='string'||! /^[a-zA-Z0-9_]{3,18}$/.test(value))throw new ApiError('invalid-argument','Use 3 a 18 letras, números ou _ no usuário.');return value.toLowerCase();}
export function password(value){if(typeof value!=='string'||value.length<12||value.length>128)throw new ApiError('invalid-argument','A senha precisa ter entre 12 e 128 caracteres.');return value;}
// OWASP scrypt option: 32 MiB, N=2^15, r=8, p=3; unique random salt.
export async function hashPassword(value,salt=randomBytes(16).toString('hex')){
 const key=await scryptAsync(value,salt,{N:32768,r:8,p:3,dkLen:32,maxmem:64*1024*1024});
 return {salt,hash:Buffer.from(key).toString('hex'),algorithm:'scrypt-32768-8-3'};
}
export async function checkPassword(value,saved){const result=await hashPassword(value,saved.salt);return timingSafeEqual(Buffer.from(result.hash,'hex'),Buffer.from(saved.hash,'hex'));}
