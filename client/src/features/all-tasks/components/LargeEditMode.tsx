type LargeEditModeProps = {
  editModeData: { taskNumber: string; taskTitle: string }[];
  setLargeEditMode: (value: boolean) => void;
};

export function LargeEditMode({
  editModeData,
  setLargeEditMode,
}: LargeEditModeProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
      <h1 className="typo-body-sm whitespace-nowrap">Large Edit Mode</h1>
    </div>
  );
}
