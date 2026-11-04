import {useGraphics} from './graphics';
import React, { useEffect, useMemo, useState } from 'react';
import { handLayout, hitCard, loadCardManifest, loadCardSheet } from './cards';
import { toLogicalPoint } from './config';

export function useCardReview(enabled) {
  const graphics=useGraphics();
  const [manifest, setManifest] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [setId, setSetId] = useState(1);
  const [size, setSize] = useState(1);
  const [orientation, setOrientation] = useState('V');
  const [first, setFirst] = useState(1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadCardManifest().then(value => { if (active) setManifest(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [enabled]);
  useEffect(() => {
    if (!manifest) return;
    let active = true;
    setSheet(null); setSelected(null); setError('');
    loadCardSheet(manifest, setId, size, orientation).then(value => { if (active) setSheet(value); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [manifest, setId, size, orientation, graphics]);
  const cards = useMemo(() => sheet ? handLayout(sheet, first) : [], [sheet, first]);
  return { sheet, cards, selected, setSelected, setId, setSetId, size, setSize, orientation,
    setOrientation, first, setFirst, error };
}

export function CardReviewControls({ review: r }) {
  return <section className="card-review" aria-label="Grafikprüfung">
    <p>Karten-Vorschau · kein laufendes Spiel. Karte anklicken oder mit Tab und Enter auswählen.</p>
    <div className="review-controls">
      <label>Kartensatz <select value={r.setId} onChange={e => r.setSetId(Number(e.target.value))}>
        {['Deutsch', 'Französisch 1', 'Französisch 2 · vierfarbig', 'Französisch 3', 'Französisch 4 · vierfarbig'].map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select></label>
      <label>Kartengrösse <select value={r.size} onChange={e => r.setSize(Number(e.target.value))}>
        <option value="1">Mittel</option><option value="2">Gross</option>
      </select></label>
      <label>Ausrichtung <select value={r.orientation} onChange={e => r.setOrientation(e.target.value)}>
        <option value="V">Vertikal</option><option value="H">Horizontal</option>
      </select></label>
      <label>Karten <select value={r.first} onChange={e => { r.setFirst(Number(e.target.value)); r.setSelected(null); }}>
        {[1, 10, 19, 28].map(n => <option key={n} value={n}>{n}–{n + 8}</option>)}
      </select></label>
      <output aria-live="polite">{r.selected ? `Karte ${r.selected} ausgewählt` : 'Keine Karte ausgewählt'}</output>
    </div>
    {r.error && <p role="alert">{r.error}</p>}
  </section>;
}

export function CardTargets({ review: r, scale, canvas }) {
  return <div className="card-targets" role="group" aria-label="Kartenhand">
    {r.cards.map((card, index) => <button key={card.id} type="button" className="card-target"
      aria-label={`Karte ${card.id}`} aria-pressed={r.selected === card.id} data-card-id={card.id}
      style={{ left: card.x * scale, top: card.y * scale,
        width: (r.cards[index + 1] ? Math.min(card.width, r.cards[index + 1].x - card.x) : card.width) * scale, height: card.height * scale }}
      onClick={e => r.setSelected(e.detail === 0 ? card.id : hitCard(r.cards,
        toLogicalPoint(e.clientX, e.clientY, canvas.current.getBoundingClientRect())))} />)}
  </div>;
}
