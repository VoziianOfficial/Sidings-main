/* Installation controls. Every interaction changes the illustrated structure. */
(function () {
  if (window.__SITE_SERVICE_READY__) return;
  window.__SITE_SERVICE_READY__ = true;

  const setActive = (selector, active) => document.querySelectorAll(selector).forEach((item) => {
    const isActive = item === active;
    item.classList.toggle('active', isActive);
    if (item.matches('button')) item.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelectorAll('[data-scale]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { setActive('[data-scale]', button); const lab = document.querySelector('.premium-scale'); if (lab) lab.dataset.profile = button.dataset.scale; }); });
  document.querySelectorAll('[data-trim]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('active'))); button.addEventListener('click', () => { setActive('[data-trim]', button); const composer = document.querySelector('.premium-trim'); if (composer) composer.dataset.trimStyle = button.dataset.trim; }); });
  const zoning = document.querySelector('.premium-zoning');
  const zoneName = document.querySelector('[data-zone-name]');
  const zoneCopy = document.querySelector('[data-zone-copy]');
  const zoneContent = { main: ['Main Wall', 'The primary wall establishes the facade’s panel rhythm and overall proportion.'], gable: ['Gable', 'The gable closes the roof geometry and shifts the facade into a more vertical cadence.'], corners: ['Corners', 'Corner trim resolves the meeting point of each siding plane into one controlled edge.'], openings: ['Openings', 'Windows and doors break the field of panels with measured, protected cut lines.'], trim: ['Trim', 'Trim provides a precise visual boundary between panels, openings and roof lines.'] };
  const activateZone = (button) => { const zone = button.dataset.zoneControl; if (!zoning || !zoneContent[zone] || !zoneName || !zoneCopy) return; zoning.dataset.zone = zone; zoneName.textContent = zoneContent[zone][0]; zoneCopy.textContent = zoneContent[zone][1]; setActive('[data-zone-control]', button); };
  document.querySelectorAll('[data-zone-control]').forEach((button) => { button.type = 'button'; button.setAttribute('aria-pressed', String(zoning?.dataset.zone === button.dataset.zoneControl)); button.addEventListener('click', () => activateZone(button)); button.addEventListener('pointerenter', () => activateZone(button)); });
}());
