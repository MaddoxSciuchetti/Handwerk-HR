import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { workerInfos } from '../consts/worker-info.consts';
import useWorkerInfo from '../hooks/useWorkerInfo';
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
  const { isError, isLoading, workerInfo } = useWorkerInfo(
    isOpen,
    workerId,
    lifecycleType
  );

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

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Lädt...</p>
          ) : null}

          {isError ? (
            <p className="text-xs text-(--destructive)">
              Informationen konnten nicht geladen werden.
            </p>
          ) : null}

          {workerInfo ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {workerInfos(workerInfo).map((item) => (
                <>
                  <span
                    key={`${item.label}-label`}
                    className={item.className ?? 'text-muted-foreground'}
                  >
                    {item.label}
                  </span>
                  <span key={`${item.label}-value`}>{item.value ?? '-'}</span>
                </>
              ))}
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
