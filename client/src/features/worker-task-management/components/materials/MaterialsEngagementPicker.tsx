import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const typeLabel: Record<EngagementType, string> = {
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  transfer: 'Versetzung',
};

type MaterialsEngagementPickerProps = {
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  value: string;
  onChange: (engagementId: string) => void;
};

function formatStart(startDate: string | null) {
  if (!startDate) return 'ohne Datum';
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return 'ohne Datum';
  return new Intl.DateTimeFormat('de-DE').format(date);
}

export function MaterialsEngagementPicker({
  engagements,
  value,
  onChange,
}: MaterialsEngagementPickerProps) {
  if (engagements.length < 2) return null;

  return (
    <div className="mb-4 max-w-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label="Engagement">
          <SelectValue placeholder="Engagement" />
        </SelectTrigger>
        <SelectContent>
          {engagements.map((engagement) => (
            <SelectItem key={engagement.id} value={engagement.id}>
              {typeLabel[engagement.type]} · {formatStart(engagement.startDate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
