import type { Lang } from '../shared/copy';

export type AppEnv = { Bindings: Env; Variables: { lang: Lang } };

/**
 * Optional settings, absent until someone sets them: without them alerts and the Instagram sync
 * simply do nothing.
 * - TELEGRAM_BOT_TOKEN: the bot that sends order alerts (npx wrangler secret put TELEGRAM_BOT_TOKEN).
 * - GOOGLE_SITE_VERIFICATION: the code from Google Search Console's "HTML tag" method, printed as
 *   <meta name="google-site-verification"> on every page (a plain var in wrangler.jsonc).
 * - TELEGRAM_API, INSTAGRAM_API: replace the real hosts, for local tests against a stand-in only.
 */
export interface ExtraEnv {
  TELEGRAM_BOT_TOKEN?: string;
  GOOGLE_SITE_VERIFICATION?: string;
  TELEGRAM_API?: string;
  INSTAGRAM_API?: string;
}
