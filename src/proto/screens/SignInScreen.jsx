import React from "react";
// Sign-in screen — split layout: brand panel + form. Exposes window.SignInScreen.
function SignInScreen({ onSignIn }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Input, Button, Checkbox, Icon } = NS;
  const [remember, setRemember] = React.useState(true);
  const [email, setEmail] = React.useState('alex@peakfocus.app');
  const [pw, setPw] = React.useState('••••••••');
  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--surface-card)' }}>
      {/* Brand panel */}
      <div style={{ flex: 1, background: 'linear-gradient(160deg, var(--primary-600), var(--primary-500) 55%, var(--secondary-500))', color: '#fff', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={(window.__resources && window.__resources.logoWhite) || "../../assets/logo/peak-focus-logo-white.png"} alt="" style={{ height: 34 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Peak Focus</span>
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em' }}>Plan the work.<br/>Then work the plan.</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, opacity: 0.9, marginTop: 14, maxWidth: 380 }}>Tasks, projects and daily habits — organised in one calm, focused place. Built for minds that move fast.</p>
        </div>
        <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-sans)', fontSize: 13, opacity: 0.9 }}>
          <span><b style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>12k+</b><br/>Teams</span>
          <span><b style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>98%</b><br/>On-time</span>
          <span><b style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>4.9</b><br/>Rating</span>
        </div>
      </div>
      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: 0 }}>Welcome back</h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0' }}>Sign in to continue to your workspace.</p>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Email</span>
            <Input value={email} onChange={e => setEmail(e.target.value)} leadingIcon={<Icon name="SmsProperty1Linear" size={18} />} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>Password</span>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} leadingIcon={<Icon name="Setting2Property1Linear" size={18} />} />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <a href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-brand)', textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <Button variant="accent" fullWidth size="lg" onClick={onSignIn}>Sign in</Button>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>New here? <a href="#" onClick={onSignIn} style={{ color: 'var(--text-brand)', fontWeight: 600, textDecoration: 'none' }}>Create an account</a></p>
        </div>
      </div>
    </div>
  );
}
window.SignInScreen = SignInScreen;
