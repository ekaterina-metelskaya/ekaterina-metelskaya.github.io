// ---- Демо-файл «Field Notes» (Figma Community: Re-Instance — Community Demo) вместо тестового файла плагина ----
// Подставляется в превью плагина перед `const SMALL_DATA`, поэтому использует его функции change() и comparison().
// Формат данных тот же, что у плагина (src/core/types.ts); сами сценарии — из подписей на холсте демо-файла.
PAGES.length = 0;
PAGES.push({ id: '0:1', name: 'Field Notes', frames: 64 });

SOURCES = {
  'local:1:10': { status: 'found-local', componentId: '1:10', name: 'Card', isLibrary: false },
  'local:1:15': { status: 'found-local', componentId: '1:15', name: 'Card / Token', isLibrary: false },
  'local:16:67': { status: 'found-local', componentId: '16:67', name: 'Card / Field alert', isLibrary: false },
  'local:16:100': { status: 'found-local', componentId: '16:100', name: 'Card / Route note', isLibrary: false },
};

// [frameId, frameName, pageId, sourceKey, insideComponent]
FRAMES = [
  ['1:25', 'Card · Alpine lake', '0:1', 'local:1:10', false],
  ['1:35', 'Card · Cedar grove', '0:1', 'local:1:10', false],
  ['1:45', 'Card · North ridge', '0:1', 'local:1:10', false],
  ['1:55', 'Card · Trail map', '0:1', 'local:1:15', false],
  ['13:13', 'Card · Unchanged', '0:1', 'local:1:15', false],
  ['13:26', 'Card · Text edit', '0:1', 'local:1:15', false],
  ['13:39', 'Card · Sharper corners', '0:1', 'local:1:15', false],
  ['13:52', 'Card · Narrower card', '0:1', 'local:1:15', false],
  ['16:13', 'Card · Extra badge', '0:1', 'local:1:15', false],
  ['16:28', 'Card · Divider and note', '0:1', 'local:1:15', false],
  ['16:43', 'Card · Font change', '0:1', 'local:1:15', false],
  ['16:78', 'Card · Creek alert', '0:1', 'local:16:67', false],
  ['16:111', 'Card · Ridge route note', '0:1', 'local:16:100', false],
].map(([frameId, frameName, pageId, sourceKey, insideComponent]) => ({
  frameId,
  frameName,
  pageId,
  pageName: PAGES.find((page) => page.id === pageId).name,
  insideComponent,
  source: { kind: 'local', componentId: sourceKey.slice('local:'.length) },
  sourceKey,
}));

// Local main components are reported by the scan itself (see `owners` in runScan); no extra components search results.
COMPONENTS = [];
PARTS = [];

{
  // Edits covered by TEXT properties of the Card: the title and the caption.
  const text = (id, name, layer, before, after) => change(id, 'text-content', `${name}/${layer}`, { before, after, coveredByProperty: true });
  const SOURCE_TITLE = 'Field guide';
  const SOURCE_CAPTION = 'A note from the trail.';
  const N = Object.fromEntries(FRAMES.map((f) => [f.frameId, f.frameName]));
  COMPARISONS = Object.fromEntries(
    [
      // Text only: three edits that reveal a pattern in the Card summary.
      comparison('1:25', 'restorable', [text('1:25', N['1:25'], 'Title', SOURCE_TITLE, 'Alpine lake'), text('1:25', N['1:25'], 'Caption', SOURCE_CAPTION, 'A quiet stop above the pines.')]),
      comparison('1:35', 'restorable', [text('1:35', N['1:35'], 'Title', SOURCE_TITLE, 'Cedar grove'), text('1:35', N['1:35'], 'Caption', SOURCE_CAPTION, 'Follow the shaded loop.')]),
      comparison('1:45', 'restorable', [text('1:45', N['1:45'], 'Title', SOURCE_TITLE, 'North ridge'), text('1:45', N['1:45'], 'Caption', SOURCE_CAPTION, 'An open view of the valley.')]),
      // Fill unbound: the colour is no longer taken from the card/surface variable (#DCD8FE → #F9DBBF).
      comparison('1:55', 'restorable', [
        change('1:55', 'variable-unbound', N['1:55'], { field: 'fills', before: 'card/surface', after: '#F9DBBF', beforeColor: '#DCD8FE', afterColor: '#F9DBBF', tokenId: 'v:surface', tokenKind: 'variable', paintIndex: 0, tokenValue: '#DCD8FE', frameValue: '#F9DBBF' }),
      ]),
      // More ways to restore.
      comparison('13:13', 'unchanged'),
      comparison('13:26', 'restorable', [text('13:26', N['13:26'], 'Title', 'Trail map', 'River crossing')]),
      comparison('13:39', 'restorable', [change('13:39', 'corner-radius', N['13:39'], { before: '16', after: '4' })]),
      comparison('13:52', 'restorable', [change('13:52', 'size', N['13:52'], { before: '238×134', after: '208×134', root: true })]),
      // Layers, fonts and local components.
      comparison('16:13', 'needs-decision', [change('16:13', 'layer-added', `${N['16:13']}/Extra badge`)]),
      comparison('16:28', 'needs-decision', [
        change('16:28', 'layer-added', `${N['16:28']}/Extra divider`),
        change('16:28', 'layer-added', `${N['16:28']}/Extra note`),
        change('16:28', 'text-style', `${N['16:28']}/Title`, { before: 'Inter Bold 19', after: 'Lora Bold 20' }),
        change('16:28', 'text-style', `${N['16:28']}/Caption`, { before: 'Inter Regular 12', after: 'IBM Plex Mono Regular 12' }),
      ]),
      comparison('16:43', 'restorable', [
        change('16:43', 'text-style', `${N['16:43']}/Title`, { before: 'Inter Bold 19', after: 'Lora Bold 20' }),
        change('16:43', 'text-style', `${N['16:43']}/Caption`, { before: 'Inter Regular 12', after: 'IBM Plex Mono Regular 12' }),
      ]),
      // New local components: a detached example of each, with an edited title.
      comparison('16:78', 'restorable', [text('16:78', N['16:78'], 'Title', 'Field alert', 'Creek alert')]),
      comparison('16:111', 'restorable', [text('16:111', N['16:111'], 'Title', 'Route note', 'Ridge route note')]),
    ].map((c) => [c.frameId, c]),
  );
}
delete NEAREST['20:1'];
