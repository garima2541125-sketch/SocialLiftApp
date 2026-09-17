const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function log(...a) { console.log('[diag]', ...a); }

async function clickByText(page, text) {
  return page.evaluate((text) => {
    const nodes = Array.from(document.querySelectorAll('*'));
    const target = nodes.find((n) => n.textContent && n.textContent.trim() === text && n.children.length === 0);
    if (!target) return 'NOT_FOUND';
    let el = target;
    while (el && el !== document.body) {
      if (el.getAttribute && (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.tagName === 'A')) {
        el.click();
        return 'CLICKED';
      }
      el = el.parentElement;
    }
    target.click();
    return 'CLICKED_FALLBACK';
  }, text);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1200,900'],
    defaultViewport: { width: 1200, height: 900 },
  });
  const page = await browser.newPage();

  page.on('console', (m) => log('CONSOLE', m.type(), m.text()));
  page.on('pageerror', (e) => log('PAGEERROR', String(e)));
  page.on('requestfailed', (req) => log('REQ FAILED', req.url(), req.failure()?.errorText));

  await page.goto('https://social-lift-app.vercel.app/register', { waitUntil: 'networkidle2', timeout: 30000 });
  log('loaded register page');

  const clicked = await clickByText(page, 'Sign up with Google');
  log('clicked Sign up with Google:', clicked);

  await new Promise((r) => setTimeout(r, 4000));

  const pages = await browser.pages();
  log('open pages:', pages.length);
  for (const p of pages) {
    log('page url:', p.url());
  }

  await browser.close();
}
main();
