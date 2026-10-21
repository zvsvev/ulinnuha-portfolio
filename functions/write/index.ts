import type { Env, PagesFunction } from '../_auth';
import { archiveResponse } from './serve';

/** GET /write — the blog archive (also served at the write host root). */
export const onRequestGet: PagesFunction<Env> = ({ env }) => archiveResponse(env);
