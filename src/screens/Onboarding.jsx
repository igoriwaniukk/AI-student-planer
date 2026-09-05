import { useState } from 'react';
import { ENERGY_OPTIONS, PREF_OPTIONS, STUDY_TIME_OPTIONS, SUBJECTS } from '../lib/plannerData';

const ACTIVITY_OPTIONS = [
  'Szkoła / liceum',
  'Korepetycje',
  'Kółko naukowe',
  'Sport / treningi',
  'Praca',
  'Kurs językowy',
];

const PRIORITY_SUBJECT_OPTIONS = SUBJECTS.filter((s) => s !== 'Inny');

const MAX_STORED_FILE_SIZE = 4_000_000;
const TOTAL_STEPS = 6;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className="btn"
      style={active ? { background: 'rgba(139,109,255,.18)', borderColor: '#8b6dff', color: '#a58cff' } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [nameDraft, setNameDraft] = useState('');
  const [planFile, setPlanFile] = useState(null);
  const [planError, setPlanError] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activitiesNote, setActivitiesNote] = useState('');
  const [studyTime, setStudyTime] = useState('Wieczorem');
  const [bedtime, setBedtime] = useState('22:30');
  const [wake, setWake] = useState('6:30');
  const [energy, setEnergy] = useState('Normalna');
  const [pref, setPref] = useState('Wolny wieczór');
  const [prioritySubjects, setPrioritySubjects] = useState([]);

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

  function toggleInList(value, list, setList) {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function finish() {
    onComplete({
      name: nameDraft.trim(),
      schoolPlan: planFile,
      activities: { selected: selectedActivities, note: activitiesNote.trim() },
      profile: { studyTime, bedtime, wake, energy, pref, prioritySubjects },
    });
  }

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ fontSize: 11.5, color: '#6f6f7d', fontWeight: 650, marginBottom: 10 }}>
        KROK {step + 1} Z {TOTAL_STEPS}
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
            {ACTIVITY_OPTIONS.map((activity) => (
              <Chip key={activity} label={activity} active={selectedActivities.includes(activity)} onClick={() => toggleInList(activity, selectedActivities, setSelectedActivities)} />
            ))}
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
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setStep(3)}>
            Dalej
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>Twój rytm dnia</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            Dzięki temu plany nauki będą pasować do Twojego dnia, a nie z nim kolidować.
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>Kiedy najlepiej Ci się uczy?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {STUDY_TIME_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={studyTime === opt} onClick={() => setStudyTime(opt)} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <label style={{ flex: 1, fontSize: 12, color: '#8a8a99' }}>
              Kładziesz się spać
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} style={{ marginTop: 6 }} />
            </label>
            <label style={{ flex: 1, fontSize: 12, color: '#8a8a99' }}>
              Wstajesz
              <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} style={{ marginTop: 6 }} />
            </label>
          </div>

          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(4)}>
            Dalej
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>Energia i styl nauki</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            To domyślne ustawienia dla nowych planów — zawsze będziesz mógł/mogła je zmienić dla konkretnego dnia.
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>Twój zwykły poziom energii</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {ENERGY_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={energy === opt} onClick={() => setEnergy(opt)} />
            ))}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>Na czym najbardziej Ci zależy?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {PREF_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={pref === opt} onClick={() => setPref(opt)} />
            ))}
          </div>

          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(5)}>
            Dalej
          </button>
        </>
      )}

      {step === 5 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>Priorytetowe przedmioty</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            Które przedmioty sprawiają Ci najwięcej trudności albo są dla Ciebie najważniejsze? AI będzie dawać im pierwszeństwo w planach.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {PRIORITY_SUBJECT_OPTIONS.map((s) => (
              <Chip key={s} label={s} active={prioritySubjects.includes(s)} onClick={() => toggleInList(s, prioritySubjects, setPrioritySubjects)} />
            ))}
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={finish}>
            Zakończ
          </button>
        </>
      )}
    </div>
  );
}
