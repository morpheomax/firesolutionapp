import { useCallback, useEffect, useMemo, useState } from 'react';
import FirePumpSystem3D from './FirePumpSystem3D.jsx';
import {
  defaultSelectedComponentId,
  firePumpComponents,
  guidedTourSteps,
  packagedPumpSystem,
  standardsReference,
  systemCatalog,
} from '../data/firePumpSystem.js';

const categoryLabels = {
  'water-storage': 'Storage',
  'pump-house': 'Pump house',
  distribution: 'Distribution',
};

export default function FirePumpLearningExperience() {
  const [selectedSystemId, setSelectedSystemId] = useState(packagedPumpSystem.id);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(packagedPumpSystem.subsystems[0].id);
  const [selectedId, setSelectedId] = useState(defaultSelectedComponentId);
  const [selectedModeId, setSelectedModeId] = useState(packagedPumpSystem.learningModes[0].id);
  const [query, setQuery] = useState('');
  const [focusMode, setFocusMode] = useState(true);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const selectedSubsystem = useMemo(
    () => packagedPumpSystem.subsystems.find((subsystem) => subsystem.id === selectedSubsystemId) ?? packagedPumpSystem.subsystems[0],
    [selectedSubsystemId],
  );

  const visibleComponentIds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return selectedSubsystem.componentIds.filter((id) => {
      if (!normalizedQuery) return true;
      const component = firePumpComponents[id];
      const searchable = [
        component.name.es,
        component.name.en,
        component.shortLabel,
        component.brandReference,
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, selectedSubsystem.componentIds]);

  useEffect(() => {
    if (selectedModeId === 'guided-tour') return;
    if (selectedId === null) return;
    if (visibleComponentIds.length > 0 && !visibleComponentIds.includes(selectedId)) {
      setSelectedId(visibleComponentIds[0]);
    }
  }, [selectedId, selectedModeId, visibleComponentIds]);

  const selectedComponent = selectedId ? firePumpComponents[selectedId] : null;
  const selectedMode = packagedPumpSystem.learningModes.find((mode) => mode.id === selectedModeId);
  const isGuidedTour = selectedModeId === 'guided-tour';
  const showFlow = selectedModeId === 'hydraulic-path' || selectedModeId === 'guided-tour';
  const currentTourStep = guidedTourSteps[tourStepIndex] ?? guidedTourSteps[0];

  const syncSelectionFromAnywhere = useCallback((componentId) => {
    if (!componentId) {
      setSelectedId((currentId) => (currentId === null ? currentId : null));
      return;
    }

    const owningSubsystem = packagedPumpSystem.subsystems.find((subsystem) => subsystem.componentIds.includes(componentId));
    if (owningSubsystem && owningSubsystem.id !== selectedSubsystemId) {
      setSelectedSubsystemId(owningSubsystem.id);
    }

    if (query) {
      const component = firePumpComponents[componentId];
      const searchable = [
        component.name.es,
        component.name.en,
        component.shortLabel,
        component.brandReference,
      ].join(' ').toLowerCase();

      if (!searchable.includes(query.trim().toLowerCase())) {
        setQuery('');
      }
    }

    setSelectedId((currentId) => (currentId === componentId ? currentId : componentId));
  }, [query, selectedSubsystemId]);

  useEffect(() => {
    if (!isGuidedTour) return;
    const nextId = currentTourStep?.componentId;
    if (nextId) {
      syncSelectionFromAnywhere(nextId);
      setFocusMode(true);
    }
  }, [currentTourStep, isGuidedTour]);

  useEffect(() => {
    if (selectedModeId !== 'guided-tour') return;
    setQuery('');
  }, [selectedModeId]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_20rem] xl:items-start">
      <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/65 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 backdrop-blur-xl">
        <div className="border-b border-slate-200/80 bg-white/45 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">Module 01</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{packagedPumpSystem.title.es}</h2>
              </div>
              <span className="rounded-lg border border-slate-200/80 bg-white/75 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
                {selectedMode?.title}
              </span>
            </div>

            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Sistema
                <select className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm" value={selectedSystemId} onChange={(event) => setSelectedSystemId(event.target.value)}>
                  {systemCatalog.map((system) => (
                    <option key={system.id} value={system.id} disabled={system.status !== 'active'}>
                      {system.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Modo
                <select
                  className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm"
                  value={selectedModeId}
                  onChange={(event) => {
                    const nextModeId = event.target.value;
                    setSelectedModeId(nextModeId);
                    if (nextModeId === 'guided-tour') setTourStepIndex(0);
                  }}
                >
                  {packagedPumpSystem.learningModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>{mode.title}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Subsistema
                <select className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm" value={selectedSubsystemId} onChange={(event) => setSelectedSubsystemId(event.target.value)}>
                  {packagedPumpSystem.subsystems.map((subsystem) => (
                    <option key={subsystem.id} value={subsystem.id}>{subsystem.title}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Buscar
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="bomba, riser..."
                  disabled={isGuidedTour}
                  className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Componente
                <select className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm" disabled={visibleComponentIds.length === 0} value={selectedId ?? ''} onChange={(event) => syncSelectionFromAnywhere(event.target.value)}>
                  {visibleComponentIds.map((id) => (
                    <option key={id} value={id}>{firePumpComponents[id].name.es}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                Vista
                <div className="flex rounded-lg border border-slate-200/80 bg-white/80 p-1 shadow-sm">
                  <button type="button" className={`flex-1 rounded-md px-3 py-2 text-sm transition ${!focusMode ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`} disabled={isGuidedTour} onClick={() => setFocusMode(false)}>All</button>
                  <button type="button" className={`flex-1 rounded-md px-3 py-2 text-sm transition ${focusMode ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setFocusMode(true)}>Focus</button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <details className="rounded-lg border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <summary className="cursor-pointer list-none">Normas</summary>
                <div className="mt-3 grid gap-2 pb-1">
                  {standardsReference.map((rule) => (
                    <div key={rule.id} className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2">
                      <p className="text-[11px] font-semibold text-slate-900">{rule.label}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{rule.summary}</p>
                    </div>
                  ))}
                </div>
              </details>
              <span className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500">{packagedPumpSystem.designBasis.brands.join(' · ')}</span>
              <span className="ml-auto rounded-lg border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500">{visibleComponentIds.length} visible</span>
            </div>
          </div>
        </div>

        <div className="relative h-[60vh] min-h-[520px] w-full bg-slate-100 xl:h-[calc(100vh-14rem)] xl:max-h-[760px]">
          <FirePumpSystem3D
            defaultSelectedId={selectedId}
            focusMode={focusMode}
            flowMode={showFlow}
            onSelectionChange={syncSelectionFromAnywhere}
            showHud={false}
            showInfoPanel={false}
          />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/70 bg-white/78 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-xl">
            {isGuidedTour ? 'Guided tour active' : focusMode ? 'Focus mode active' : 'Full system view'}
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-3 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-auto">
        <section className="rounded-2xl border border-white/60 bg-white/65 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Component Card</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{selectedComponent?.name.es}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{selectedComponent?.name.en}</p>
            </div>
            <span className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600">{selectedComponent?.brandReference}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedComponent?.nfpa.map((rule) => (
              <span key={rule} className="rounded-lg bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100">{rule}</span>
            ))}
            <span className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600">{categoryLabels[selectedComponent?.category]}</span>
          </div>

          <div className="mt-3 space-y-2">
            <details open className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">Funcion</summary>
              <p className="mt-2 text-sm leading-5 text-slate-700">{selectedComponent?.function.es}</p>
            </details>
            <details className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">Descripcion</summary>
              <p className="mt-2 text-sm leading-5 text-slate-700">{selectedComponent?.description.es}</p>
            </details>
            <details className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">Especificaciones</summary>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {selectedComponent?.specs.map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-sky-600">•</span><span>{item}</span></li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/65 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Learning Flow</p>
          {isGuidedTour ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{currentTourStep.title}</p>
                <p className="mt-2 text-sm leading-5 text-slate-600">{currentTourStep.summary}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50" disabled={tourStepIndex === 0} onClick={() => setTourStepIndex((index) => Math.max(0, index - 1))}>Prev</button>
                <span className="text-xs font-medium text-slate-500">{tourStepIndex + 1} / {guidedTourSteps.length}</span>
                <button type="button" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50" disabled={tourStepIndex === guidedTourSteps.length - 1} onClick={() => setTourStepIndex((index) => Math.min(guidedTourSteps.length - 1, index + 1))}>Next</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-4 text-sm leading-5 text-slate-600">
              {showFlow ? 'El flujo animado muestra la continuidad del agua hasta la descarga por rociadores.' : 'Activa Circuito hidraulico o Recorrido guiado para estudiar el sistema de forma secuencial.'}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/65 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Subsystem</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">{selectedSubsystem.title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{selectedSubsystem.description}</p>
          <details className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">Visible components</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleComponentIds.map((id) => (
                <button key={id} type="button" className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${selectedId === id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`} onClick={() => syncSelectionFromAnywhere(id)}>
                  {firePumpComponents[id].shortLabel}
                </button>
              ))}
              {visibleComponentIds.length === 0 && <p className="text-sm text-slate-500">No hay resultados para esta busqueda.</p>}
            </div>
          </details>
        </section>
      </aside>
    </div>
  );
}
