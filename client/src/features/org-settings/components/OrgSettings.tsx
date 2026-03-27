import { OrgInviteSection } from './OrgInviteSection';

const OrgSettings = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 mt-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Unternehmens Einstellungen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organization settings.
        </p>
      </div>

      <OrgInviteSection />
    </div>
  );
};

export default OrgSettings;
