import React, { useState } from 'react';
import { Plus, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { AdminCreateSupplierModal } from './AdminCreateSupplierModal';
import { ResumenPanel } from './dashboard/ResumenPanel';
import { ExpedientesTable, ExpedienteFilters, EMPTY_FILTERS } from './dashboard/ExpedientesTable';
import { HeroTabs, PageBody, PageHeader, heroPrimaryBtn } from './ui/archive';

type Tab = 'RESUMEN' | 'EXPEDIENTES';

const todayLabel = () =>
  new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const InternalReviewView: React.FC = () => {
  const { dossiers, allDossiers, role, reviewSelectedDossierId, setReviewSelectedDossierId, openSupplierReview } = useApp();

  const [tab, setTab] = useState<Tab>('RESUMEN');
  // Los revisores ven su cartera por defecto y pueden mirar todos los expedientes
  const [scope, setScope] = useState<'CARTERA' | 'GLOBAL'>('CARTERA');
  const [filters, setFilters] = useState<ExpedienteFilters>(EMPTY_FILTERS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (reviewSelectedDossierId) {
    return <InternalReviewDossierDetail dossierId={reviewSelectedDossierId} onBack={() => setReviewSelectedDossierId(null)} />;
  }

  const dataset = role === 'ADMIN' || scope === 'GLOBAL' ? allDossiers : dossiers;

  const showStage = (stageKey: string) => {
    setFilters({ ...EMPTY_FILTERS, stage: stageKey });
    setTab('EXPEDIENTES');
  };

  const tabsNode = (
    <div className="flex flex-wrap items-center gap-3">
            <HeroTabs
              items={[
                { key: 'RESUMEN', label: 'Resumen' },
                { key: 'EXPEDIENTES', label: 'Expedientes', count: dataset.length },
              ]}
              value={tab}
              onChange={(k) => setTab(k as Tab)}
            />
            {role === 'REVISOR' && (
              <HeroTabs
                items={[
                  { key: 'CARTERA', label: 'Mi cartera' },
                  { key: 'GLOBAL', label: 'Todos' },
                ]}
                value={scope}
                onChange={(k) => setScope(k as 'CARTERA' | 'GLOBAL')}
              />
            )}
          </div>
  );

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1">
      {tab === 'RESUMEN' ? (
        <ResumenPanel
          dossiers={dataset}
          onFilterStage={showStage}
          onRegister={() => setIsCreateOpen(true)}
          scopeLabel={role === 'ADMIN' || scope === 'GLOBAL' ? 'Todos los expedientes' : 'Su cartera asignada'}
          dateLabel={todayLabel()}
          tabs={tabsNode}
        />
      ) : (
        <>
          <PageHeader
            icon={Home}
            title="Expedientes"
            subtitle={
              role === 'ADMIN' || scope === 'GLOBAL'
                ? `Todos los expedientes · ${todayLabel()}`
                : `Su cartera asignada · ${todayLabel()}`
            }
            actions={
              <button type="button" className={heroPrimaryBtn} onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Registrar proveedor
              </button>
            }
            tabs={tabsNode}
          />
          <PageBody>
            <ExpedientesTable dossiers={dataset} filters={filters} onChange={setFilters} />
          </PageBody>
        </>
      )}

      <AdminCreateSupplierModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(dossierId) => {
          setIsCreateOpen(false);
          openSupplierReview(dossierId);
        }}
      />
    </div>
  );
};
