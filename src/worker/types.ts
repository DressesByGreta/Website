import type { Lang } from '../shared/copy';

export type AppEnv = { Bindings: Env; Variables: { lang: Lang } };

/**
 * Optional settings, absent until someone sets them: without them alerts and the Instagram sync
 * simply do nothing.
 * - TELEGRAM_BOT_TOKEN: the bot that sends order alerts (npx wrangler secret put TELEGRAM_BOT_TOKEN).
 * - TELEGRAM_API, INSTAGRAM_API: replace the real hosts, for local tests against a stand-in only.
 */
export interface ExtraEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_API?: string;
  INSTAGRAM_API?: string;
}
