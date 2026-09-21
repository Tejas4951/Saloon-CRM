import { BarChart3, Download } from 'lucide-react';
import { AnalyticsTab } from '@/components/AnalyticsTab';
import { DownloadDataTab } from '@/components/DownloadDataTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Reports() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Revenue, appointments, staff performance and downloadable business records.
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-5">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="download" className="gap-2">
            <Download className="h-4 w-4" /> Download
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="download"><DownloadDataTab /></TabsContent>
      </Tabs>
    </div>
  );
}
