import { writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:8020/index.html';
const cdp = 'http://127.0.0.1:9461';

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
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 950,
  deviceScaleFactor: 1,
  mobile: false
});
await client.send('Page.navigate', { url: base });
await new Promise((resolve) => setTimeout(resolve, 1200));
await client.send('Runtime.evaluate', {
  expression: "document.querySelector('#materials').scrollIntoView({ block: 'center' })"
});
await new Promise((resolve) => setTimeout(resolve, 600));

const states = [];
for (const material of ['vinyl', 'fiber', 'board']) {
  await client.send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-material="${material}"]').click()`
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('#materials');
      const wall = document.querySelector('.material-wall');
      const craft = document.querySelector('#craft');
      const services = document.querySelector('#services');
      const rect = wall.getBoundingClientRect();
      return {
        material: wall.dataset.material,
        backgroundImage: getComputedStyle(wall).backgroundImage,
        wall: { width: Math.round(rect.width), height: Math.round(rect.height) },
        order: { craft: craft.compareDocumentPosition(section), materialBeforeServices: !!(section.compareDocumentPosition(services) & Node.DOCUMENT_POSITION_FOLLOWING) },
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    })()`,
    returnByValue: true
  });
  states.push(evaluated.result.value);
}

const metrics = await client.send('Runtime.evaluate', {
  expression: `(() => {
    const section = document.querySelector('#materials');
    const rect = section.getBoundingClientRect();
    return { x: 0, y: Math.round(window.scrollY + rect.top), width: 1440, height: Math.min(900, Math.ceil(rect.height)) };
  })()`,
  returnByValue: true
});
const clip = metrics.result.value;
const screenshot = await client.send('Page.captureScreenshot', {
  format: 'png',
  clip: { ...clip, scale: 1 }
});
await writeFile('codex-tmp/material-section-desktop.png', Buffer.from(screenshot.data, 'base64'));
console.log(JSON.stringify(states, null, 2));
client.ws.close();
