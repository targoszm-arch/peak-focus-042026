import React from "react";
// Habits — big tap targets for today + a week grid showing streaks.
// Exposes window.HabitsScreen.
function HabitsScreen({ habits, onToggleHabit, onToggleHabitDay, onRename, onDelete, onAdd }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const D = window.PFData;
  const todayIdx = D.todayIdx;
  const doneToday = habits.filter(h => h.week[todayIdx]).length;

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Habits</h1>
        <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{doneToday}/{habits.length} done today · tap the circle to log</p>
      </div>

      {/* week header */}
      <div className="pf-hscroll" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 40px) 64px 34px', alignItems: 'center', padding: '12px 18px', gap: 6, borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-page)' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)' }}>Habit</span>
          {D.weekdays.map((d, i) => (
            <span key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: i === todayIdx ? 'var(--primary-500)' : 'var(--text-tertiary)' }}>{d[0]}</span>
          ))}
          <span style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)' }}>Streak</span>
          <span />
        </div>

        {habits.map((h, hi) => (
          <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 40px) 64px 34px', alignItems: 'center', padding: '12px 18px', gap: 6, borderBottom: hi < habits.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={h.icon} size={16} />
              </span>
              <span
                contentEditable={!!onRename}
                suppressContentEditableWarning
                spellCheck={false}
                title="Click to edit"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === 'Escape') { e.currentTarget.textContent = h.name; e.currentTarget.blur(); } }}
                onFocus={e => { e.currentTarget.style.background = 'var(--surface-sunken)'; e.currentTarget.style.overflow = 'visible'; e.currentTarget.style.textOverflow = 'clip'; }}
                onBlur={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.overflow = 'hidden'; e.currentTarget.style.textOverflow = 'ellipsis'; const v = e.currentTarget.textContent.trim(); if (v && v !== h.name) onRename(h.id, { name: v }); else e.currentTarget.textContent = h.name; }}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', outline: 'none', borderRadius: 'var(--radius-sm)', padding: '2px 5px', margin: '-2px -5px', cursor: onRename ? 'text' : 'inherit' }}>{h.name}</span>
            </span>
            {h.week.map((on, di) => {
              const isToday = di === todayIdx;
              const future = di > todayIdx;
              return (
                <span key={di} style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => onToggleHabitDay(h.id, di)}
                    disabled={future}
                    title={D.weekdays[di]}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', cursor: future ? 'default' : 'pointer', padding: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      border: on ? 'none' : '1.5px solid ' + (isToday ? 'var(--primary-400)' : 'var(--border-strong)'),
                      background: on ? 'var(--green-600)' : 'transparent', color: '#fff',
                      opacity: future ? 0.35 : 1,
                    }}>
                    {on && <Icon name="TickCircleProperty1Bold" size={16} />}
                  </button>
                </span>
              );
            })}
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--secondary-500)' }}>
              <Icon name="FlagProperty1Bold" size={13} />{h.streak}
            </span>
            {onDelete && (
              <button onClick={() => onDelete(h.id)} title="Delete habit" style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, justifySelf: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <Icon name="TrashProperty1Linear" size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => onAdd && onAdd()} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
        <Icon name="AddProperty1Linear" size={17} /> New habit
      </button>
    </div>
  );
}
window.HabitsScreen = HabitsScreen;
