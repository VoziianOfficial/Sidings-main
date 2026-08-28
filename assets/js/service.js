/* Installation and repair controls. Every interaction changes the illustrated structure. */
(function () {
  if (window.__SIDINGS_SERVICE_READY__) return;
  window.__SIDINGS_SERVICE_READY__ = true;

  const setActive = (selector, active) => document.querySelectorAll(selector).forEach((item) => {
    const isActive = item === active;
    item.classList.toggle('active', isActive);
    if (item.matches('button')) item.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelectorAll('[data-scale]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { setActive('[data-scale]', button); document.querySelector('.scale-wall')?.style.setProperty('--panel-space', { narrow: '15px', balanced: '28px', wide: '48px' }[button.dataset.scale]); const lab = document.querySelector('.premium-scale'); if (lab) lab.dataset.profile = button.dataset.scale; }); });
  document.querySelectorAll('[data-trim]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { setActive('[data-trim]', button); document.querySelector('.trim-wall')?.style.setProperty('--trim', { slim: '6px', standard: '13px', bold: '23px' }[button.dataset.trim]); const composer = document.querySelector('.premium-trim'); if (composer) composer.dataset.trimStyle = button.dataset.trim; }); });
  const zoning = document.querySelector('.premium-zoning');
  const zoneName = document.querySelector('[data-zone-name]');
  const zoneCopy = document.querySelector('[data-zone-copy]');
  const zoneContent = { main: ['Main Wall', 'The primary wall establishes the facade’s panel rhythm and overall proportion.'], gable: ['Gable', 'The gable closes the roof geometry and shifts the facade into a more vertical cadence.'], corners: ['Corners', 'Corner trim resolves the meeting point of each siding plane into one controlled edge.'], openings: ['Openings', 'Windows and doors break the field of panels with measured, protected cut lines.'], trim: ['Trim', 'Trim provides a precise visual boundary between panels, openings and roof lines.'] };
  const activateZone = (button) => { const zone = button.dataset.zoneControl; if (!zoning || !zoneContent[zone] || !zoneName || !zoneCopy) return; zoning.dataset.zone = zone; zoneName.textContent = zoneContent[zone][0]; zoneCopy.textContent = zoneContent[zone][1]; };
  document.querySelectorAll('[data-zone-control]').forEach((button) => { button.type = 'button'; button.addEventListener('click', () => activateZone(button)); button.addEventListener('pointerenter', () => activateZone(button)); });
  document.querySelectorAll('[data-align]').forEach((button) => button.addEventListener('click', () => { const machine = document.querySelector('.align-machine'); machine?.classList.add('aligned'); window.setTimeout(() => machine?.classList.remove('aligned'), 1800); }));
  document.querySelectorAll('[data-style]').forEach((button) => button.addEventListener('click', () => { setActive('[data-style]', button); const morph = document.querySelector('.style-morph'); if (morph) morph.dataset.style = button.dataset.style; }));
  document.querySelectorAll('[data-symptom]').forEach((button) => button.addEventListener('click', () => { const network = document.querySelector('.network'); if (network) network.dataset.symptom = button.dataset.symptom; setActive('[data-symptom]', button); }));
  document.querySelectorAll('[data-threshold]').forEach((button) => button.addEventListener('click', () => { const value = { single: ['10%', '8%'], cluster: ['30%', '32%'], section: ['49%', '56%'], wide: ['72%', '78%'] }[button.dataset.threshold]; const threshold = document.querySelector('.threshold'); if (!threshold || !value) return; threshold.style.setProperty('--damage-size', value[0]); threshold.style.setProperty('--meter', value[1]); }));
  document.querySelectorAll('[data-moisture]').forEach((button) => button.addEventListener('click', () => { document.querySelector('.moisture')?.classList.toggle('active'); }));
  document.querySelectorAll('[data-match]').forEach((button) => button.addEventListener('click', () => { const lab = document.querySelector('.match-lab'); if (!lab) return; const count = Number(lab.dataset.count || 0) + 1; lab.dataset.count = String(count); if (count >= 3) lab.classList.add('matched'); }));
  document.querySelectorAll('[data-warp]').forEach((button) => button.addEventListener('click', () => { const value = { low: '3deg', medium: '8deg', high: '14deg' }[button.dataset.warp]; if (!value) return; document.querySelector('.warp')?.style.setProperty('--warp', value); }));
  document.querySelector('.restore-warp')?.addEventListener('click', () => document.querySelector('.warp')?.classList.add('restore'));
  const microscope = document.querySelector('.micro-surface');
  microscope?.addEventListener('pointermove', (event) => { const rect = microscope.getBoundingClientRect(); const lens = microscope.querySelector('.lens'); if (!lens) return; const x = event.clientX - rect.left; const y = event.clientY - rect.top; lens.style.left = `${x}px`; lens.style.top = `${y}px`; lens.textContent = x < rect.width * 0.25 ? 'Lifted Edge' : x < rect.width * 0.5 ? 'Hairline Crack' : x < rect.width * 0.75 ? 'Separation' : 'Puncture'; });
  document.querySelectorAll('.case').forEach((card) => card.addEventListener('pointerdown', () => { const stack = card.parentElement; if (!stack) return; card.classList.add('top-out'); window.setTimeout(() => { card.classList.remove('top-out'); stack.append(card); }, 570); }));
  const scanner = document.querySelector('.scanner');
  scanner?.addEventListener('pointermove', (event) => { const rect = scanner.getBoundingClientRect(); const band = scanner.querySelector('.scanner-band'); if (!band) return; band.style.left = `${Math.max(0, Math.min(rect.width - 80, event.clientX - rect.left))}px`; });
}());
