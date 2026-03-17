import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { FormType } from '../types/index.types';

type WorkerInfoModalProps = {
  isOpen: boolean;
  workerId: number;
  lifecycleType: FormType;
  onClose: () => void;
};

const WorkerInfoModal = ({
  isOpen,
  workerId,
  lifecycleType,
  onClose,
}: WorkerInfoModalProps) => {
  const formatDate = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('de-DE');
  };

  const {
    data: workerInfo,
    isLoading,
    isError,
  } = useQuery({
    ...workerLifecycleQueries.workerById(workerId, lifecycleType),
    enabled: isOpen,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay handleToggle={onClose}>
      <SmallWrapper className="h-auto min-h-0 max-h-none w-full max-w-md p-5">
        <div className="flex w-full flex-col gap-3 text-left">
          <h2 className="text-sm font-semibold text-foreground">
            Handwerker Informationen
          </h2>

          {isLoading ? <p className="text-xs text-muted-foreground">Lädt...</p> : null}

          {isError ? (
            <p className="text-xs text-(--destructive)">
              Informationen konnten nicht geladen werden.
            </p>
          ) : null}

          {workerInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Vorname</span>
              <span>{workerInfo.worker.vorname}</span>

              <span className="text-muted-foreground">Nachname</span>
              <span>{workerInfo.worker.nachname}</span>

              <span className="text-muted-foreground">E-Mail</span>
              <span>{workerInfo.worker.email ?? '-'}</span>

              <span className="text-muted-foreground">Position</span>
              <span>{workerInfo.worker.position ?? '-'}</span>

              <span className="text-muted-foreground">Adresse</span>
              <span>{workerInfo.worker.adresse ?? '-'}</span>

              <span className="text-muted-foreground">Eintrittsdatum</span>
              <span>{formatDate(workerInfo.worker.eintrittsdatum)}</span>

              <span className="text-muted-foreground">Austrittsdatum</span>
              <span>{formatDate(workerInfo.worker.austrittsdatum)}</span>

              <span className="text-muted-foreground">Geburtsdatum</span>
              <span>{formatDate(workerInfo.worker.geburtsdatum)}</span>

              <span className="text-muted-foreground">Phase</span>
              <span>{workerInfo.form.type}</span>

              <span className="text-muted-foreground">Aufgaben</span>
              <span>{workerInfo.form.fields.length}</span>
            </div>
          ) : null}

          <div className="mt-2 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </SmallWrapper>
    </ModalOverlay>
  );
};

export default WorkerInfoModal;
