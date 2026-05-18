import { useRef, useState, useEffect } from 'react';
import { Brush, Type, Eraser } from 'lucide-react';

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#0f172a'];
const VIEWS = [
  { key: 'frente', label: 'Frente' },
  { key: 'espalda', label: 'Espalda' },
];

const W = 200, H = 400;

function drawBodyOutline(ctx, view) {
  ctx.strokeStyle = '#94a3b8';
  ctx.fillStyle = '#f8fafc';
  ctx.lineWidth = 1.5;

  ctx.beginPath(); ctx.arc(100, 40, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(92, 62); ctx.lineTo(92, 72); ctx.moveTo(108, 62); ctx.lineTo(108, 72); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(60, 80);
  ctx.quadraticCurveTo(70, 72, 100, 72);
  ctx.quadraticCurveTo(130, 72, 140, 80);
  ctx.lineTo(142, 195);
  ctx.quadraticCurveTo(125, 205, 100, 205);
  ctx.quadraticCurveTo(75, 205, 58, 195);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(60, 82);
  ctx.quadraticCurveTo(44, 140, 42, 205);
  ctx.lineTo(46, 238);
  ctx.lineTo(56, 238);
  ctx.lineTo(54, 205);
  ctx.quadraticCurveTo(56, 140, 68, 95);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(140, 82);
  ctx.quadraticCurveTo(156, 140, 158, 205);
  ctx.lineTo(154, 238);
  ctx.lineTo(144, 238);
  ctx.lineTo(146, 205);
  ctx.quadraticCurveTo(144, 140, 132, 95);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(51, 248, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(149, 248, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(62, 205); ctx.lineTo(72, 370); ctx.lineTo(97, 370); ctx.lineTo(98, 210);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(138, 205); ctx.lineTo(128, 370); ctx.lineTo(103, 370); ctx.lineTo(102, 210);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(84, 382, 14, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(116, 382, 14, 7, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  if (view === 'frente') {
    ctx.beginPath(); ctx.moveTo(100, 80); ctx.lineTo(100, 200); ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(93, 38, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(107, 38, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath(); ctx.moveTo(95, 48); ctx.lineTo(105, 48); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(100, 80); ctx.lineTo(100, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(75, 100); ctx.lineTo(95, 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(125, 100); ctx.lineTo(105, 130); ctx.stroke();
  }
}

export default function BodyMap({ value, onChange, readOnly }) {
  const [data, setData] = useState(value || { frente: [], espalda: [], textos: [] });
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState('draw');
  const refs = { frente: useRef(null), espalda: useRef(null) };
  const drawing = useRef({ view: null, points: [] });

  useEffect(() => {
    for (const v of ['frente', 'espalda']) {
      const c = refs[v].current;
      if (!c) continue;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      drawBodyOutline(ctx, v);
      for (const s of data[v] || []) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < s.points.length; i++) {
          const [x, y] = s.points[i];
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (const t of (data.textos || []).filter(t => t.view === v)) {
        ctx.fillStyle = t.color;
        ctx.font = 'bold 12px Inter, system-ui';
        ctx.fillText(t.text, t.x, t.y);
      }
    }
  }, [data]);

  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(data)) setData(value);
  }, [value]);

  function emit(next) {
    setData(next);
    onChange?.(next);
  }

  function eventPos(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (W / rect.width),
      (e.clientY - rect.top) * (H / rect.height),
    ];
  }

  function pointerDown(view, e) {
    if (readOnly) return;
    e.preventDefault();
    const [x, y] = eventPos(e);
    if (tool === 'text') {
      const text = prompt('Texto (ej: lumbalgia, quemazón)');
      if (text) {
        const next = { ...data, textos: [...(data.textos || []), { view, x, y, text, color }] };
        emit(next);
      }
      return;
    }
    drawing.current = { view, points: [[x, y]] };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(view, e) {
    if (readOnly) return;
    if (!drawing.current.view || drawing.current.view !== view) return;
    const [x, y] = eventPos(e);
    const pts = drawing.current.points;
    pts.push([x, y]);
    if (pts.length < 2) return;
    const ctx = refs[view].current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1]);
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.stroke();
  }

  function pointerUp(view) {
    if (readOnly) return;
    if (!drawing.current.view || drawing.current.view !== view) return;
    const stroke = { color, points: drawing.current.points };
    drawing.current = { view: null, points: [] };
    if (stroke.points.length < 2) return;
    const next = { ...data, [view]: [...(data[view] || []), stroke] };
    emit(next);
  }

  function clearView(view) {
    if (readOnly) return;
    if (!confirm(`¿Borrar todas las marcas de ${view}?`)) return;
    const next = { ...data, [view]: [], textos: (data.textos || []).filter(t => t.view !== view) };
    emit(next);
  }

  return (
    <div>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`w-7 h-7 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-0.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTool('draw')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${tool === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Brush size={14} /> Dibujar
            </button>
            <button
              type="button"
              onClick={() => setTool('text')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${tool === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Type size={14} /> Texto
            </button>
          </div>
          <div className="flex gap-1 ml-auto">
            <button type="button" onClick={() => clearView('frente')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs">
              <Eraser size={12} /> Frente
            </button>
            <button type="button" onClick={() => clearView('espalda')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs">
              <Eraser size={12} /> Espalda
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6 justify-center flex-wrap">
        {VIEWS.map(v => (
          <div key={v.key} className="text-center">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{v.label}</div>
            <canvas
              ref={refs[v.key]}
              width={W} height={H}
              className={`border border-slate-200 rounded-xl touch-none bg-white shadow-card ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
              style={{ width: W, height: H }}
              onPointerDown={e => pointerDown(v.key, e)}
              onPointerMove={e => pointerMove(v.key, e)}
              onPointerUp={() => pointerUp(v.key)}
              onPointerLeave={() => pointerUp(v.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
