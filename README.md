# Peak Focus

An ADHD-friendly productivity app featuring a Pomodoro timer, task management with projects, habit tracking, and progress visualization.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router
- Data persisted in `localStorage`

## Local development

```sh
npm install
npm run dev
```

The dev server runs on http://localhost:8080.

## Build

```sh
npm run build
npm run preview
```

## Deployment

This project is deployed on **Vercel**:
https://vercel.com/magdas-projects-72309b5a/peak-focus-042026

Vercel auto-deploys the `main` branch on every push. To deploy manually:

```sh
npx vercel --prod
```
