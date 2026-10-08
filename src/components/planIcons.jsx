// Line icons for the three kinds of plans — exams (orange), weekly
// activities (teal) and tasks (purple). Drawn rather than emoji so they look
// the same everywhere (🔁 renders as a flat blue box on iPhone).

export function ExamIcon({ size = 30, color = '#f5a524' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="18" rx="4" stroke={color} strokeWidth="2" />
      <path d="M4 11.5h20M9.5 3.5v4.5M18.5 3.5v4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 17.5l2.2 2.2 4.3-4.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WeeklyIcon({ size = 30, color = '#2ee6c5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="18" rx="4" stroke={color} strokeWidth="2" />
      <path d="M4 11.5h20M9.5 3.5v4.5M18.5 3.5v4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M17.6 16.3a3.8 3.8 0 00-6.6-1.3M10.4 19a3.8 3.8 0 006.6 1.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 13.4l.4 1.9 1.9-.4M17.4 21.9l-.4-1.9-1.9.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TaskIcon({ size = 30, color = '#a58cff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4.5" y="4.5" width="19" height="19" rx="5.5" stroke={color} strokeWidth="2" />
      <path d="M9.5 14.2l3 3 6-6.4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
