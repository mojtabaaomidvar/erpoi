import { LayoutDashboard, Users, FileText, UserCheck, ClipboardCheck, Receipt, BarChart3, ShieldCheck, Shield } from"lucide-react";
import { cn } from"@shared/lib/cn";
import { useTheme } from"@app/providers/ThemeProvider";

export type ViewKey ='dashboard'|'clients'|'contracts'|'inspectors'|'inspections'|'billing'|'reports'|'audit';

interface SidebarProps {
  active: ViewKey;
  onSelect: (key: ViewKey) => void;
  isExpanded: boolean;
  expiringContractsCount?: number;
}

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { key:"dashboard", label:"Dashboard", icon: LayoutDashboard },
  { key:"clients", label:"Clients", icon: Users },
  { key:"contracts", label:"Agreements", icon: FileText },
  { key:"inspectors", label:"Inspectors", icon: UserCheck },
  { key:"inspections", label:"Workflow", icon: ClipboardCheck, badge:"3"},
  { key:"billing", label:"Billing", icon: Receipt },
  { key:"reports", label:"Reports", icon: BarChart3 },
  { key:'audit', label:'Audit Log', icon: ShieldCheck },
];

export function Sidebar({ active, onSelect, isExpanded, expiringContractsCount = 0 }: SidebarProps) {
  const { isDark } = useTheme();

  return (
    <aside className={`fixed left-0 top-16 z-40 flex flex-col border-r transition-all duration-300 ${
      isExpanded ?"w-64":"w-20"} ${
      isDark 
        ?"bg-slate-900/95 border-slate-800 shadow-xl shadow-black/30 backdrop-blur-xl":"bg-white/95 border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl"}`} style={{ height:"calc(100vh - 4rem)"}}>
      {/* لوگو */}
      <div className="flex items-center gap-3 px-5 py-5"> 
      </div>

      {/* منو */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
		  // 🔑 تشخیص نمایش بج و نوع آلارم
          const showBadge = item.key ==="contracts"? expiringContractsCount > 0 : !!item.badge;
          const badgeText = item.key ==="contracts"? expiringContractsCount : item.badge;
          const isAlert = item.key ==="contracts"&& expiringContractsCount > 0;
		  
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={!isExpanded ? item.label : undefined}
              className={`group flex w-full items-center rounded-lg transition-all ${
                isExpanded ?"gap-3 px-2.5 py-2 text-sm":"justify-center px-2 py-2.5"} ${
                isActive
                  ?"bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 shadow-md shadow-indigo-500/20": isDark
                    ?"text-slate-400 hover:bg-slate-800/60 hover:text-slate-100":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${
                isActive ?"text-indigo-500": isDark ?"text-slate-500":"text-slate-400"}`} />
              {isExpanded && <span className="flex-1 text-left">{item.label}</span>}
			  
              {/* 🔑 نمایش بج داینامیک + آلارم */}
              {showBadge && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  isAlert 
                    ?"bg-rose-500/20 text-rose-500 ring-rose-500/40 animate-pulse":"bg-rose-500/15 text-rose-500 ring-rose-500/30"}`}>
                  {badgeText}
                </span>
              )}
              
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/80"/>}
            </button>
          );
        })}
      </nav>

      {/* فوتر */}
      <div className={`border-t p-3 ${isDark ?"border-slate-800":"border-slate-200"}`}>
        <div className={`flex items-center rounded-lg p-2 transition-all ${
          isExpanded ?"gap-3":"justify-center"} ${isDark ?"hover:bg-slate-800/60":"hover:bg-slate-100"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/50">
            MO
          </div>
          {isExpanded && (
            <>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-medium ${isDark ?"text-white":"text-slate-900"}`}>Mojtaba Omidvar</div>
                <div className="text-[10px] text-slate-500">Department Manager</div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/80"/>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}




