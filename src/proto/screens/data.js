// Peak Focus — app data + date helpers.
// One flat task list; project===null means it's a Chore (quick random task).
window.PF_TODAY = new Date('2026-07-01T09:00:00'); // fixed "now" for the prototype

window.PFData = {
  user: { name: 'Magda Rivera', role: 'Founder, Solo' },

  // Projects live under a customer/client. "Personal" is the catch-all client.
  customers: [
    { id: 'acme',     name: 'Acme Co',      initial: 'A', color: '--primary-500',   website: 'acme.co',        contact: 'Daniel Cole',  role: 'VP Product',    email: 'daniel@acme.co',      location: 'Austin, TX',   stage: 'Active',    health: 'Healthy', arr: 48000, renewal: '2026-11-01' },
    { id: 'lumen',    name: 'Lumen Health', initial: 'L', color: '--secondary-500', website: 'lumenhealth.io', contact: 'Priya Nair',   role: 'Head of Ops',   email: 'priya@lumenhealth.io', location: 'Remote',       stage: 'Expansion', health: 'Watch',   arr: 36000, renewal: '2026-08-15' },
    { id: 'personal', name: 'Personal',     initial: 'P', color: '--green-600',     website: '—',              contact: 'Magda Rivera', role: 'Owner',         email: 'magda@rivera.co',      location: 'Lisbon, PT',   stage: 'Active',    health: 'Healthy', arr: 0,     renewal: '' },
  ],

  projects: [
    { id: 'website', name: 'Website Revamp', customer: 'acme',     due: '2026-07-11' },
    { id: 'brand',   name: 'Brand Refresh',  customer: 'acme',     due: '2026-07-25' },
    { id: 'mobile',  name: 'Mobile App v2',  customer: 'lumen',    due: '2026-07-18' },
    { id: 'launch',  name: 'Q3 Launch',      customer: 'lumen',    due: '2026-08-01' },
    { id: 'move',    name: 'Home Move',      customer: 'personal', due: '2026-07-15' },
  ],

  // project:null  => Chore.  due is ISO date (or null = someday).
  tasks: [
    { id: 't1',  name: 'Reply to Acme contract email',         project: null,      priority: 'High',   due: '2026-06-30', done: false },
    { id: 't2',  name: 'Book dentist appointment',             project: null,      priority: 'Low',    due: '2026-07-01', done: false },
    { id: 't3',  name: 'Finalize homepage hero copy',          project: 'website', priority: 'High',   due: '2026-07-01', done: false, status: 'progress', start: '2026-06-28' },
    { id: 't4',  name: 'Export new logo files for dev',        project: 'brand',   priority: 'Medium', due: '2026-07-01', done: false, status: 'review',   start: '2026-06-29' },
    { id: 't5',  name: 'Review onboarding screens',            project: 'mobile',  priority: 'Medium', due: '2026-07-01', done: false, status: 'progress', start: '2026-06-29' },
    { id: 't6',  name: 'Pick up dry cleaning',                 project: null,      priority: 'Low',    due: '2026-07-02', done: false },
    { id: 't7',  name: 'Wireframe pricing page',               project: 'website', priority: 'Medium', due: '2026-07-02', done: false },
    { id: 't8',  name: 'Schedule launch email sequence',       project: 'launch',  priority: 'High',   due: '2026-07-03', done: false },
    { id: 't9',  name: 'Order moving boxes',                   project: 'move',    priority: 'Medium', due: '2026-07-04', done: false },
    { id: 't10', name: 'QA checkout on mobile',                project: 'mobile',  priority: 'High',   due: '2026-07-05', done: false, status: 'progress', start: '2026-07-01' },
    { id: 't11', name: 'Draft Q3 launch announcement',         project: 'launch',  priority: 'Low',    due: '2026-07-09', done: false },
    { id: 't12', name: 'Research new project mgmt tool',       project: null,      priority: 'Low',    due: null,         done: false },
    { id: 't13', name: 'Send invoice to Acme',                 project: 'website', priority: 'High',   due: '2026-06-30', done: true,  status: 'done',     start: '2026-06-27' },
    { id: 't14', name: 'Confirm venue for launch party',       project: 'launch',  priority: 'Medium', due: '2026-07-01', done: true,  status: 'done',     start: '2026-06-29' },
  ],

  // 7-day week, Mon..Sun. Today = Wed (index 2). true = done that day.
  habits: [
    { id: 'h1', name: 'Morning walk',    icon: 'SunProperty1Linear',        streak: 12, week: [true, true, false, false, false, false, false] },
    { id: 'h2', name: 'Meditate 10 min', icon: 'StarProperty1Linear',       streak: 5,  week: [true, true, true,  false, false, false, false] },
    { id: 'h3', name: 'Read 20 min',     icon: 'NoteProperty1Linear',       streak: 3,  week: [false, true, false, false, false, false, false] },
    { id: 'h4', name: 'Drink 2L water',  icon: 'TickCircleProperty1Linear', streak: 8,  week: [true, true, false, false, false, false, false] },
    { id: 'h5', name: 'No phone after 10', icon: 'MoonProperty1Linear',     streak: 2,  week: [true, false, false, false, false, false, false] },
  ],

  health: {
    // Oura-style daily readout. Each metric carries a 14-day sparkline + 30d trend.
    updated: 'Today, 6:24 AM',
    device: 'Oura Ring Gen 3',
    metrics: [
      { key: 'sleepScore', icon: 'MoonProperty1Bold',  label: 'Sleep score',      value: '82',    unit: '/ 100', tone: 'accent',  delta: '+6',   trend: 'up',   spark: [74, 71, 78, 69, 80, 76, 72, 84, 79, 77, 83, 75, 81, 82] },
      { key: 'readiness',  icon: 'SunProperty1Bold',   label: 'Readiness',        value: '78',    unit: '/ 100', tone: 'primary', delta: '+3',   trend: 'up',   spark: [70, 68, 74, 66, 72, 75, 71, 77, 73, 76, 74, 72, 79, 78] },
      { key: 'activity',   icon: 'StarProperty1Bold',  label: 'Activity',         value: '74',    unit: '/ 100', tone: 'success', delta: '-2',   trend: 'down', spark: [80, 78, 72, 76, 70, 74, 79, 73, 71, 75, 77, 72, 76, 74] },
      { key: 'hrv',        icon: 'ClockProperty1Bold', label: 'HRV (avg)',        value: '48',    unit: 'ms',    tone: 'accent',  delta: '+4',   trend: 'up',   spark: [40, 42, 39, 44, 41, 45, 43, 47, 44, 46, 49, 45, 47, 48] },
      { key: 'restingHr',  icon: 'TimerProperty1Bold', label: 'Resting HR',       value: '54',    unit: 'bpm',   tone: 'primary', delta: '-2',   trend: 'down', spark: [58, 57, 59, 56, 57, 55, 56, 54, 55, 53, 54, 56, 55, 54] },
      { key: 'respRate',   icon: 'ChartProperty1Bold', label: 'Respiratory rate', value: '14.6',  unit: '/min',  tone: 'success', delta: '0.0',  trend: 'flat', spark: [14.4, 14.5, 14.6, 14.5, 14.7, 14.5, 14.6, 14.4, 14.6, 14.5, 14.7, 14.6, 14.5, 14.6] },
      { key: 'bodyTemp',   icon: 'SunProperty1Bold',   label: 'Body temp',        value: '+0.2',  unit: '°C',    tone: 'primary', delta: 'normal', trend: 'flat', spark: [-0.1, 0, 0.1, -0.2, 0.1, 0.2, 0, 0.3, 0.1, 0, 0.2, 0.1, 0.3, 0.2] },
      { key: 'steps',      icon: 'ChartProperty1Bold', label: 'Steps',            value: '7,240', unit: '/ 10k', tone: 'accent',  delta: '+1.1k', trend: 'up',   spark: [6200, 8100, 5400, 9200, 7800, 6100, 6900, 8600, 7300, 5900, 8800, 6400, 7100, 7240] },
      { key: 'spo2',       icon: 'StarProperty1Bold',  label: 'Blood oxygen',     value: '97',    unit: '%',     tone: 'success', delta: 'normal', trend: 'flat', spark: [96, 97, 97, 96, 98, 97, 96, 97, 98, 97, 96, 97, 97, 97] },
      { key: 'mood',       icon: 'SmsProperty1Bold',   label: 'Mood today',       value: 'Good',  unit: '',      tone: 'primary', delta: '', trend: '', spark: null, moodScale: 4 },
    ],
    summary: [
      { label: 'Total sleep',      value: '7h 34m' },
      { label: 'Sleep efficiency', value: '91%' },
      { label: 'Sleep trend (30d)', value: 'Improving', trend: 'up' },
      { label: 'HRV trend (30d)',   value: 'Improving', trend: 'up' },
      { label: 'Resting HR (30d)',  value: 'Steady',   trend: 'flat' },
    ],
    streak: { value: 5, label: 'day habit streak' },
    week: [6200, 8100, 7240, 0, 0, 0, 0], // steps Mon..Sun
    // Daily sleep, oldest → newest, last entry = today (2026-07-01). h = hours asleep, s = sleep score.
    sleepLog: [
      { h: 6.8, s: 74 }, { h: 7.2, s: 79 }, { h: 5.9, s: 63 }, { h: 7.6, s: 84 }, { h: 6.4, s: 70 }, { h: 8.1, s: 88 }, { h: 7.0, s: 77 },
      { h: 6.2, s: 68 }, { h: 7.4, s: 81 }, { h: 7.9, s: 86 }, { h: 5.6, s: 60 }, { h: 6.9, s: 75 }, { h: 7.3, s: 80 }, { h: 8.4, s: 91 },
      { h: 7.1, s: 78 }, { h: 6.6, s: 72 }, { h: 5.4, s: 58 }, { h: 7.7, s: 85 }, { h: 6.3, s: 69 }, { h: 7.5, s: 82 }, { h: 8.0, s: 87 },
      { h: 6.7, s: 73 }, { h: 7.8, s: 85 }, { h: 5.8, s: 62 }, { h: 7.2, s: 79 }, { h: 6.5, s: 71 }, { h: 8.2, s: 89 }, { h: 7.4, s: 81 },
      { h: 6.1, s: 66 }, { h: 7.6, s: 83 }, { h: 6.9, s: 76 }, { h: 5.5, s: 59 }, { h: 7.9, s: 86 }, { h: 7.0, s: 78 }, { h: 7.6, s: 82 },
    ],
    // Daily steps, oldest → newest, last entry = today. Aligned 1:1 with sleepLog.
    stepsLog: [
      6200, 8100, 5400, 9200, 7800, 6100, 6900, 8600, 7300, 5900, 8800, 6400, 7100, 9400,
      7600, 6800, 4900, 10200, 7200, 8300, 9100, 6600, 8900, 5300, 7700, 6500, 11200, 8000,
      5800, 9600, 7400, 5100, 8700, 7900, 7240,
    ],
  },

  integrations: [
    { id: 'gcal',   name: 'Google Calendar', initial: 'G',  color: '#4285F4', connected: true,  account: 'alex@rivera.co',      blurb: 'Task due dates and focus blocks appear on your calendar automatically.', metricValue: 312, metricLabel: 'events synced', lastSync: '2 min ago' },
    { id: 'slack',  name: 'Slack',           initial: 'S',  color: '#4A154B', connected: true,  account: 'Rivera HQ workspace',   blurb: 'Get a daily focus summary and gentle reminders in your Slack DMs.',      metricValue: 18,  metricLabel: 'reminders sent', lastSync: '12 min ago' },
    { id: 'notion', name: 'Notion',          initial: 'N',  color: '#111827', connected: true,  account: 'Rivera HQ',            blurb: 'Turn Notion pages into tasks and link project notes back to Notion.',    metricValue: 24,  metricLabel: 'pages linked', lastSync: '1 hr ago' },
    { id: 'health', name: 'Apple Health',    initial: 'H',  color: '#FF2D55', connected: true,  account: 'iPhone 15 Pro',        blurb: 'Steps, sleep and activity flow into your Health dashboard each morning.', metricValue: 7,   metricLabel: 'metrics synced', lastSync: '9 min ago' },
    { id: 'github', name: 'GitHub',          initial: 'Gh', color: '#24292F', connected: false, account: '',                     blurb: 'Convert assigned issues and PRs into Peak Focus tasks.',                  metricValue: 0,   metricLabel: '', lastSync: '' },
    { id: 'linear', name: 'Linear',          initial: 'L',  color: '#5E6AD2', connected: false, account: '',                     blurb: 'Two-way sync your Linear issues with your task list.',                    metricValue: 0,   metricLabel: '', lastSync: '' },
    { id: 'gmail',  name: 'Gmail',           initial: 'M',  color: '#EA4335', connected: false, account: '',                     blurb: 'Star an email to instantly create a task with a link back.',              metricValue: 0,   metricLabel: '', lastSync: '' },
    { id: 'zoom',   name: 'Zoom',            initial: 'Z',  color: '#2D8CFF', connected: false, account: '',                     blurb: 'Auto-block focus time around your scheduled meetings.',                   metricValue: 0,   metricLabel: '', lastSync: '' },
  ],

  // People who collaborate on projects — used for board card avatars + project detail.
  team: [
    { id: 'magda',  name: 'Magda Rivera', role: 'Founder',      email: 'magda@rivera.co', teamRole: 'Admin' },
    { id: 'sana',   name: 'Sana Okafor',  role: 'Copywriter',   email: 'sana@rivera.co',  teamRole: 'User' },
    { id: 'dev',    name: 'Dev Patel',    role: 'Engineer',     email: 'dev@rivera.co',   teamRole: 'User' },
    { id: 'noor',   name: 'Noor Haddad',  role: 'Designer',     email: 'noor@rivera.co',  teamRole: 'User' },
    { id: 'leo',    name: 'Leo Marsh',    role: 'Marketing',    email: 'leo@rivera.co',   teamRole: 'Viewer' },
  ],

  // Board tag catalogue — each maps to a brand-token colour.
  tags: {
    Design:      { label: 'Design',      color: '--primary-500' },
    Copy:        { label: 'Copy',        color: '--secondary-500' },
    Dev:         { label: 'Dev',         color: '--green-600' },
    Marketing:   { label: 'Marketing',   color: '--yellow-500' },
    Research:    { label: 'Research',    color: '--primary-500' },
    Ops:         { label: 'Ops',         color: '--red-500' },
  },

  priorityTone: { Low: 'neutral', Medium: 'primary', High: 'danger' },
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  todayIdx: 2,
};

// Decorate the project-scoped tasks with board metadata (tag, assignees, subtasks, comments, files).
// Chores (project === null) stay lightweight.
(function enrichBoardTasks() {
  const meta = {
    t3:  { tag: 'Copy',      assignees: ['magda', 'sana'],        subtasks: [3, 4], comments: 5, files: 2 },
    t4:  { tag: 'Design',    assignees: ['noor'],                 subtasks: [2, 2], comments: 2, files: 6 },
    t5:  { tag: 'Design',    assignees: ['noor', 'dev'],          subtasks: [1, 3], comments: 8, files: 3 },
    t7:  { tag: 'Design',    assignees: ['magda'],                subtasks: [0, 4], comments: 1, files: 0 },
    t8:  { tag: 'Marketing', assignees: ['sana', 'leo'],          subtasks: [2, 5], comments: 4, files: 1 },
    t9:  { tag: 'Ops',       assignees: ['magda'],                subtasks: [1, 2], comments: 0, files: 0 },
    t10: { tag: 'Dev',       assignees: ['dev', 'magda', 'noor'], subtasks: [4, 6], comments: 3, files: 4 },
    t11: { tag: 'Marketing', assignees: ['leo'],                  subtasks: [0, 3], comments: 2, files: 0 },
    t13: { tag: 'Ops',       assignees: ['magda'],                subtasks: [2, 2], comments: 1, files: 3 },
    t14: { tag: 'Ops',       assignees: ['sana', 'magda'],        subtasks: [3, 3], comments: 6, files: 2 },
  };
  const byId = Object.fromEntries(window.PFData.team.map(m => [m.id, m]));
  window.PFData.tasks.forEach(t => {
    const m = meta[t.id];
    if (!m) return;
    t.tag = m.tag;
    t.assignees = m.assignees.map(id => byId[id]).filter(Boolean);
    t.subtasks = { done: m.subtasks[0], total: m.subtasks[1] };
    t.comments = m.comments;
    t.files = m.files;
  });
})();

// ---- date helpers (all relative to PF_TODAY) ----
window.PFDate = {
  parse(iso) { return iso ? new Date(iso + 'T09:00:00') : null; },
  startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
  daysFromToday(iso) {
    if (!iso) return Infinity;
    const a = this.startOfDay(window.PF_TODAY), b = this.startOfDay(this.parse(iso));
    return Math.round((b - a) / 86400000);
  },
  // grouping bucket key + label
  bucket(iso) {
    if (!iso) return 'later';
    const d = this.daysFromToday(iso);
    if (d < 0) return 'overdue';
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d <= 7) return 'week';
    return 'later';
  },
  label(iso) {
    if (!iso) return 'Someday';
    const d = this.daysFromToday(iso);
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d === -1) return 'Yesterday';
    if (d < 0) return `${-d}d overdue`;
    const dt = this.parse(iso);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
};
