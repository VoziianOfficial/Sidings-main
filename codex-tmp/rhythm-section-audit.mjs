import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:8020/index.html';
const cdp = 'http://127.0.0.1:9463';

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
  ['mobile', 390, 900, 3, true]
]) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
  await client.send('Page.navigate', { url: base });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await client.send('Runtime.evaluate', { expression: "document.querySelector('#rhythm').scrollIntoView({ block: 'center' })" });
  await new Promise((resolve) => setTimeout(resolve, 500));

  const states = [];
  for (const rhythm of ['horizontal', 'vertical', 'mixed']) {
    await client.send('Runtime.evaluate', { expression: `document.querySelector('button[data-rhythm="${rhythm}"]').click()` });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const evaluated = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const wall = document.querySelector('.rhythm-facade');
        const rect = wall.getBoundingClientRect();
        return {
          rhythm: wall.dataset.rhythm,
          backgroundImage: getComputedStyle(wall).backgroundImage,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })()`,
      returnByValue: true
    });
    states.push(evaluated.result.value);
  }

  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('#rhythm');
      const rect = section.getBoundingClientRect();
      return {
        sectionHeight: Math.round(rect.height),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollY: Math.round(window.scrollY)
      };
    })()`,
    returnByValue: true
  });
  const metrics = evaluated.result.value;
  results.push({ viewport, states, ...metrics });
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: metrics.scrollY, width, height: Math.min(height, metrics.sectionHeight), scale: 1 }
  });
  await writeFile(`codex-tmp/rhythm-section-${viewport}.png`, Buffer.from(screenshot.data, 'base64'));
}

console.log(JSON.stringify(results, null, 2));
client.ws.close();
