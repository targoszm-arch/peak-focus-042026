import React from "react";
// Tasks — one place for every to-do. Filter chips (All / Today / Upcoming /
// Chores / Done), grouped by due date, inline add per view. Exposes window.TasksScreen.
function TasksScreen({ tasks, onToggleTask, onAddTask, onOpenProject }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const D = window.PFData;
  const PD = window.PFDate;
  const [filter, setFilter] = React.useState('all');

  const filters = [
    ['all', 'All'],
    ['today', 'Today'],
    ['upcoming', 'Upcoming'],
    ['chores', 'Chores'],
    ['done', 'Done'],
  ];

  const matchFor = (t, f) => {
    if (f === 'done') return t.done;
    if (t.done) return false;
    if (f === 'all') return true;
    if (f === 'today') return ['overdue', 'today'].includes(PD.bucket(t.due));
    if (f === 'upcoming') return ['tomorrow', 'week', 'later'].includes(PD.bucket(t.due));
    if (f === 'chores') return t.project === null;
    return true;
  };
  const visible = tasks.filter(t => matchFor(t, filter));

  // group by bucket, ordered
  const order = ['overdue', 'today', 'tomorrow', 'week', 'later'];
  const groupLabels = { overdue: 'Overdue', today: 'Today', tomorrow: 'Tomorrow', week: 'This week', later: 'Later' };
  const groups = order.map(k => ({ key: k, items: visible.filter(t => PD.bucket(t.due) === k) })).filter(g => g.items.length);

  const openCount = tasks.filter(t => !t.done).length;

  const chip = (id, label) => {
    const on = filter === id;
    const count = tasks.filter(t => matchFor(t, id)).length;
    return (
      <button key={id} onClick={() => setFilter(id)} style={{
        height: 34, padding: '0 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
        border: '1px solid ' + (on ? 'transparent' : 'var(--border-soft)'),
        background: on ? 'var(--primary-500)' : 'var(--surface-card)', color: on ? '#fff' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
        {label}
        <span style={{ fontSize: 11, fontWeight: 700, opacity: on ? 0.85 : 0.6 }}>{count}</span>
      </button>
    );
  };

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Tasks</h1>
        <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{openCount} open · check things off as you go</p>
      </div>

      <window.QuickAdd onAdd={onAddTask} defaultProject={filter === 'chores' ? null : null} placeholder={filter === 'chores' ? 'Add a chore…' : 'Add a task…  (goes to Chores unless you pick a project)'} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(([id, l]) => chip(id, l))}
      </div>

      {groups.length === 0
        ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 15, background: 'var(--surface-card)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>Nothing here. Enjoy the calm. ✨</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {groups.map(g => (
              <div key={g.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 10px' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: g.key === 'overdue' ? 'var(--red-500)' : 'var(--text-secondary)' }}>{groupLabels[g.key]}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{g.items.length}</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.items.map(t => <window.TaskRow key={t.id} task={t} onToggle={onToggleTask} onOpen={t.project ? () => onOpenProject(t.project) : undefined} />)}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
window.TasksScreen = TasksScreen;
