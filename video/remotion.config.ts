/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

/**
 * The repo's `assets/` is the video's public folder, so `staticFile()` reads the
 * same app screenshots and recordings the marketing site serves — one copy of
 * every capture rather than one per consumer. Paths are relative to it:
 * staticFile("screens/today.png"), staticFile("fonts/nunito-var-latin.woff2").
 */
Config.setPublicDir("../assets");

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
