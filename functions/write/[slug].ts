import type { Env, PagesFunction } from '../_auth';
import { articleResponse } from './serve';

/** GET /write/[slug] — a single handwritten article. */
export const onRequestGet: PagesFunction<Env> = ({ request, env, params }) =>
  articleResponse(env, request, String(params.slug || ''));
