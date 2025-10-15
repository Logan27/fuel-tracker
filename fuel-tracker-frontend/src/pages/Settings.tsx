import { DashboardLayout } from '@/widgets/dashboard/ui/DashboardLayout';
import { SettingsForm } from '@/features/user-settings';
import { ExportDataButton, DeleteAccountDialog } from '@/features/user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { useAuthStore } from '@/app/stores';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">email</p>
                <p className="text-base font-medium">{user?.email || 'Not logged in'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Preferences */}
        <SettingsForm />

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export your data or permanently delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all your data in CSV format. This includes your vehicles and fuel
                entries.
              </p>
              <ExportDataButton />
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
