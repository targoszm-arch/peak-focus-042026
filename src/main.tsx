import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'
import { lazy, Suspense } from 'react'

const ProtoProof = lazy(() => import('./proto/ProtoApp'))
const isProto = window.location.pathname === '/proto'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
    {isProto ? (
      <Suspense fallback={<div style={{ padding: 40 }}>Loading prototype…</div>}>
        <ProtoProof />
      </Suspense>
    ) : (
      <App />
    )}
  </ThemeProvider>
);
