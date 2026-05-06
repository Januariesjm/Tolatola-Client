const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components/admin/admin-dashboard-content.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add import
if (!content.includes('ActivityLogsTab')) {
    content = content.replace(
        'import { AnalyticsTab } from "./analytics-tab"',
        'import { AnalyticsTab } from "./analytics-tab"\nimport { ActivityLogsTab } from "./activity-logs-tab"'
    );
}

// 2. Conditionally wrap top stats
const gmvCardRegex = /<Card className="shadow-sm rounded-xl border border-primary\/20 bg-white">[\s\S]*?Total GMV[\s\S]*?<\/Card>/;
const gmvMatch = content.match(gmvCardRegex);
if (gmvMatch && !content.includes('adminRole?.permissions.includes("manage_transactions") && (' + gmvMatch[0])) {
    content = content.replace(gmvCardRegex, `{adminRole?.permissions.includes("manage_transactions") && (\n          ${gmvMatch[0]}\n        )}`);
}

const ordersCardRegex = /<Card className="shadow-sm rounded-xl border border-primary\/15 bg-white">[\s\S]*?Active Orders[\s\S]*?<\/Card>/;
const ordersMatch = content.match(ordersCardRegex);
if (ordersMatch && !content.includes('adminRole?.permissions.includes("manage_orders") && (' + ordersMatch[0])) {
    content = content.replace(ordersCardRegex, `{adminRole?.permissions.includes("manage_orders") && (\n          ${ordersMatch[0]}\n        )}`);
}

const kycCardRegex = /<Card className="shadow-sm rounded-xl border border-amber-100 bg-white">[\s\S]*?Pending KYC[\s\S]*?<\/Card>/;
const kycMatch = content.match(kycCardRegex);
if (kycMatch && !content.includes('adminRole?.permissions.includes("manage_kyc") && (' + kycMatch[0])) {
    content = content.replace(kycCardRegex, `{adminRole?.permissions.includes("manage_kyc") && (\n          ${kycMatch[0]}\n        )}`);
}

const ticketsCardRegex = /<Card className="shadow-sm rounded-xl border border-red-100 bg-white">[\s\S]*?Open Tickets[\s\S]*?<\/Card>/;
const ticketsMatch = content.match(ticketsCardRegex);
if (ticketsMatch && !content.includes('adminRole?.permissions.includes("manage_support") && (' + ticketsMatch[0])) {
    content = content.replace(ticketsCardRegex, `{adminRole?.permissions.includes("manage_support") && (\n          ${ticketsMatch[0]}\n        )}`);
}

// 3. Add Activity Logs to sidebar
const sidebarAdminsBtnStr = `
                {showAdminManagement && (
                  <Button
                    variant={activeTab === "admins" ? "default" : "ghost"}
`;
if (content.includes(sidebarAdminsBtnStr) && !content.includes('value="logs"')) {
    const logsSidebarBtn = `
                {adminRole?.permissions.includes("view_logs") && (
                  <Button
                    variant={activeTab === "logs" ? "default" : "ghost"}
                    size="sm"
                    className={\`w-full justify-between rounded-xl \${activeTab === "logs"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }\`}
                    onClick={() => setActiveTab("logs")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="h-4 w-4" />
                      <span>Activity Logs</span>
                    </span>
                  </Button>
                )}
`;
    content = content.replace(sidebarAdminsBtnStr, logsSidebarBtn + sidebarAdminsBtnStr);
}

// 4. Add Activity Logs to TabsList (mobile)
const tabsListAdminsStr = `
                  {showAdminManagement && (
                    <TabsTrigger value="admins"
`;
if (content.includes(tabsListAdminsStr) && !content.includes('<TabsTrigger value="logs"')) {
    const logsTabTrigger = `
                  {adminRole?.permissions.includes("view_logs") && (
                    <TabsTrigger value="logs" className="px-5 rounded-full text-xs font-semibold">
                      Activity Logs
                    </TabsTrigger>
                  )}
`;
    content = content.replace(tabsListAdminsStr, logsTabTrigger + tabsListAdminsStr);
}

// 5. Add TabsContent
const tabsContentAdminsStr = `
              {showAdminManagement && (
                <TabsContent value="admins" className="border-none p-0 outline-none">
`;
if (content.includes(tabsContentAdminsStr) && !content.includes('<TabsContent value="logs"')) {
    const logsTabsContent = `
              {adminRole?.permissions.includes("view_logs") && (
                <TabsContent value="logs" className="border-none p-0 outline-none">
                  <ActivityLogsTab />
                </TabsContent>
              )}
`;
    content = content.replace(tabsContentAdminsStr, logsTabsContent + tabsContentAdminsStr);
}

// 6. Fix default tab logic
const initialTabLogic = `const initialTab = adminRole?.permissions.includes("view_analytics") ? "analytics" : "hr"`;
const newInitialTabLogic = `
  const getInitialTab = () => {
    if (!adminRole?.permissions) return "analytics"
    const p = adminRole.permissions
    if (p.includes("view_analytics")) return "analytics"
    if (p.includes("manage_support")) return "support"
    if (p.includes("manage_hr")) return "hr"
    if (p.includes("manage_system")) return "admins"
    return "analytics"
  }
  const initialTab = getInitialTab()
`;
if (content.includes(initialTabLogic)) {
    content = content.replace(initialTabLogic, newInitialTabLogic);
}

fs.writeFileSync(targetFile, content);
console.log('Successfully patched admin-dashboard-content.tsx');
