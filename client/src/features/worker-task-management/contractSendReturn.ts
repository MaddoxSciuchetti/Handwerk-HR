const STORAGE_KEY = 'handwerk.contractSendReturn';

export type ContractSendReturn = {
  kind: 'contract' | 'arbeitszeugnis';
  returnTo: 'tasks' | 'worker';
  workerId: string;
  engagementId: string;
  issueId: string;
  workerName: string;
  prevPage: string;
};

export function rememberContractSendReturn(value: ContractSendReturn) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function peekContractSendReturn(): ContractSendReturn | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ContractSendReturn>;
    if (
      (parsed.returnTo !== 'tasks' && parsed.returnTo !== 'worker') ||
      !parsed.workerId ||
      !parsed.engagementId ||
      !parsed.issueId
    ) {
      return null;
    }
    return {
      kind: parsed.kind === 'arbeitszeugnis' ? 'arbeitszeugnis' : 'contract',
      returnTo: parsed.returnTo,
      workerId: parsed.workerId,
      engagementId: parsed.engagementId,
      issueId: parsed.issueId,
      workerName: parsed.workerName ?? '',
      prevPage: parsed.prevPage ?? '',
    };
  } catch {
    return null;
  }
}

export function clearContractSendReturn() {
  sessionStorage.removeItem(STORAGE_KEY);
}
