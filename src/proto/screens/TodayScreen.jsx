import React from "react";
// Today — the calm home. Greeting, quick-add, today's tasks (checkable),
// habits to tick off, and active projects. Exposes window.TodayScreen.
function TodayScreen({ tasks, habits, onToggleTask, onAddTask, onToggleHabit, onOpenProject, onGoto }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, ProgressBar } = NS;
  const D = window.PFData;
  const PD = window.PFDate;

  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const dateStr = window.PF_TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const overdue = tasks.filter(t => !t.done && PD.bucket(t.due) === 'overdue');
  const today = tasks.filter(t => !t.done && PD.bucket(t.due) === 'today');
  const doneToday = tasks.filter(t => t.done && PD.bucket(t.due) === 'today').length;
  const totalToday = today.length + overdue.length + doneToday;
  const habitsDone = habits.filter(h => h.week[D.todayIdx]).length;

  const sectionTitle = { fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '.01em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 };
  const countPill = (n, tone) => (
    <span style={{ fontSize: 11, fontWeight: 700, color: `var(${tone})`, background: `color-mix(in srgb, var(${tone}) 12%, white)`, borderRadius: 'var(--radius-full)', padding: '1px 8px' }}>{n}</span>
  );

  // active projects with progress
  const projStats = D.projects.map(p => {
    const list = D.tasks.filter(t => t.project === p.id);
    const done = list.filter(t => t.done).length;
    return { ...p, total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }).filter(p => p.total > 0).slice(0, 4);

  return (
    <div className="pf-page" style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* header */}
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--secondary-500)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{dateStr}</div>
        <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{greet}, {D.user.name.split(' ')[0]}.</h1>
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-secondary)' }}>
          {today.length + overdue.length === 0 ? 'You’re all clear for today. Nice work.' : `${today.length + overdue.length} ${today.length + overdue.length === 1 ? 'task' : 'tasks'} to close today · ${habitsDone}/${habits.length} habits done`}
        </p>
      </div>

      {/* quick add front and center */}
      <window.QuickAdd onAdd={onAddTask} placeholder="What needs doing? Type and hit enter…" />

      {/* two-column: tasks + side rail */}
      <div className="pf-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* LEFT: today's tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {overdue.length > 0 && (
            <div>
              <div style={sectionTitle}><Icon name="ClockProperty1Bold" size={16} style={{ color: 'var(--red-500)' }} /> Overdue {countPill(overdue.length, '--red-500')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdue.map(t => <window.TaskRow key={t.id} task={t} onToggle={onToggleTask} />)}
              </div>
            </div>
          )}
          <div>
            <div style={sectionTitle}><Icon name="SunProperty1Bold" size={16} style={{ color: 'var(--secondary-500)' }} /> Today {countPill(`${doneToday}/${totalToday}`, '--primary-500')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {today.length === 0
                ? <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--surface-card)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>Nothing left for today 🎉</div>
                : today.map(t => <window.TaskRow key={t.id} task={t} onToggle={onToggleTask} />)}
            </div>
            <button onClick={() => onGoto('tasks')} style={{ marginTop: 10, alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--primary-500)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all tasks <Icon name="ArrowRightProperty1Linear" size={15} />
            </button>
          </div>
        </div>

        {/* RIGHT rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* habits */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={sectionTitle}><Icon name="StarProperty1Bold" size={16} style={{ color: 'var(--primary-500)' }} /> Habits today</div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{habitsDone}/{habits.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {habits.map(h => {
                const on = h.week[D.todayIdx];
                return (
                  <button key={h.id} onClick={() => onToggleHabit(h.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 'var(--radius-md)',
                    border: '1px solid ' + (on ? 'transparent' : 'var(--border-soft)'), background: on ? 'var(--green-50)' : 'var(--surface-card)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: on ? 'var(--green-600)' : 'var(--surface-sunken)', color: on ? '#fff' : 'var(--text-tertiary)',
                      border: on ? 'none' : '1px solid var(--border-strong)',
                    }}>
                      {on ? <Icon name="TickCircleProperty1Bold" size={17} /> : <Icon name={h.icon} size={15} />}
                    </span>
                    <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.7 : 1 }}>{h.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, color: 'var(--secondary-500)' }}>
                      <Icon name="FlagProperty1Bold" size={12} />{h.streak}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* active projects */}
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={sectionTitle}><Icon name="FolderProperty1Bold" size={16} style={{ color: 'var(--secondary-500)' }} /> Active projects</div>
              <button onClick={() => onGoto('projects')} style={{ border: 'none', background: 'transparent', color: 'var(--primary-500)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {projStats.map(p => {
                const c = window.PFProject.customer(p.customer);
                return (
                  <button key={p.id} onClick={() => onOpenProject(p.id)} style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '11px 10px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-page)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${c.color})`, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)' }}>{p.done}/{p.total}</span>
                    </div>
                    <ProgressBar value={p.pct} height={6} tone={p.pct === 100 ? 'success' : 'primary'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.TodayScreen = TodayScreen;
