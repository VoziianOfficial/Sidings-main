import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:8020/index.html';
const cdp = 'http://127.0.0.1:9462';

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
for (const [viewport, width, height, scale, mobile] of [
  ['desktop', 1440, 900, 1, false],
  ['mobile', 390, 1000, 3, true]
]) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
  await client.send('Page.navigate', { url: base });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await client.send('Runtime.evaluate', { expression: "document.querySelector('#benefits').scrollIntoView({ block: 'start' })" });
  await new Promise((resolve) => setTimeout(resolve, 700));
  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('#benefits');
      const cards = [...section.querySelectorAll('.expand-card')];
      const rect = section.getBoundingClientRect();
      return {
        viewport: '${viewport}',
        section: { width: Math.round(rect.width), height: Math.round(rect.height), top: Math.round(rect.top) },
        cards: cards.map((card) => {
          const r = card.getBoundingClientRect();
          const h3 = card.querySelector('h3');
          const h3s = getComputedStyle(h3);
          return {
            bg: getComputedStyle(card).backgroundImage,
            width: Math.round(r.width),
            height: Math.round(r.height),
            writingMode: h3s.writingMode,
            right: Math.round(window.innerWidth - h3.getBoundingClientRect().right)
          };
        }),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollY: Math.round(window.scrollY)
      };
    })()`,
    returnByValue: true
  });
  const value = evaluated.result.value;
  results.push(value);
  const shot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: value.scrollY, width, height: Math.min(height, value.section.height), scale: 1 }
  });
  await writeFile(`codex-tmp/benefits-section-${viewport}.png`, Buffer.from(shot.data, 'base64'));
}

console.log(JSON.stringify(results, null, 2));
client.ws.close();
