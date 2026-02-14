'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    $3Dmol?: {
      createViewer: (element: HTMLElement, options: Record<string, unknown>) => {
        addModel: (data: string, type: string) => void;
        setStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
        zoomTo: () => void;
        render: () => void;
        spin: (enabled: boolean) => void;
      };
    };
  }
}

const SCRIPT_ID = '3dmol-cdn-script';

function load3DmolScript(): Promise<void> {
  if (window.$3Dmol) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load 3Dmol.js')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://3dmol.csb.pitt.edu/build/3Dmol-min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
    document.body.appendChild(script);
  });
}

export default function SpikeProteinViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await load3DmolScript();
        if (!window.$3Dmol || disposed) return;
        if (!containerRef.current) throw new Error('3D container not ready');

        const pdbText = await fetch('/covid_spike.pdb').then((r) => {
          if (!r.ok) throw new Error('Could not load PDB file');
          return r.text();
        });

        if (disposed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        const viewer = window.$3Dmol.createViewer(containerRef.current, { backgroundColor: 'white' });
        viewer.addModel(pdbText, 'pdb');
        viewer.setStyle({}, { cartoon: { color: '#16a34a', opacity: 1.0 } });
        viewer.zoomTo();
        viewer.render();
        viewer.spin(true);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to render protein structure');
        setLoading(false);
      }
    };

    init();
    return () => {
      disposed = true;
    };
  }, []);

  return (
    <div className="medical-card p-6">
      <h3 className="medical-card-title text-lg font-semibold mb-4">COVID Spike Protein (3D)</h3>
      <div className="relative h-80 rounded border border-slate-200 overflow-hidden bg-white">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 bg-slate-100/90 animate-pulse" />
        )}
        {!loading && error && (
          <div className="absolute inset-0 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-600">
        Rotating 3D structure of the SARS-CoV-2 spike protein.
      </p>
    </div>
  );
}
