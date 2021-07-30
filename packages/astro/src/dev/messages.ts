/**
 * Dev server messages (organized here to prevent clutter)
 */

import { bold, dim, green, magenta, yellow } from 'kleur/colors';

/** Pad string */
function pad(input: string, minLength: number, dir?: 'left' | 'right'): string {
  let output = input;
  while (output.length < minLength) {
    output = dir === 'left' ? ' ' + output : output + ' ';
  }
  return output;
}

/** Display  */
export function req({ url, statusCode, reqTime }: { url: string; statusCode: number; reqTime: number }): string {
  let color = dim;
  if (statusCode >= 500) color = magenta;
  else if (statusCode >= 400) color = yellow;
  else if (statusCode >= 300) color = dim;
  else if (statusCode >= 200) color = green;
  return `${color(statusCode)} ${pad(url, 40)} ${dim(Math.round(reqTime) + 'ms')}`;
}

/** Display dev server host and startup time */
export function devStart({ startupTime }: { startupTime: number }): string {
  return `${pad(`Server started`, 44)} ${dim(`${Math.round(startupTime)}ms`)}`;
}

/** Display dev server host */
export function devHost({ host }: { host: string }): string {
  return `Local: ${bold(magenta(host))}`;
}
