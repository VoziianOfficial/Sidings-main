import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:8127';
const cdp = 'http://127.0.0.1:9450';
const pages = [
  ['home', '/index.html', '.home-hero'],
  ['installation', '/installation.html', '.service-hero'],
  ['repair', '/repair.html', '.service-hero']
];
const viewports = [
  ['desktop', 1440, 900],
  ['tablet', 834, 1112],
  ['mobile', 390, 844]
];

class Client {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      }
    };
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function newTab() {
  const response = await fetch(`${cdp}/json/new`, { method: 'PUT' });
  const target = await response.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  return new Client(ws);
}

const client = await newTab();
await client.send('Page.enable');
await client.send('Runtime.enable');

const results = [];
for (const [vpName, width, height] of viewports) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: vpName === 'mobile' ? 3 : 1,
    mobile: vpName === 'mobile'
  });

  for (const [pageName, path, selector] of pages) {
    await client.send('Page.navigate', { url: `${base}${path}` });
    await new Promise((resolve) => setTimeout(resolve, 850));

    const expression = `(() => {
      const hero = document.querySelector('${selector}');
      if (!hero) return { ok: false, reason: 'missing hero' };
      const rect = hero.getBoundingClientRect();
      const styles = getComputedStyle(hero);
      const strip = document.querySelector('.billboard .strip');
      const stripStyles = strip ? getComputedStyle(strip) : null;
      const resources = performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.includes('/assets/images/hero/'));
      return {
        ok: true,
        page: '${pageName}',
        viewport: '${vpName}',
        rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
        heroBackground: styles.backgroundImage,
        heroPosition: styles.backgroundPosition,
        stripBackground: stripStyles ? stripStyles.backgroundImage : null,
        stripPosition: stripStyles ? stripStyles.backgroundPosition : null,
        resources
      };
    })()`;
    const evaluated = await client.send('Runtime.evaluate', { expression, returnByValue: true });
    const value = evaluated.result.value;
    results.push(value);

    const screenshot = await client.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 82,
      clip: { x: 0, y: 0, width, height: Math.min(height, value.rect?.height || height), scale: 1 }
    });
    await writeFile(`codex-tmp/sidings-${pageName}-${vpName}.jpg`, Buffer.from(screenshot.data, 'base64'));
  }
}

console.log(JSON.stringify(results, null, 2));
client.ws.close();
