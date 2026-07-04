// Chime via Web Audio — no files, works offline. window.PFSound.
// Must be unlocked from a user gesture (call unlock() on the Start click).
(function () {
  let ctx;
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ctx; }
  function unlock() { const c = ac(); if (c && c.state === 'suspended') c.resume(); }
  function tone(freq, start, dur, gain) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function seq(notes) { unlock(); notes.forEach(n => tone(n.f, n.t, n.d || 0.5, n.g)); }
  // rising 3-note bell — a focus block finished
  const workEnd = () => seq([{ f: 659.25, t: 0, d: .55 }, { f: 783.99, t: .13, d: .55 }, { f: 1046.5, t: .26, d: .8 }]);
  // gentle 2-note — break is over, back to work
  const breakEnd = () => seq([{ f: 880, t: 0, d: .4 }, { f: 587.33, t: .15, d: .55 }]);
  // full arpeggio — whole queue complete
  const celebrate = () => seq([{ f: 523.25, t: 0, d: .5 }, { f: 659.25, t: .12, d: .5 }, { f: 783.99, t: .24, d: .5 }, { f: 1046.5, t: .36, d: .9 }, { f: 1318.5, t: .5, d: 1 }]);
  window.PFSound = { unlock, workEnd, breakEnd, celebrate };
})();
