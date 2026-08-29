const cdp = 'http://127.0.0.1:9464';

class Client {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    };
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
}

async function newClient() {
  const target = await (await fetch(`${cdp}/json/new`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  return new Client(ws);
}

const client = await newClient();
await client.send('Page.enable');
await client.send('Runtime.enable');

const results = [];
for (const [viewport, width, height, scale, mobile] of [
  ['desktop', 1440, 900, 1, false],
  ['mobile', 390, 900, 3, true],
]) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
  await client.send('Page.navigate', { url: 'http://127.0.0.1:8020/index.html' });
  await new Promise((resolve) => setTimeout(resolve, 900));
  await client.send('Runtime.evaluate', { expression: "document.querySelector('#rhythm').scrollIntoView({ block: 'center' })" });
  await new Promise((resolve) => setTimeout(resolve, 300));
  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('#rhythm');
      const grid = document.querySelector('.rhythm');
      const copy = document.querySelector('.rhythm-copy');
      const wall = document.querySelector('.rhythm-facade');
      const title = copy.querySelector('.title');
      const sectionRect = section.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const wallRect = wall.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const titleStyle = getComputedStyle(title);
      return {
        paddingTop: getComputedStyle(section).paddingTop,
        paddingBottom: getComputedStyle(section).paddingBottom,
        columns: getComputedStyle(grid).gridTemplateColumns,
        copyLeft: Math.round(copyRect.left),
        wallLeft: Math.round(wallRect.left),
        wallHeight: Math.round(wallRect.height),
        title: title.textContent,
        titleOneLine: Math.round(titleRect.height) <= Math.ceil(parseFloat(titleStyle.lineHeight) * 1.25),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sectionHeight: Math.round(sectionRect.height),
      };
    })()`,
    returnByValue: true,
  });
  results.push({ viewport, ...evaluated.result.value });
}

console.log(JSON.stringify(results, null, 2));
client.ws.close();
