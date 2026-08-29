import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:8020/index.html';
const cdp = 'http://127.0.0.1:9460';
const viewports = [
  ['desktop', 1440, 1050, 1, false],
  ['mobile', 390, 1150, 3, true]
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
for (const [name, width, height, scale, mobile] of viewports) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile
  });
  await client.send('Page.navigate', { url: base });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await client.send('Runtime.evaluate', {
    expression: "document.querySelector('#services').scrollIntoView({ block: 'start' })"
  });
  await new Promise((resolve) => setTimeout(resolve, 600));

  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('#services');
      const cards = [...document.querySelectorAll('#services .service-card')];
      const images = [...document.querySelectorAll('#services .service-portrait img')];
      const rect = section.getBoundingClientRect();
      return {
        section: { top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) },
        cards: cards.map((card) => {
          const r = card.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) };
        }),
        images: images.map((img) => ({ complete: img.complete, width: img.naturalWidth, height: img.naturalHeight })),
        scrollY: Math.round(window.scrollY),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    })()`,
    returnByValue: true
  });
  const metrics = evaluated.result.value;
  results.push({ viewport: name, ...metrics });

  const clipHeight = Math.min(height, Math.ceil(metrics.section.height));
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: metrics.scrollY, width, height: clipHeight, scale: 1 }
  });
  await writeFile(`codex-tmp/services-section-${name}.png`, Buffer.from(screenshot.data, 'base64'));
}

console.log(JSON.stringify(results, null, 2));
client.ws.close();
