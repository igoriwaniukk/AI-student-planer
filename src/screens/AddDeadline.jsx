import { useState } from 'react';
import { addDays, toISODate } from '../lib/store';

const SUBJECTS = ['Matematyka', 'Angielski', 'Fizyka', 'Historia', 'Chemia', 'Biologia'];

export default function AddDeadline({ onAddDeadline, onNavigate }) {
  const [form, setForm] = useState({
    subject: SUBJECTS[0],
    title: '',
    dueDate: addDays(toISODate(new Date()), 7),
    notes: '',
  });

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const deadline = onAddDeadline(form);
    onNavigate('prep', { deadlineId: deadline.id });
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 750 }}>Nowy termin</div>
      <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 6 }}>
        Dodaj egzamin, kolokwium lub zadanie z terminem.
      </div>

      <form onSubmit={submit} className="card" style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 12, color: '#8a8a99' }}>
          Przedmiot
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ marginTop: 4 }}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ fontSize: 12, color: '#8a8a99' }}>
          Tytuł
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="np. Kolokwium z funkcji"
            style={{ marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 12, color: '#8a8a99' }}>
          Termin
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            style={{ marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 12, color: '#8a8a99' }}>
          Notatki (opcjonalnie)
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ marginTop: 4, resize: 'vertical' }}
          />
        </label>

        <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
          Zapisz i zaplanuj naukę
        </button>
        <button type="button" className="btn" onClick={() => onNavigate('home')}>
          Anuluj
        </button>
      </form>
    </div>
  );
}
