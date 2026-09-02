import { useState } from 'react';

const ACTIVITY_OPTIONS = [
  'Szkoła / liceum',
  'Korepetycje',
  'Kółko naukowe',
  'Sport / treningi',
  'Praca',
  'Kurs językowy',
];

const MAX_STORED_FILE_SIZE = 4_000_000;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [nameDraft, setNameDraft] = useState('');
  const [planFile, setPlanFile] = useState(null);
  const [planError, setPlanError] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activitiesNote, setActivitiesNote] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    setPlanError('');
    if (!file) {
      setPlanFile(null);
      return;
    }
    if (file.size > MAX_STORED_FILE_SIZE) {
      setPlanFile({ name: file.name, type: file.type, size: file.size, dataUrl: null });
      setPlanError('Plik jest duży — zapiszemy tylko jego nazwę.');
      return;
    }
    const dataUrl = await readFileAsDataURL(file);
    setPlanFile({ name: file.name, type: file.type, size: file.size, dataUrl });
  }

  function toggleActivity(activity) {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }

  function finish() {
    onComplete({
      name: nameDraft.trim(),
      schoolPlan: planFile,
      activities: { selected: selectedActivities, note: activitiesNote.trim() },
    });
  }

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 11.5, color: '#6f6f7d', fontWeight: 650, marginBottom: 10 }}>
        KROK {step + 1} Z 3
      </div>

      {step === 0 && (
        <>
          <div style={{ fontSize: 24, fontWeight: 750 }}>Cześć! 👋</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>Jak masz na imię?</div>
          <form
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDraft.trim()) setStep(1);
            }}
          >
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Imię" autoFocus />
            <button type="submit" className="btn btn-primary">Zaczynajmy</button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>Twój plan lekcji</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            Masz plan lekcji zapisany w pliku? Dodaj go, żebyśmy mogli lepiej dopasować Twój harmonogram.
          </div>
          <div className="card" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
            {planFile && (
              <div style={{ fontSize: 12, color: '#a58cff' }}>📎 {planFile.name}</div>
            )}
            {planError && (
              <div style={{ fontSize: 11.5, color: '#ff8a5c' }}>{planError}</div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              {planFile ? 'Dalej' : 'Pomiń ten krok'}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>Czym się teraz zajmujesz?</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            Zaznacz, co już robisz — pomoże nam to lepiej zaplanować Twój czas.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {ACTIVITY_OPTIONS.map((activity) => {
              const active = selectedActivities.includes(activity);
              return (
                <button
                  key={activity}
                  type="button"
                  className="btn"
                  style={active ? { background: 'rgba(139,109,255,.18)', borderColor: '#8b6dff', color: '#a58cff' } : undefined}
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                </button>
              );
            })}
          </div>
          <label style={{ fontSize: 12, color: '#8a8a99', marginTop: 16, display: 'block' }}>
            Coś jeszcze, o czym powinniśmy wiedzieć? (opcjonalnie)
            <textarea
              rows={3}
              value={activitiesNote}
              onChange={(e) => setActivitiesNote(e.target.value)}
              placeholder="np. przygotowuję się do matury z matematyki"
              style={{ marginTop: 4, resize: 'vertical' }}
            />
          </label>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={finish}>
            Zakończ
          </button>
        </>
      )}
    </div>
  );
}
