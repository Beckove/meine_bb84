# Project Setup and Run Guide

## Install Frontend Dependencies

```bash
npm install framer-motion
npm install react-router-dom
npm install react-icons
npm install lucide-react
```

> If you're using Tailwind CSS, follow the official installation guide:
> [https://tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite)

---

## Running the Project (cd to each part)

### Backend

```bash
cd backend
python server.py
```

> Requires Python with necessary libraries such as Flask installed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> If you're using Vite, the frontend will run at `http://localhost:5173`.

---

## Summary of Required Packages

| Package            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `framer-motion`    | Animation and motion effects             |
| `react-router-dom` | Client-side routing in React             |
| `react-icons`      | Popular icon libraries for React         |
| `lucide-react`     | Modern, optimized icon library for React |
| `tailwindcss`      | Utility-first CSS framework for styling  |
