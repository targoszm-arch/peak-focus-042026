import React from "react";
// Focus — a calm pomodoro driven by a managed queue.
// Flow: focus a task for its set minutes → chime + confetti + mark it done →
// short break (long break every 4th block) → auto-continue to the next task.
// When the whole queue is done: 10 confetti bursts + a celebration chime.
// Add tasks from the Tasks screen, drag to reorder, set per-task duration.
// Exposes window.FocusScreen.
function FocusScreen({ tasks, focusQueue, onMove, onReorder, onRemove, onSetDuration, onToggleTask, onGoto }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const DUR_OPTIONS = [10, 15, 20, 25, 30, 45, 60];

  // resolve queue entries -> {taskId, minutes, task}
  const queue = focusQueue
    .map(q => ({ ...q, task: tasks.find(t => t.id === q.taskId) }))
    .filter(q => q.task);

  // drag-to-reorder
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);
  const [fs, setFs] = React.useState(false);

  // session settings
  const [breakOn, setBreakOn] = React.useState(true);
  const [breakLen, setBreakLen] = React.useState(5);
  const [longLen, setLongLen] = React.useState(15);
  const autoStart = true; // auto-flow between phases

  // session state
  const firstOpen = queue.find(q => !q.task.done) || queue[0] || null;
  const [activeId, setActiveId] = React.useState(firstOpen ? firstOpen.taskId : null);
  const active = queue.find(q => q.taskId === activeId) || queue.find(q => !q.task.done) || queue[0] || null;
  const [phase, setPhase] = React.useState('focus'); // 'focus' | 'break' | 'done'
  const [nextId, setNextId] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [blocks, setBlocks] = React.useState(0);
  const focusSecs = (active ? active.minutes : 25) * 60;
  const [dur, setDur] = React.useState(focusSecs);
  const [left, setLeft] = React.useState(focusSecs);

  // reset the clock when the focused task/duration changes while idle in focus
  const focusKey = active ? active.taskId + ':' + active.minutes : 'none';
  React.useEffect(() => {
    if (phase === 'focus' && !running) { const d = (active ? active.minutes : 25) * 60; setDur(d); setLeft(d); }
  }, [focusKey]);

  // Escape exits full screen
  React.useEffect(() => {
    if (!fs) return;
    const k = (e) => { if (e.key === 'Escape') setFs(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [fs]);

  // tick + phase transitions
  React.useEffect(() => {
    if (!running) return;
    if (left > 0) { const id = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(id); }
    // left === 0 → transition
    if (phase === 'focus') {
      if (active && !active.task.done) onToggleTask(active.taskId);
      const nb = blocks + 1; setBlocks(nb);
      if (window.PFSound) window.PFSound.workEnd();
      if (window.PFConfetti) window.PFConfetti.burst({ y: window.innerHeight * 0.42 });
      const remaining = queue.filter(q => !q.task.done && q.taskId !== (active && active.taskId));
      if (remaining.length === 0) {
        setPhase('done'); setRunning(false); setLeft(0); setDur(1);
        setTimeout(() => { if (window.PFConfetti) window.PFConfetti.celebrate(); if (window.PFSound) window.PFSound.celebrate(); }, 260);
      } else if (breakOn) {
        const isLong = nb % 4 === 0; const bt = (isLong ? longLen : breakLen) * 60;
        setNextId(remaining[0].taskId);
        setPhase('break'); setDur(bt); setLeft(bt); setRunning(autoStart);
      } else {
        const n = remaining[0]; setActiveId(n.taskId); setPhase('focus');
        const t = n.minutes * 60; setDur(t); setLeft(t); setRunning(autoStart);
      }
    } else if (phase === 'break') {
      if (window.PFSound) window.PFSound.breakEnd();
      const n = queue.find(q => q.taskId === nextId) || queue.find(q => !q.task.done);
      if (n) { setActiveId(n.taskId); setPhase('focus'); const t = n.minutes * 60; setDur(t); setLeft(t); setRunning(autoStart); }
      else { setPhase('done'); setRunning(false); }
    }
  }, [running, left]);

  const isBreak = phase === 'break';
  const isDone = phase === 'done';
  const pct = dur ? (dur - left) / dur : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const nextEntry = queue.find(q => q.taskId === nextId);
  const nextName = nextEntry && nextEntry.task ? nextEntry.task.name : '—';
  const ringColor = isDone ? '--green-600' : isBreak ? '--secondary-500' : '--primary-500';
  const centerMain = isDone ? 'Done' : mm + ':' + ss;
  const centerSub = isDone ? 'Session complete' : isBreak ? ('Break · next: ' + nextName) : (active ? active.task.name : 'Nothing selected');
  const highlightId = isBreak ? nextId : (active && active.taskId);
  const plannedMin = queue.filter(q => !q.task.done).reduce((s, q) => s + q.minutes, 0);
  const startLabel = isBreak ? (running ? 'Pause' : left === dur ? 'Start break' : 'Resume') : (running ? 'Pause' : left === dur ? 'Start focus' : 'Resume');

  const onStart = () => { if (window.PFSound) window.PFSound.unlock(); setRunning(r => !r); };
  const onReset = () => { setRunning(false); setLeft(dur); };
  const skipBreak = () => {
    const n = queue.find(q => q.taskId === nextId) || queue.find(q => !q.task.done);
    if (n) { setActiveId(n.taskId); setPhase('focus'); const t = n.minutes * 60; setDur(t); setLeft(t); setRunning(false); }
  };
  const newSession = () => {
    setBlocks(0); setPhase('focus'); setRunning(false);
    const f = queue[0]; if (f) setActiveId(f.taskId);
    const d = (f ? f.minutes : 25) * 60; setDur(d); setLeft(d);
  };

  // ── dial ──
  const renderDial = (size) => {
    const big = size >= 380;
    const r = size / 2 - (big ? 28 : 20);
    const c = 2 * Math.PI * r;
    const sw = big ? 16 : 14;
    const cx = size / 2;
    return (
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={sw} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={`var(${ringColor})`} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s ease' }} />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', maxWidth: size * 0.72 }}>
          {isBreak && <div style={{ fontFamily: 'var(--font-sans)', fontSize: big ? 14 : 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--secondary-500)', marginBottom: 4 }}>Break</div>}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: big ? 92 : 56, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{centerMain}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: big ? 16 : 13, fontWeight: 600, color: active || isBreak || isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {centerSub}
          </div>
        </div>
      </div>
    );
  };

  // ── controls ──
  const renderControls = () => {
    if (isDone) {
      return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => onGoto('tasks')} style={{ height: 48, padding: '0 26px', borderRadius: 'var(--radius-full)', cursor: 'pointer', background: 'var(--primary-500)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Icon name="AddProperty1Bold" size={18} /> Add more tasks
          </button>
          <button onClick={newSession} title="Reset timer" style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ArrowLeftProperty1Linear" size={19} />
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onStart} disabled={!active} style={{
          height: 48, padding: '0 32px', borderRadius: 'var(--radius-full)', cursor: active ? 'pointer' : 'default',
          background: running ? 'var(--surface-card)' : active ? (isBreak ? 'var(--secondary-500)' : 'var(--primary-500)') : 'var(--neutral-200)',
          color: running ? 'var(--text-primary)' : active ? '#fff' : 'var(--text-tertiary)',
          border: running ? '1px solid var(--border-strong)' : 'none', boxShadow: running || !active ? 'none' : 'var(--shadow-md)',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name={running ? 'ClockProperty1Bold' : 'TimerProperty1Bold'} size={19} /> {startLabel}
        </button>
        <button onClick={onReset} title="Reset" style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="ArrowLeftProperty1Linear" size={19} />
        </button>
        {isBreak && (
          <button onClick={skipBreak} style={{ height: 48, padding: '0 16px', borderRadius: 'var(--radius-full)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700 }}>
            Skip break
          </button>
        )}
      </div>
    );
  };

  // expand glyph (no dedicated icon in the set)
  const ExpandGlyph = ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </svg>
  );

  // small switch
  const Switch = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? 'var(--primary-500)' : 'var(--neutral-300)', position: 'relative', transition: 'background .15s', flexShrink: 0, padding: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </button>
  );
  const settingSelect = (val, onCh, opts) => (
    <select value={val} onChange={e => onCh(parseInt(e.target.value, 10))}
      style={{ height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 6px' }}>
      {opts.map(m => <option key={m} value={m}>{m}m</option>)}
    </select>
  );

  return (
    <>
    <div className="pf-page" style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 32px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Focus</h1>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{blocks} block{blocks === 1 ? '' : 's'} done today · {plannedMin} min queued</p>
        </div>
        <button onClick={() => setFs(true)} disabled={!active} title="Full screen focus" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: active ? 'pointer' : 'default', color: active ? 'var(--text-secondary)' : 'var(--neutral-300)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700 }}>
          <ExpandGlyph size={14} /> Full screen
        </button>
      </div>

      <div className="pf-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 20, alignItems: 'start' }}>
        {/* left — timer */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          {renderDial(300)}
          {renderControls()}

          {/* session settings */}
          {!isDone && (
            <div style={{ width: '100%', borderTop: '1px solid var(--border-soft)', paddingTop: 16, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Auto-breaks</span>
                <Switch on={breakOn} onClick={() => setBreakOn(v => !v)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: breakOn ? 1 : 0.4, pointerEvents: breakOn ? 'auto' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Break length</span>
                {settingSelect(breakLen, setBreakLen, [3, 5, 10, 15])}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: breakOn ? 1 : 0.4, pointerEvents: breakOn ? 'auto' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Long break <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>· every 4</span></span>
                {settingSelect(longLen, setLongLen, [10, 15, 20, 30])}
              </div>
            </div>
          )}
        </div>

      {/* right — focus queue */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)' }}>Focus queue</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{queue.length}</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => onGoto('tasks')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Icon name="AddProperty1Bold" size={13} /> Add
          </button>
        </div>

        {queue.length === 0
          ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)' }}>
              Your focus queue is empty.<br />Open <b style={{ color: 'var(--text-secondary)' }}>Tasks</b> and tap the timer icon on any task to queue it here.
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queue.map((q, i) => {
                const on = highlightId && q.taskId === highlightId;
                const tag = window.PFProject.tag(q.task.project);
                const dragging = dragIdx === i;
                const dropAbove = dragIdx !== null && overIdx === i && dragIdx > i;
                const dropBelow = dragIdx !== null && overIdx === i && dragIdx < i;
                return (
                  <div key={q.taskId} onClick={() => { setActiveId(q.taskId); setPhase('focus'); setRunning(false); }}
                    onDragOver={e => { if (dragIdx === null) return; e.preventDefault(); if (overIdx !== i) setOverIdx(i); }}
                    onDrop={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) onReorder(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: '1px solid ' + (on ? 'var(--primary-400)' : 'transparent'),
                    background: on ? 'var(--primary-50)' : 'transparent',
                    opacity: q.task.done ? 0.55 : dragging ? 0.4 : 1,
                    boxShadow: dropAbove ? 'inset 0 2px 0 var(--primary-500)' : dropBelow ? 'inset 0 -2px 0 var(--primary-500)' : 'none',
                    transition: 'box-shadow .12s ease',
                  }}>
                    {/* drag handle */}
                    <span draggable
                      onDragStart={e => { e.stopPropagation(); setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {} }}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                      onClick={e => e.stopPropagation()}
                      title="Drag to reorder"
                      style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '3px 3px', gap: 3, padding: '2px 4px', cursor: 'grab', color: 'var(--neutral-300)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-tertiary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--neutral-300)'}>
                      {Array.from({ length: 6 }).map((_, d) => <span key={d} style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor' }} />)}
                    </span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${tag.color})`, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, wordBreak: 'break-word', textDecoration: q.task.done ? 'line-through' : 'none' }}>{q.task.name}</span>

                    {/* duration */}
                    <div onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                      <select value={q.minutes} onChange={e => onSetDuration(q.taskId, parseInt(e.target.value, 10))}
                        style={{ height: 26, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px' }}>
                        {DUR_OPTIONS.map(m => <option key={m} value={m}>{m}m</option>)}
                      </select>
                    </div>

                    <button onClick={e => { e.stopPropagation(); onRemove(q.taskId); }} title="Remove from focus" style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                      <Icon name="CloseCircleProperty1Linear" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      </div>{/* grid */}
    </div>{/* page */}

    {fs && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <button onClick={() => setFs(false)} title="Exit full screen (Esc)" style={{ position: 'absolute', top: 22, right: 26, display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700 }}>
          <Icon name="CloseCircleProperty1Linear" size={16} /> Exit
        </button>
        {renderDial(460)}
        {renderControls()}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-tertiary)' }}>Press Esc to exit full screen</div>
      </div>
    )}
    </>
  );
}
window.FocusScreen = FocusScreen;
