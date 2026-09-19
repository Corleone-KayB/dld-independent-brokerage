#!/usr/bin/env node
/**
 * Recaptures docs/screenshots/ from a running DLD Partners instance.
 *
 * One-time setup:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Usage:
 *   npm run screenshots                       # against the live deployment
 *   BASE_URL=http://localhost:3000 npm run screenshots
 *
 * Shots are taken at 1440x900 in light mode. Nothing here signs in — every
 * page captured is publicly reachable, so this is safe to run against prod.
 */

import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'docs/screenshots')
const BASE_URL = (process.env.BASE_URL || 'https://dld-independent-brokerage.vercel.app').replace(/\/$/, '')

let chromium
try {
  ;({ chromium } = await import('@playwright/test'))
} catch {
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('\n  Run this once:  npx playwright install chromium\n')
    process.exit(1)
  }
}

/** @type {{ name: string, path: string }[]} */
const SHOTS = [
  { name: 'home', path: '/' },
  { name: 'properties', path: '/properties' },
  { name: 'brokers', path: '/brokers' },
  { name: 'calculators', path: '/calculators' },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
})

let ok = 0
for (const shot of SHOTS) {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle', timeout: 45_000 })
    // Let fonts settle and lazy images resolve before shooting.
    await page.evaluate(() => document.fonts?.ready)
    await page.evaluate(async () => {
      await new Promise((r) => {
        let y = 0
        const step = () => {
          window.scrollTo(0, (y += 600))
          if (y < document.body.scrollHeight) requestAnimationFrame(step)
          else {
            window.scrollTo(0, 0)
            setTimeout(r, 400)
          }
        }
        step()
      })
    })
    await page.waitForTimeout(600)
    await page.screenshot({ path: resolve(OUT, `${shot.name}.png`) })
    console.log(`  captured  docs/screenshots/${shot.name}.png`)
    ok++
  } catch (err) {
    console.warn(`  skipped   ${shot.name} — ${err.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
}

await browser.close()
console.log(`\n  ${ok}/${SHOTS.length} screenshots written to docs/screenshots/\n`)
