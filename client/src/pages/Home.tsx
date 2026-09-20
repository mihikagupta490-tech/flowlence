import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Filter,
  GraduationCap,
  HeartPulse,
  Home as HomeIcon,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  ListFilter,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  Receipt,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


type Icon = ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
type TxKind = "income" | "expense";
type Range = "7D" | "30D" | "3M" | "6M";

type Transaction = {
  id: string | number;
  title: string;
  category: string;
  date: string;
  dateKey?: string;
  isDemo?: boolean;
  amount: number;
  kind: TxKind;
  source?: string;
};

type Goal = {
  id: string | number;
  title: string;
  current: number;
  target: number;
  deadline: string;
  color: string;
};

type Insight = {
  id: number;
  type: "Opportunity" | "Attention" | "Recommendation";
  title: string;
  body: string;
  metric: string;
  action: string;
};

const COLORS = ["#6674f7", "#a7b3ff", "#cce57a", "#efb66a", "#e58e8e", "#8b91a1"];
const remainingDaysInMonth = () => {
  const now = new Date();
  return Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);
};

const initialTransactions: Transaction[] = [
  { id: 1, title: "Freelance payment", category: "Freelance", date: "Today", amount: 4500, kind: "income", source: "Income" },
  { id: 2, title: "Groceries", category: "Food", date: "Today", amount: 350, kind: "expense" },
  { id: 3, title: "Auto ride", category: "Travel", date: "Yesterday", amount: 120, kind: "expense" },
  { id: 4, title: "Delivery work", category: "Gig work", date: "18 Sep", amount: 2000, kind: "income", source: "Income" },
  { id: 5, title: "Project milestone", category: "Freelance", date: "15 Sep", amount: 12000, kind: "income", source: "Income" },
  { id: 6, title: "Monthly rent", category: "Housing", date: "12 Sep", amount: 6500, kind: "expense" },
  { id: 7, title: "Electricity bill", category: "Bills", date: "10 Sep", amount: 1780, kind: "expense" },
  { id: 8, title: "Pharmacy", category: "Healthcare", date: "09 Sep", amount: 700, kind: "expense" },
  { id: 9, title: "Lunch & coffee", category: "Food", date: "05 Sep", amount: 800, kind: "expense" },
];

const initialGoals: Goal[] = [
  { id: 1, title: "Emergency fund", current: 6400, target: 10000, deadline: "31 Dec 2024", color: "#6674f7" },
  { id: 2, title: "New laptop", current: 25000, target: 60000, deadline: "15 Feb 2025", color: "#cce57a" },
  { id: 3, title: "Weekend in Goa", current: 8000, target: 20000, deadline: "30 Nov 2024", color: "#efb66a" },
];

const initialInsights: Insight[] = [
  { id: 1, type: "Opportunity", title: "Income is having a strong month", body: "Your income is above its recent average. This is a good window to strengthen your buffer before your next quiet period.", metric: "+24% vs average", action: "Move ₹1,500 to buffer" },
  { id: 2, type: "Attention", title: "Discretionary spend is trending up", body: "Travel and shopping are taking a slightly bigger share of your outgoings than last month.", metric: "+22% this month", action: "Review spending" },
  { id: 3, type: "Recommendation", title: "You are close to your buffer target", body: "A small, consistent contribution after each income payment can get you to your recommended buffer sooner.", metric: "₹3,600 to go", action: "Build buffer" },
];

const trendSeed = [
  { month: "Apr", income: 14200, expenses: 8200 },
  { month: "May", income: 18800, expenses: 10400 },
  { month: "Jun", income: 11600, expenses: 9100 },
  { month: "Jul", income: 20500, expenses: 11200 },
  { month: "Aug", income: 15500, expenses: 9700 },
  { month: "Sep", income: 18500, expenses: 10250 },
];

const categoryIcon: Record<string, Icon> = {
  Food: Utensils,
  Travel: CarFront,
  Bills: Receipt,
  Healthcare: HeartPulse,
  Shopping: ShoppingBag,
  Housing: HomeIcon,
  Education: GraduationCap,
  Freelance: BriefcaseBusiness,
  "Gig work": Banknote,
};

const navItems: { label: string; route: string; icon: Icon }[] = [
  { label: "Overview", route: "/overview", icon: LayoutDashboard },
  { label: "Transactions", route: "/transactions", icon: ReceiptText },
  { label: "Analytics", route: "/analytics", icon: ChartNoAxesCombined },
  { label: "Insights", route: "/insights", icon: Sparkles },
  { label: "Goals", route: "/goals", icon: Target },
];

const formatMoney = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const signedMoney = (tx: Transaction) => `${tx.kind === "income" ? "+" : "−"}${formatMoney(tx.amount)}`;
const percent = (current: number, target: number) => Math.min(100, Math.round((current / target) * 100));
const isoToday = () => new Date().toISOString().slice(0, 10);
const displayDate = (date: string) => {
  if (!date) return "Today";
  const today = isoToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const mapIncomeRow = (row: { id: string; amount: number; source: string; category: string; date: string; notes?: string | null }): Transaction => ({ id: row.id, title: row.notes || row.source, category: row.category, date: displayDate(row.date), dateKey: row.date, amount: Number(row.amount), kind: "income", source: row.source });
const mapExpenseRow = (row: { id: string; amount: number; category: string; date: string; description?: string | null }): Transaction => ({ id: row.id, title: row.description || row.category, category: row.category, date: displayDate(row.date), dateKey: row.date, amount: Number(row.amount), kind: "expense" });
const buildMonthlyTrend = (transactions: Transaction[]) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { date, month: date.toLocaleDateString("en-IN", { month: "short" }), income: 0, expenses: 0 };
  });
  transactions.forEach(tx => {
    const date = tx.dateKey ? new Date(`${tx.dateKey}T12:00:00`) : now;
    const item = months.find(month => month.date.getFullYear() === date.getFullYear() && month.date.getMonth() === date.getMonth());
    if (item) item[tx.kind === "income" ? "income" : "expenses"] += tx.amount;
  });
  return months.map(({ month, income, expenses }) => ({ month, income, expenses }));
};
const buildInsights = (transactions: Transaction[]): Insight[] => {
  if (!transactions.length) return [];
  const income = transactions.filter(tx => tx.kind === "income");
  const expenses = transactions.filter(tx => tx.kind === "expense");
  const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, tx) => ({ ...totals, [tx.category]: (totals[tx.category] || 0) + tx.amount }), {});
  const largestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const averageIncome = income.length ? totalIncome / income.length : 0;
  const variance = income.length > 1 ? income.reduce((sum, tx) => sum + Math.pow(tx.amount - averageIncome, 2), 0) / income.length : 0;
  const variation = averageIncome ? Math.sqrt(variance) / averageIncome : 0;
  const insights: Insight[] = [];
  if (variation > 0.45) insights.push({ id: 1, type: "Attention", title: "Your income fluctuated significantly", body: "Your recorded income amounts vary meaningfully. A larger buffer can help smooth out quieter periods.", metric: `${Math.round(variation * 100)}% variation`, action: "Review income pattern" });
  else insights.push({ id: 1, type: "Opportunity", title: "Your income is showing a steadier pattern", body: "Your recent recorded income is relatively consistent. This can make your next buffer contribution easier to plan.", metric: `${Math.round((1 - variation) * 100)}% consistency`, action: "Build buffer" });
  if (largestCategory) insights.push({ id: 2, type: "Recommendation", title: `Your largest expense category is ${largestCategory[0]}`, body: "Knowing where the biggest share of your money goes makes the next spending decision easier to see.", metric: formatMoney(largestCategory[1]), action: "Review spending" });
  if (totalExpenses > totalIncome * 0.6) insights.push({ id: 3, type: "Attention", title: "Expenses are taking a bigger share", body: "Your recorded expenses are above 60% of your recorded income in this view. Check the categories before adding another commitment.", metric: `${Math.round((totalExpenses / Math.max(totalIncome, 1)) * 100)}% of income`, action: "Review expenses" });
  else insights.push({ id: 3, type: "Opportunity", title: "Your balance covers recorded expenses", body: "Based on the transactions you have entered, your recorded balance currently covers your recorded outgoings.", metric: formatMoney(Math.max(0, totalIncome - totalExpenses)), action: "Plan your next goal" });
  return insights;
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${dark ? "text-white" : "text-[#1b2740]"}`}>
      <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#6674f7] text-white shadow-[0_7px_18px_rgba(102,116,247,.3)]">
        <span className="text-[15px] font-extrabold tracking-[-.08em]">fl</span>
      </div>
      <span className="text-[16px] font-extrabold tracking-[.11em]">FLOWLENCE</span>
    </div>
  );
}

function Button({ children, variant = "primary", className = "", onClick, type = "button", disabled = false }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "dark" | "lime"; className?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  const styles = {
    primary: "bg-[#6674f7] text-white shadow-[0_8px_20px_rgba(102,116,247,.23)] hover:bg-[#5866ed]",
    secondary: "border border-[#d9dde9] bg-white text-[#25314a] hover:border-[#aab2c7] hover:bg-[#fbfbfd]",
    ghost: "text-[#68728b] hover:bg-[#eef0f7] hover:text-[#26334e]",
    dark: "bg-[#1c2944] text-white shadow-[0_8px_20px_rgba(28,41,68,.2)] hover:bg-[#253657]",
    lime: "bg-[#cce57a] text-[#22304b] shadow-[0_8px_20px_rgba(204,229,122,.24)] hover:bg-[#d8ee91]",
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-[13px] font-bold transition duration-200 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6674f7] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}>{children}</button>;
}

function LandingPage({ go }: { go: (path: string) => void }) {
  const previewData = [
    { day: "Mon", value: 38 }, { day: "Tue", value: 56 }, { day: "Wed", value: 48 }, { day: "Thu", value: 72 }, { day: "Fri", value: 68 }, { day: "Sat", value: 86 }, { day: "Sun", value: 78 },
  ];
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f3] text-[#1c2944]">
      <header className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#68728b] md:flex">
          <a href="#problem" className="transition hover:text-[#1c2944]">Why Flowlence</a>
          <a href="#how" className="transition hover:text-[#1c2944]">How it works</a>
          <a href="#features" className="transition hover:text-[#1c2944]">Features</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => go("/login")}>Log in</Button>
          <Button variant="dark" onClick={() => go("/signup")}>Get started <ArrowRight size={15} /></Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-24 pt-12 lg:grid-cols-[.94fr_1.06fr] lg:px-8 lg:pb-32 lg:pt-20">
          <div className="relative z-10 max-w-[590px]">
            <div className="eyebrow mb-7"><span className="h-1.5 w-1.5 rounded-full bg-[#cce57a]" />BUILT FOR THE WAY YOU EARN</div>
            <h1 className="max-w-[610px] font-display text-[55px] leading-[.99] tracking-[-.055em] text-[#1c2944] sm:text-[72px]">Your income changes.<br /><em className="text-[#6674f7]">Your plan should too.</em></h1>
            <p className="mt-7 max-w-[520px] text-[17px] leading-8 text-[#68728b]">Take control of unpredictable income with adaptive budgeting, spending insights and financial planning designed for the way you actually earn.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button variant="dark" className="h-12 px-5" onClick={() => go("/signup")}>See your money clearly <ArrowRight size={16} /></Button>
              <Button variant="secondary" className="h-12" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}><span className="grid h-5 w-5 place-items-center rounded-full bg-[#eef0f7] text-[10px]">▶</span> See how it works</Button>
            </div>
            <div className="mt-10 flex items-center gap-5 text-[12px] font-semibold text-[#68728b]"><div className="flex -space-x-2"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f7f3] bg-[#d9a27f] text-[10px] text-white">AR</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f7f3] bg-[#7d8abf] text-[10px] text-white">SK</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f7f3] bg-[#6674f7] text-[10px] text-white">PM</span></div><span>Made for modern earners</span><span className="h-1 w-1 rounded-full bg-[#c2c7d4]" /><span className="flex items-center gap-1"><ShieldCheck size={14} className="text-[#6674f7]" /> Private by design</span></div>
          </div>

          <div className="relative min-h-[500px] lg:min-h-[570px]">
            <div className="absolute -right-24 top-0 h-[390px] w-[390px] rounded-full bg-[#dfe3ff] blur-3xl opacity-70" />
            <div className="dashboard-preview absolute left-1/2 top-7 w-[calc(100%-10px)] max-w-[610px] -translate-x-1/2 rotate-[2.5deg] rounded-[24px] bg-[#1d2a47] p-3 shadow-[0_35px_90px_rgba(38,52,83,.27)] sm:top-3 lg:left-7 lg:w-[620px] lg:max-w-none lg:translate-x-0">
              <div className="rounded-[18px] bg-[#f8f8f5] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-[#6674f7] text-white text-[10px] font-bold">fl</div><span className="text-[11px] font-extrabold tracking-[.12em] text-[#1c2944]">FLOWLENCE</span></div><div className="flex gap-2"><span className="h-6 w-6 rounded-full bg-[#eceff8]" /><span className="h-6 w-6 rounded-full bg-[#c9d1e8]" /></div></div>
                <div className="grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
                  <div className="rounded-[16px] bg-[#202e4b] p-5 text-white"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-white/60">AVAILABLE BALANCE</span><span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold text-[#cce57a]">+8.4%</span></div><div className="mt-5 text-3xl font-semibold tracking-[-.05em]">₹24,850</div><div className="mt-4 flex gap-4 text-[9px] text-white/55"><span><b className="text-[#cce57a]">+₹18,500</b><br />income</span><span><b className="text-white">−₹10,250</b><br />expenses</span></div></div>
                  <div className="rounded-[16px] border border-[#e4e6ef] bg-white p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[#77819a]">SAFE TO SPEND</span><span className="grid h-6 w-6 place-items-center rounded-full bg-[#f0f4df] text-[#6b8520]"><Check size={12} /></span></div><div className="mt-5 text-2xl font-semibold tracking-[-.05em] text-[#1c2944]">₹420<span className="text-xs font-medium text-[#8991a5]"> / day</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf0f5]"><div className="h-full w-[72%] rounded-full bg-[#cce57a]" /></div><div className="mt-3 text-[9px] text-[#7c879f]">Within your recommended range</div></div>
                </div>
                <div className="mt-3 rounded-[16px] border border-[#e4e6ef] bg-white p-5"><div className="flex items-center justify-between"><div><span className="text-[10px] font-semibold text-[#77819a]">INCOME VS EXPENSES</span><div className="mt-1 text-[15px] font-bold text-[#1c2944]">Your money over time</div></div><span className="rounded-lg bg-[#f1f3f8] px-2 py-1 text-[9px] font-bold text-[#6674f7]">30D⌄</span></div><div className="mt-5 h-[145px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={previewData}><defs><linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6674f7" stopOpacity={0.28} /><stop offset="100%" stopColor="#6674f7" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#9aa1b2" }} /><YAxis hide /><Area type="monotone" dataKey="value" stroke="#6674f7" strokeWidth={3} fill="url(#previewFill)" /></AreaChart></ResponsiveContainer></div></div>
              </div>
            </div>
            <div className="absolute -bottom-2 left-3 hidden w-[205px] rounded-[18px] border border-white/80 bg-white/85 p-4 shadow-[0_18px_45px_rgba(63,78,113,.15)] backdrop-blur-md sm:block lg:left-0"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#eff5db] text-[#637d18]"><TrendingUp size={15} /></div><span className="text-[10px] font-bold text-[#6d7790]">INCOME STABILITY</span></div><div className="mt-3 flex items-end justify-between"><span className="text-2xl font-semibold tracking-[-.06em] text-[#1c2944]">78<span className="text-xs text-[#8d95a7">/100</span></span><span className="text-[10px] font-semibold text-[#718493]">Moderately stable</span></div></div>
            <div className="absolute -right-2 bottom-14 hidden h-[80px] w-[145px] rotate-[5deg] rounded-[18px] bg-[#cce57a] p-4 shadow-[0_18px_40px_rgba(118,137,50,.2)] sm:block"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#43551b]">Small steps</div><div className="mt-2 text-[12px] font-semibold leading-4 text-[#283518]">build a steadier<br />financial life.</div></div>
          </div>
        </section>

        <section id="problem" className="bg-[#1c2944] px-5 py-24 text-white lg:px-8 lg:py-28"><div className="mx-auto max-w-[1120px]"><div className="max-w-[650px]"><div className="eyebrow eyebrow-dark mb-6"><span className="h-1.5 w-1.5 rounded-full bg-[#cce57a]" />THE OLD WAY DOESN'T FIT</div><h2 className="font-display text-4xl leading-[1.05] tracking-[-.045em] sm:text-6xl">Traditional budgeting wasn't built for <em className="text-[#cce57a]">irregular income.</em></h2></div><div className="mt-14 grid gap-4 md:grid-cols-3">{[["01", "Unpredictable income", "Your earnings can change dramatically from one week to another."], ["02", "Uncertain spending", "Fixed monthly budgets don't reflect real-life financial fluctuations."], ["03", "Difficult planning", "Saving and emergency planning gets harder when income isn't predictable."]].map(([num, title, body]) => <div key={num} className="group rounded-[22px] border border-white/10 bg-white/[.045] p-6 transition hover:-translate-y-1 hover:bg-white/[.08]"><div className="flex items-center justify-between"><span className="text-[12px] font-bold text-[#cce57a]">{num}</span><ArrowUpRight size={17} className="text-white/30 transition group-hover:text-[#cce57a]" /></div><h3 className="mt-14 text-[18px] font-bold">{title}</h3><p className="mt-3 text-[14px] leading-6 text-white/55">{body}</p></div>)}</div></div></section>

        <section id="features" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32"><div className="grid items-end gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><div className="eyebrow mb-6"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />A BETTER WAY FORWARD</div><h2 className="font-display text-4xl leading-[1.05] tracking-[-.045em] sm:text-6xl">A plan that moves<br /><em className="text-[#6674f7]">with you.</em></h2></div><p className="max-w-[420px] justify-self-end text-[16px] leading-7 text-[#707991]">Flowlence turns the messiness of irregular income into a clearer, calmer financial picture.</p></div><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ icon: WalletCards, title: "Safe to spend", body: "Know what you can comfortably spend today." }, { icon: TrendingUp, title: "Income stability", body: "Understand how predictable your income really is." }, { icon: Lightbulb, title: "Smart insights", body: "Get useful observations from your real behavior." }, { icon: ShieldCheck, title: "Emergency buffer", body: "Build a cushion around your income fluctuations." }].map(({ icon: IconComp, title, body }, i) => <div key={title as string} className={`rounded-[21px] p-5 ${i === 0 ? "bg-[#eef0ff]" : "border border-[#e6e8ee] bg-white"}`}><div className={`grid h-10 w-10 place-items-center rounded-[12px] ${i === 0 ? "bg-[#6674f7] text-white" : "bg-[#f1f3f8] text-[#6674f7]"}`}><IconComp size={18} /></div><h3 className="mt-8 text-[16px] font-bold text-[#1c2944]">{title as string}</h3><p className="mt-2 text-[13px] leading-5 text-[#7b8499]">{body as string}</p></div>)}</div></section>

        <section id="how" className="border-y border-[#e4e6ec] bg-[#fbfbf8] px-5 py-24 lg:px-8 lg:py-28"><div className="mx-auto max-w-[1120px]"><div className="eyebrow mb-6"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />HOW IT WORKS</div><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><h2 className="font-display text-4xl leading-[1.05] tracking-[-.045em] sm:text-6xl">Less guesswork.<br /><em className="text-[#6674f7]">More momentum.</em></h2><div className="grid gap-7 sm:grid-cols-3">{[["01", "Track", "Add your income and expenses as life happens."], ["02", "Understand", "Flowlence reads the patterns behind your numbers."], ["03", "Plan", "Get practical guidance for the next decision."]].map(([num, title, body]) => <div key={num} className="border-t-2 border-[#dfe2eb] pt-5"><div className="text-[12px] font-extrabold text-[#6674f7]">{num}</div><h3 className="mt-8 text-[18px] font-bold text-[#1c2944]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#7b8499]">{body}</p></div>)}</div></div><div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-[23px] bg-[#cce57a] p-7 sm:flex-row sm:items-center sm:p-9"><div><h3 className="text-2xl font-bold tracking-[-.04em] text-[#263518]">Ready to make your money feel clearer?</h3><p className="mt-2 text-[14px] text-[#52632b]">Start with the picture you have today. Adjust as you go.</p></div><Button variant="dark" onClick={() => go("/signup")}>Start planning <ArrowRight size={15} /></Button></div></div></section>
      </main>
      <footer className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-8 text-[12px] font-semibold text-[#7d8698] sm:flex-row sm:items-center sm:justify-between lg:px-8"><Logo /><div className="flex flex-wrap gap-5"><a href="#features">Features</a><a href="#how">About</a><a href="#">Privacy</a><a href="#">Terms</a></div><span>© 2024 Flowlence</span></footer>
    </div>
  );
}

function AuthPage({ mode, go }: { mode: "login" | "signup"; go: (path: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setLoading(false);
    if (result.error) {
      setError(result.error.message.replace("Invalid login credentials", "Email or password is incorrect."));
      return;
    }
    if (!isLogin && !result.data.session) {
      toast.success("Account created. Check your email to confirm your address.");
      go("/login");
      return;
    }
    toast.success(isLogin ? "Welcome back to Flowlence." : "Your Flowlence workspace is ready.");
    go("/overview");
  };

  return <div className="min-h-screen bg-[#1c2944] text-white"><div className="mx-auto grid min-h-screen max-w-[1240px] lg:grid-cols-[.85fr_1.15fr]"><div className="hidden flex-col justify-between p-10 lg:flex"><div><button onClick={() => go("/")}><Logo dark /></button><div className="mt-28 max-w-[420px]"><div className="eyebrow eyebrow-dark mb-6"><span className="h-1.5 w-1.5 rounded-full bg-[#cce57a]" />YOUR MONEY, IN CONTEXT</div><h1 className="font-display text-6xl leading-[1.02] tracking-[-.05em]">A calmer way<br />to make <em className="text-[#cce57a]">money moves.</em></h1><p className="mt-7 max-w-[380px] text-[15px] leading-7 text-white/55">Flowlence gives your fluctuating income a little more structure — without asking it to behave like a salary.</p></div></div><div className="flex items-center gap-2 text-[12px] text-white/45"><LockKeyhole size={14} /> Your data stays yours.</div></div><div className="flex items-center justify-center bg-[#f7f7f3] px-5 py-10 text-[#1c2944] sm:px-10"><div className="w-full max-w-[430px]"><div className="mb-10 lg:hidden"><button onClick={() => go("/")}><Logo /></button></div><div className="mb-8"><div className="eyebrow mb-5"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />{isLogin ? "WELCOME BACK" : "START YOUR FLOW"}</div><h2 className="font-display text-5xl tracking-[-.055em]">{isLogin ? "Good to see you." : "Make room for better decisions."}</h2><p className="mt-3 text-[14px] text-[#778198]">{isLogin ? "Sign in to continue where you left off." : "Create a free workspace for your irregular income."}</p></div><form onSubmit={submit} className="space-y-4">{!isLogin && <label className="field-label">Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} className="field-input" placeholder="Aarav Mehta" /></label>}<label className="field-label">Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field-input" placeholder="you@example.com" /></label><label className="field-label">Password<div className="relative"><input type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="field-input pr-12" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b94a8]">{showPassword ? <EyeIcon /> : <EyeOffIcon />}</button></div></label>{!isLogin && <label className="field-label">Confirm password<input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="field-input" placeholder="••••••••" /></label>}{isLogin && <div className="flex items-center justify-between text-[12px]"><label className="flex items-center gap-2 text-[#778198]"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[#6674f7]" /> Remember me</label><button type="button" onClick={() => toast("Password recovery will be enabled from your Supabase email settings.")} className="font-bold text-[#6674f7]">Forgot password?</button></div>}{error && <div role="alert" className="rounded-xl border border-[#f0caca] bg-[#fff0f0] px-3.5 py-3 text-[12px] font-semibold leading-5 text-[#a96161]">{error}</div>}<Button type="submit" variant="dark" className="mt-3 w-full" disabled={loading}>{loading ? "Connecting securely…" : isLogin ? "Sign in to Flowlence" : "Create my workspace"}{!loading && <ArrowRight size={15} />}</Button></form><div className="my-7 flex items-center gap-3 text-[11px] font-semibold text-[#a0a7b6]"><span className="h-px flex-1 bg-[#e2e4e9]" />EMAIL & PASSWORD<span className="h-px flex-1 bg-[#e2e4e9]" /></div><p className="text-center text-[11px] leading-5 text-[#9aa2b2]">Your account and financial data are protected by Supabase Auth and per-user database policies.</p><p className="mt-8 text-center text-[13px] text-[#778198]">{isLogin ? "New to Flowlence?" : "Already have an account?"} <button className="font-bold text-[#6674f7]" onClick={() => go(isLogin ? "/signup" : "/login")}>{isLogin ? "Create an account" : "Sign in"}</button></p></div></div></div></div>;
}

function EyeIcon() { return <span className="text-xs">◉</span>; }
function EyeOffIcon() { return <span className="text-xs">○</span>; }

function Sidebar({ location, go, onClose, onLogout, userName = "Your workspace", userInitials = "FL" }: { location: string; go: (path: string) => void; onClose?: () => void; onLogout?: () => void; userName?: string; userInitials?: string }) {
  return <aside className="flex h-full w-[250px] flex-col bg-[#1c2944] px-4 py-5 text-white"><div className="flex items-center justify-between px-2"><button onClick={() => go("/")}><Logo dark /></button>{onClose && <button onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"><X size={18} /></button>}</div><div className="mt-10 px-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-white/30">Workspace</div><nav className="mt-3 space-y-1">{navItems.map(item => { const ActiveIcon = item.icon; const active = location === item.route; return <button key={item.route} onClick={() => { go(item.route); onClose?.(); }} className={`group flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[13px] font-semibold transition ${active ? "bg-white/[.1] text-white" : "text-white/50 hover:bg-white/[.06] hover:text-white"}`}><ActiveIcon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-[#cce57a]" : "text-white/45 group-hover:text-white"} />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#cce57a]" />}</button>; })}</nav><div className="mt-auto space-y-1"><button onClick={() => { go("/settings"); onClose?.(); }} className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[13px] font-semibold transition ${location === "/settings" ? "bg-white/[.1] text-white" : "text-white/50 hover:bg-white/[.06] hover:text-white"}`}><Settings size={17} />Settings</button><button onClick={() => { onLogout?.(); onClose?.(); }} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[13px] font-semibold text-white/50 transition hover:bg-white/[.06] hover:text-white"><LogOut size={17} />Log out</button><div className="mt-4 flex items-center gap-3 rounded-[15px] border border-white/10 bg-white/[.05] p-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#d6a078] text-[10px] font-bold text-white">{userInitials}</div><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold">{userName}</div><div className="truncate text-[10px] text-white/40">Personal workspace</div></div><button onClick={() => { toast("Profile menu is ready for your account connection."); }} className="text-white/40 hover:text-white"><MoreHorizontal size={16} /></button></div></div></aside>;
}

function AppShell({ location, go, children, onAdd, onLogout, userName, userInitials }: { location: string; go: (path: string) => void; children: React.ReactNode; onAdd: () => void; onLogout?: () => void; userName?: string; userInitials?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="min-h-screen bg-[#f7f7f3] text-[#1c2944]"><div className="fixed inset-y-0 left-0 z-50 hidden lg:block"><Sidebar location={location} go={go} onLogout={onLogout} userName={userName} userInitials={userInitials} /></div>{sidebarOpen && <><div className="fixed inset-0 z-40 bg-[#16223a]/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} /><div className="fixed inset-y-0 left-0 z-50 lg:hidden"><Sidebar location={location} go={go} onClose={() => setSidebarOpen(false)} onLogout={onLogout} userName={userName} userInitials={userInitials} /></div></>}<div className="lg:pl-[250px]"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8e9ed]/80 bg-[#f7f7f3]/90 px-5 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button className="rounded-xl p-2 text-[#66728b] hover:bg-[#e9ebf2] lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="relative hidden w-[260px] sm:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da5b4]" /><input className="h-10 w-full rounded-xl border border-transparent bg-[#eef0f5] pl-10 pr-3 text-[12px] font-semibold text-[#1c2944] outline-none placeholder:text-[#9da5b4] focus:border-[#c7ccff]" placeholder="Search anything" onKeyDown={(e) => { if (e.key === "Enter") toast("Search is ready once your workspace is connected."); }} /></div><div className="sm:hidden"><Logo /></div></div><div className="flex items-center gap-2 sm:gap-3"><button onClick={() => toast("You're all caught up.")} className="relative grid h-10 w-10 place-items-center rounded-xl text-[#66728b] transition hover:bg-[#e9ebf2]"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#6674f7]" /></button><Button variant="dark" className="!hidden h-10 px-3.5 sm:!inline-flex" onClick={onAdd}><Plus size={15} /> Add transaction</Button><button className="grid h-9 w-9 place-items-center rounded-full bg-[#d6a078] text-[10px] font-bold text-white sm:hidden">{userInitials}</button><div className="hidden h-8 w-px bg-[#e0e3e9] sm:block" /><div className="hidden items-center gap-2 sm:flex"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#d6a078] text-[10px] font-bold text-white">{userInitials}</div><ChevronDown size={14} className="text-[#8d95a6]" /></div></div></header><main className="mx-auto max-w-[1440px] px-5 py-7 pb-24 sm:px-8 lg:px-10 lg:py-9">{children}</main></div><nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[70px] items-center justify-around border-t border-[#e5e6eb] bg-[#f7f7f3]/95 px-2 backdrop-blur-xl lg:hidden">{navItems.slice(0, 5).map(item => { const I = item.icon; return <button key={item.route} onClick={() => go(item.route)} className={`flex min-w-[54px] flex-col items-center gap-1 text-[9px] font-bold ${location === item.route ? "text-[#6674f7]" : "text-[#9da5b4]"}`}><I size={18} /><span>{item.label}</span></button> })}</nav></div>;
}

function SectionHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) { return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"> <div>{eyebrow && <div className="eyebrow mb-3"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />{eyebrow}</div>}<h1 className="font-display text-[39px] leading-[1] tracking-[-.05em] text-[#1c2944] sm:text-[47px]">{title}</h1>{subtitle && <p className="mt-3 text-[14px] text-[#7b8499]">{subtitle}</p>}</div>{action}</div>; }

function MiniTrend({ positive = true, label = "Positive net" }: { positive?: boolean; label?: string }) { return <div className={`flex items-center gap-1 text-[11px] font-bold ${positive ? "text-[#708a21]" : "text-[#c07878]"}`}><span className="grid h-4 w-4 place-items-center rounded-full bg-current/10">{positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}</span>{label}<span className="font-medium text-[#9aa2b2]">from recorded data</span></div>; }

function OverviewPage({ transactions, goals, onAdd, onSafe, go }: { transactions: Transaction[]; goals: Goal[]; onAdd: () => void; onSafe: () => void; go: (path: string) => void }) {
  const income = transactions.filter(t => t.kind === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = transactions.filter(t => t.kind === "expense").reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses;
  const emergencyGoal = goals.find(goal => goal.title.toLowerCase().includes("emergency"));
  const suggestedBuffer = emergencyGoal?.target || Math.max(10000, Math.round(expenses * 1.5));
  const currentBuffer = emergencyGoal?.current || 0;
  const bufferContribution = Math.max(0, Math.min(5000, suggestedBuffer - currentBuffer));
  const remainingDays = remainingDaysInMonth();
  const safeToSpend = Math.max(0, Math.round((balance - bufferContribution) / remainingDays));
  const incomeAmounts = transactions.filter(transaction => transaction.kind === "income").map(transaction => transaction.amount);
  const averageIncome = incomeAmounts.length ? incomeAmounts.reduce((sum, amount) => sum + amount, 0) / incomeAmounts.length : 0;
  const incomeVariance = incomeAmounts.length > 1 ? incomeAmounts.reduce((sum, amount) => sum + Math.pow(amount - averageIncome, 2), 0) / incomeAmounts.length : 0;
  const incomeVariation = averageIncome ? Math.sqrt(incomeVariance) / averageIncome : 0;
  const stabilityScore = incomeAmounts.length ? Math.max(0, Math.min(100, Math.round((1 - Math.min(incomeVariation, 1)) * 100))) : 0;
  const stabilityLabel = stabilityScore >= 75 ? "Relatively stable" : stabilityScore >= 45 ? "Moderately stable" : "Needs more history";
  const chartData = useMemo(() => buildMonthlyTrend(transactions), [transactions]);
  const categoryData = useMemo(() => { const map: Record<string, number> = {}; transactions.filter(t => t.kind === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; }); return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })); }, [transactions]);
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow mb-3"><span className="h-1.5 w-1.5 rounded-full bg-[#cce57a]" />{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}{transactions.some(transaction => transaction.isDemo) && <span className="rounded-full bg-[#fff1d8] px-2 py-1 text-[9px] tracking-[.08em] text-[#ad7a38]">DEMO DATA</span>}</div><h1 className="font-display text-[39px] leading-[1] tracking-[-.05em] sm:text-[47px]">Good morning, Aarav <span className="font-sans text-3xl">👋</span></h1><p className="mt-3 text-[14px] text-[#7b8499]">Here's how your money is looking today.</p></div><Button variant="dark" onClick={onAdd}><Plus size={16} /> Add transaction</Button></div>

    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
      <div className="relative overflow-hidden rounded-[22px] bg-[#1c2944] p-6 text-white shadow-[0_16px_36px_rgba(28,41,68,.13)] sm:p-7"><div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[32px] border-white/[.035]" /><div className="absolute bottom-[-100px] right-[22%] h-64 w-64 rounded-full border-[28px] border-[#6674f7]/[.18]" /><div className="relative"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/45">Available balance</span><button onClick={() => toast("Balance is calculated from your recorded transactions.")} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/55 hover:border-white/30 hover:text-white">This month⌄</button></div><div className="mt-7 flex items-end justify-between gap-4"><div><div className="text-[41px] font-semibold tracking-[-.06em] sm:text-[49px]">{formatMoney(balance)}</div><div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#cce57a]"><ArrowUpRight size={14} /> {income >= expenses ? "Positive net" : "Negative net"} <span className="font-normal text-white/40">from recorded data</span></div></div><div className="hidden h-[58px] w-[125px] sm:block"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData.map(item => ({ v: item.income - item.expenses }))}><Line type="monotone" dataKey="v" stroke="#cce57a" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="mt-8 flex gap-8 border-t border-white/10 pt-4 text-[11px]"><div><span className="text-white/40">Income this month</span><div className="mt-1 font-bold text-[#cce57a]">+{formatMoney(income)}</div></div><div><span className="text-white/40">Expenses</span><div className="mt-1 font-bold text-white">−{formatMoney(expenses)}</div></div></div></div></div>
      <div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex items-start justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8992a5]">Estimated safe-to-spend</div><div className="mt-5 text-[34px] font-semibold tracking-[-.06em] text-[#1c2944]">{formatMoney(safeToSpend)}<span className="text-sm font-medium text-[#8992a5]"> / day</span></div></div><div className="grid h-10 w-10 place-items-center rounded-full bg-[#eff5dd] text-[#718b1f]"><ShieldCheck size={19} /></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef0f4]"><div className="h-full w-[72%] rounded-full bg-[#cce57a]" /></div><div className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-[#758096]"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#89a72d]" />You're within your recommended spending range.</div><button onClick={onSafe} className="mt-5 flex items-center gap-1 text-[12px] font-bold text-[#6674f7] hover:text-[#4f5dde]">View calculation <ChevronRight size={14} /></button></div>
      <div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex items-start justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8992a5]">Emergency buffer</div><div className="mt-5 text-[27px] font-semibold tracking-[-.06em] text-[#1c2944]">{formatMoney(currentBuffer)}<span className="text-sm font-medium text-[#8992a5]"> / {formatMoney(suggestedBuffer)}</span></div></div><div className="grid h-10 w-10 place-items-center rounded-full bg-[#f0f5df] text-[#78951f]"><ShieldCheck size={18} /></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef0f4]"><div className="h-full rounded-full bg-[#cce57a]" style={{ width: `${percent(currentBuffer, suggestedBuffer)}%` }} /></div><div className="mt-3 text-[11px] text-[#758096]">{percent(currentBuffer, suggestedBuffer)}% of your suggested target</div><button onClick={() => go("/goals")} className="mt-5 flex items-center gap-1 text-[12px] font-bold text-[#6674f7]">Manage buffer <ChevronRight size={14} /></button></div>
      <div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex items-start justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8992a5]">Income stability</div><div className="mt-5 text-[34px] font-semibold tracking-[-.06em] text-[#1c2944]">{stabilityScore}<span className="text-sm font-medium text-[#8992a5]"> / 100</span></div></div><div className="relative grid h-12 w-12 place-items-center rounded-full" style={{ background: `conic-gradient(#6674f7 0 ${stabilityScore}%, #edf0f5 ${stabilityScore}% 100%)` }}><div className="absolute inset-[5px] rounded-full bg-white" /><TrendingUp size={16} className="relative text-[#6674f7]" /></div></div><div className="mt-1 text-[12px] font-bold text-[#58647c]">{stabilityLabel}</div><div className="mt-4 grid grid-cols-3 gap-2 text-[10px]"><div><div className="text-[#929aab]">Average</div><div className="mt-1 font-bold text-[#26334e]">{formatMoney(averageIncome)}</div></div><div><div className="text-[#929aab]">Highest</div><div className="mt-1 font-bold text-[#26334e]">{formatMoney(incomeAmounts.length ? Math.max(...incomeAmounts) : 0)}</div></div><div><div className="text-[#929aab]">Lowest</div><div className="mt-1 font-bold text-[#26334e]">{formatMoney(incomeAmounts.length ? Math.min(...incomeAmounts) : 0)}</div></div></div><div className="mt-3 text-[10px] text-[#a0a7b5]">Based on your recorded income history. This is indicative, not a professional rating.</div></div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.45fr_.85fr]"><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />CASH FLOW</div><h2 className="text-[19px] font-bold tracking-[-.025em]">Income vs expenses</h2><p className="mt-1 text-[12px] text-[#8992a5]">A view of your money over time</p></div><div className="flex items-center gap-1 rounded-[10px] bg-[#f0f1f6] p-1">{(["7D", "30D", "3M", "6M"] as Range[]).map(range => <button key={range} onClick={() => toast(`${range} view selected.`)} className={`rounded-[7px] px-2.5 py-1.5 text-[10px] font-bold ${range === "30D" ? "bg-white text-[#6674f7] shadow-sm" : "text-[#8992a5] hover:text-[#26334e]"}`}>{range}</button>)}</div></div><div className="mt-7 h-[260px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6674f7" stopOpacity={0.2} /><stop offset="100%" stopColor="#6674f7" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cce57a" stopOpacity={0.16} /><stop offset="100%" stopColor="#cce57a" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eff0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca4b4" }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca4b4" }} tickFormatter={v => `₹${v / 1000}k`} /><Tooltip contentStyle={{ border: "1px solid #e6e8ef", borderRadius: 12, boxShadow: "0 12px 30px rgba(28,41,68,.1)", fontSize: 12 }} formatter={(v: number) => formatMoney(v)} /><Area type="monotone" dataKey="income" name="Income" stroke="#6674f7" strokeWidth={2.8} fill="url(#incomeFill)" /><Area type="monotone" dataKey="expenses" name="Expenses" stroke="#b3cd63" strokeWidth={2.5} fill="url(#expenseFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-1 flex items-center gap-5 text-[11px] font-semibold text-[#778198]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6674f7]" />Income</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#b3cd63]" />Expenses</span></div></div><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex items-start justify-between"><div><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />SPENDING MIX</div><h2 className="text-[19px] font-bold tracking-[-.025em]">Where money goes</h2></div><button onClick={() => go("/analytics")} className="text-[#8992a5] hover:text-[#6674f7]"><MoreHorizontal size={18} /></button></div><div className="mt-4 flex items-center gap-5"><div className="h-[150px] w-[150px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={3} stroke="none">{categoryData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e6e8ef", fontSize: 11 }} /></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-3">{categoryData.slice(0, 4).map((item, i) => <div key={item.name} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 font-semibold text-[#69748b]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i] }} />{item.name}</span><span className="font-bold text-[#26334e]">{Math.round((item.value / Math.max(expenses, 1)) * 100)}%</span></div>)}</div></div><button onClick={() => go("/analytics")} className="mt-4 flex items-center gap-1 text-[12px] font-bold text-[#6674f7]">See full breakdown <ArrowRight size={14} /></button></div></div>

    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)] sm:p-7"><div className="flex items-center justify-between"><div><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />ACTIVITY</div><h2 className="text-[19px] font-bold tracking-[-.025em]">Recent transactions</h2></div><button onClick={() => go("/transactions")} className="flex items-center gap-1 text-[12px] font-bold text-[#6674f7]">View all <ArrowRight size={14} /></button></div><div className="mt-5 divide-y divide-[#eff0f3]">{transactions.slice(0, 5).map(tx => <TransactionRow key={tx.id} tx={tx} compact />)}</div></div><div className="relative overflow-hidden rounded-[22px] bg-[#eef0ff] p-6 sm:p-7"><div className="absolute -bottom-14 -right-12 h-40 w-40 rounded-full border-[25px] border-[#6674f7]/10" /><div className="relative"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#6674f7]"><Lightbulb size={15} /> Financial insight</div><h2 className="mt-7 max-w-[330px] text-[23px] font-bold leading-[1.15] tracking-[-.04em] text-[#1c2944]">Your income increased 24% this month while essential expenses stayed stable.</h2><p className="mt-4 max-w-[330px] text-[13px] leading-6 text-[#66728b]">Consider moving ₹1,500 into your emergency buffer while your income is strong.</p><button onClick={() => go("/insights")} className="mt-8 flex items-center gap-2 text-[12px] font-bold text-[#6674f7]">Review insight <ArrowRight size={14} /></button></div></div></div>
  </div>;
}

function TransactionRow({ tx, compact = false, onEdit, onDelete }: { tx: Transaction; compact?: boolean; onEdit?: () => void; onDelete?: () => void }) { const TxIcon = categoryIcon[tx.category] || BadgeIndianRupee; return <div className={`group flex items-center gap-3 py-3.5 ${compact ? "" : "px-4"}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${tx.kind === "income" ? "bg-[#eff5dd] text-[#78951f]" : "bg-[#f1f2f7] text-[#778299]"}`}><TxIcon size={15} /></div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold text-[#26334e]">{tx.title}</div><div className="mt-0.5 text-[11px] text-[#9aa2b2]">{tx.category} · {tx.date}</div></div><div className={`text-right text-[13px] font-bold ${tx.kind === "income" ? "text-[#6f8c20]" : "text-[#26334e]"}`}>{signedMoney(tx)}<div className="mt-0.5 text-[10px] font-medium text-[#a0a7b5]">{tx.kind === "income" ? "Income" : "Expense"}</div></div>{(onEdit || onDelete) && <div className="flex gap-1 opacity-0 transition group-hover:opacity-100"><button onClick={onEdit} className="rounded-lg p-2 text-[#8b94a7] hover:bg-[#eef0f5] hover:text-[#6674f7]"><Pencil size={14} /></button><button onClick={onDelete} className="rounded-lg p-2 text-[#8b94a7] hover:bg-[#f8e8e8] hover:text-[#c47676]"><Trash2 size={14} /></button></div>}</div>; }

function TransactionsPage({ transactions, onAdd, onEdit, onDelete }: { transactions: Transaction[]; onAdd: () => void; onEdit: (tx: Transaction) => void; onDelete: (id: string | number) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TxKind>("all");
  const [sort, setSort] = useState("recent");
  const filtered = useMemo(() => transactions.filter(tx => (filter === "all" || tx.kind === filter) && `${tx.title} ${tx.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "amount" ? b.amount - a.amount : String(b.dateKey || b.id).localeCompare(String(a.dateKey || a.id))), [transactions, query, filter, sort]);
  return <div><SectionHeader eyebrow="YOUR MONEY TRAIL" title="Transactions" subtitle="A clear record of every income and expense." action={<Button variant="dark" onClick={onAdd}><Plus size={16} /> Add transaction</Button>} /><div className="rounded-[22px] border border-[#e5e7ed] bg-white shadow-[0_8px_24px_rgba(50,61,88,.035)]"><div className="flex flex-col gap-3 border-b border-[#eff0f3] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="relative flex-1 sm:max-w-[330px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a7b5]" /><input value={query} onChange={e => setQuery(e.target.value)} className="h-10 w-full rounded-xl bg-[#f2f3f7] pl-10 pr-3 text-[12px] font-semibold outline-none placeholder:text-[#a0a7b5] focus:ring-2 focus:ring-[#d8dcff]" placeholder="Search transactions" /></div><div className="flex items-center gap-2"><div className="flex rounded-xl bg-[#f2f3f7] p-1">{([["all", "All"], ["income", "Income"], ["expense", "Expenses"]] as const).map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${filter === key ? "bg-white text-[#6674f7] shadow-sm" : "text-[#8992a5]"}`}>{label}</button>)}</div><select value={sort} onChange={e => setSort(e.target.value)} className="h-10 rounded-xl border border-[#e5e7ed] bg-white px-3 text-[11px] font-bold text-[#66728b] outline-none"><option value="recent">Most recent</option><option value="amount">Highest amount</option></select><button onClick={() => toast("More filters are ready for your connected workspace.")} className="grid h-10 w-10 place-items-center rounded-xl border border-[#e5e7ed] text-[#8992a5] hover:bg-[#f5f6f9]"><SlidersHorizontal size={16} /></button></div></div><div className="hidden grid-cols-[1.5fr_1fr_1fr_110px_36px] gap-4 border-b border-[#eff0f3] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#9aa2b2] sm:grid"><span>Transaction</span><span>Category</span><span>Date</span><span className="text-right">Amount</span><span /></div><div className="divide-y divide-[#eff0f3]">{filtered.length ? filtered.map(tx => <div key={tx.id} className="grid-cols-1 sm:grid sm:grid-cols-[1.5fr_1fr_1fr_110px_36px] sm:items-center sm:gap-4"><div className="sm:contents"><TransactionRow tx={tx} onEdit={() => onEdit(tx)} onDelete={() => onDelete(tx.id)} /></div><div className="hidden text-[12px] font-semibold text-[#69748b] sm:block">{tx.category}</div><div className="hidden text-[12px] font-semibold text-[#69748b] sm:block">{tx.date}</div><div className="hidden text-right text-[13px] font-bold sm:block"><span className={tx.kind === "income" ? "text-[#6f8c20]" : "text-[#26334e]"}>{signedMoney(tx)}</span><div className="mt-0.5 text-[10px] font-medium text-[#a0a7b5]">{tx.kind}</div></div><div className="hidden sm:block" /></div>) : <div className="px-5 py-16 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f1f2f7] text-[#8992a5]"><Search size={18} /></div><div className="mt-3 text-[14px] font-bold">No transactions found</div><p className="mt-1 text-[12px] text-[#8992a5]">Try a different search or filter.</p></div>}</div><div className="flex items-center justify-between border-t border-[#eff0f3] px-5 py-4 text-[11px] font-semibold text-[#9aa2b2]"><span>Showing {filtered.length} of {transactions.length} transactions</span><div className="flex items-center gap-1"><button className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7ed] text-[#8992a5]"><ArrowLeft size={13} /></button><button className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef0ff] text-[#6674f7]">1</button><button className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7ed] text-[#8992a5]"><ArrowRight size={13} /></button></div></div></div></div>;
}

function AnalyticsPage({ transactions }: { transactions: Transaction[] }) {
  const incomeRows = transactions.filter(t => t.kind === "income");
  const expenseRows = transactions.filter(t => t.kind === "expense");
  const income = incomeRows.reduce((a, t) => a + t.amount, 0);
  const expenses = expenseRows.reduce((a, t) => a + t.amount, 0);
  const averageIncome = incomeRows.length ? income / incomeRows.length : 0;
  const averageExpenses = expenseRows.length ? expenses / expenseRows.length : 0;
  const incomeVariance = incomeRows.length > 1 && averageIncome ? incomeRows.reduce((sum, transaction) => sum + Math.pow(transaction.amount - averageIncome, 2), 0) / incomeRows.length : 0;
  const incomeVariation = averageIncome ? Math.sqrt(incomeVariance) / averageIncome : 0;
  const categoryData = useMemo(() => { const map: Record<string, number> = {}; expenseRows.forEach(t => map[t.category] = (map[t.category] || 0) + t.amount); return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [transactions]);
  const data = buildMonthlyTrend(transactions);
  return <div><SectionHeader eyebrow="SEE THE PATTERNS" title="Understand your money." subtitle="The numbers behind your everyday decisions." action={<button onClick={() => toast("Analytics period selector opened.")} className="flex h-10 items-center gap-2 rounded-xl border border-[#e5e7ed] bg-white px-3 text-[11px] font-bold text-[#68728b]"><CalendarDays size={14} /> Last 6 months <ChevronDown size={14} /></button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Average income" value={formatMoney(averageIncome)} trend={incomeRows.length ? `${incomeRows.length} recorded` : "No data"} icon={Banknote} tint="indigo" /><MetricCard label="Average expenses" value={formatMoney(averageExpenses)} trend={expenseRows.length ? `${expenseRows.length} recorded` : "No data"} icon={ReceiptText} tint="lime" /><MetricCard label="Savings rate" value={`${Math.round(((income - expenses) / Math.max(income, 1)) * 100)}%`} trend="+4.1%" icon={Target} tint="peach" /><MetricCard label="Income variability" value={`${Math.round(incomeVariation * 100)}%`} trend={incomeRows.length > 1 ? "Indicative" : "Needs history"} icon={ChartNoAxesCombined} tint="lavender" /></div><div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.8fr]"><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 sm:p-7"><div className="flex items-start justify-between"><div><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />MONTHLY MOVEMENT</div><h2 className="text-[19px] font-bold">Income vs expenses</h2></div><MiniTrend positive={income >= expenses} label={income >= expenses ? "Positive net" : "Negative net"} /></div><div className="mt-8 h-[310px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} barGap={5} margin={{ left: -24, right: 5 }}><CartesianGrid stroke="#eff0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca4b4" }} dy={9} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca4b4" }} tickFormatter={v => `₹${v / 1000}k`} /><Tooltip cursor={{ fill: "#f6f7fa" }} contentStyle={{ border: "1px solid #e6e8ef", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatMoney(v)} /><Bar dataKey="income" name="Income" fill="#6674f7" radius={[5, 5, 0, 0]} barSize={16} /><Bar dataKey="expenses" name="Expenses" fill="#cce57a" radius={[5, 5, 0, 0]} barSize={16} /></BarChart></ResponsiveContainer></div></div><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 sm:p-7"><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#cce57a]" />INCOME FLUCTUATION</div><h2 className="text-[19px] font-bold">Consistency over time</h2><div className="mt-7 h-[190px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ left: -24, right: 4 }}><CartesianGrid stroke="#eff0f3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca4b4" }} /><YAxis hide /><Tooltip contentStyle={{ border: "1px solid #e6e8ef", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatMoney(v)} /><Line type="monotone" dataKey="income" stroke="#6674f7" strokeWidth={3} dot={{ r: 3, fill: "#6674f7", strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div><div className="rounded-[13px] bg-[#f3f6e7] p-3 text-[12px] leading-5 text-[#67744a]"><span className="font-bold">Your pattern:</span> highest earning period was July, while June was your quietest month.</div></div></div><div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.3fr]"><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 sm:p-7"><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />EXPENSE ANALYSIS</div><h2 className="text-[19px] font-bold">Where your money goes</h2><div className="mt-3 flex items-center gap-5"><div className="h-[180px] w-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" innerRadius={54} outerRadius={80} paddingAngle={3} stroke="none">{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e6e8ef", fontSize: 11 }} /></PieChart></ResponsiveContainer></div><div className="flex-1 space-y-3">{categoryData.slice(0, 5).map((item, i) => <div key={item.name} className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-2 font-semibold text-[#69748b]"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{item.name}</span><span className="font-bold text-[#26334e]">{formatMoney(item.value)}</span></div>)}</div></div></div><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 sm:p-7"><div className="eyebrow mb-2"><span className="h-1.5 w-1.5 rounded-full bg-[#efb66a]" />SPENDING TREND</div><h2 className="text-[19px] font-bold">Small shifts worth noticing</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{categoryData.slice(0, 3).map((item, index) => ({ label: item.name, value: expenses ? `${Math.round((item.value / expenses) * 100)}%` : "0%", caption: index === 0 ? "Largest share" : "Recorded share", icon: [CarFront, Utensils, ShoppingBag][index], direction: "up" as const })).map(({ label, value, caption, icon: I, direction }) => <div key={label as string} className="rounded-[15px] bg-[#f7f8fa] p-4"><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#6674f7] shadow-sm"><I size={15} /></span><span className={`text-[12px] font-bold ${direction === "up" ? "text-[#b87a60]" : "text-[#78931e]"}`}>{value}</span></div><div className="mt-4 text-[13px] font-bold text-[#26334e]">{label}</div><div className="mt-1 text-[10px] text-[#9aa2b2]">{caption}</div></div>)}</div><div className="mt-5 flex gap-2 rounded-[13px] bg-[#eef0ff] p-3 text-[12px] leading-5 text-[#6873a2]"><Lightbulb size={15} className="mt-0.5 shrink-0 text-[#6674f7]" />These shares are calculated from the expense records in your workspace.</div></div></div></div>;
}

function MetricCard({ label, value, trend, icon: I, tint }: { label: string; value: string; trend: string; icon: Icon; tint: string }) { const bg: Record<string, string> = { indigo: "bg-[#eef0ff] text-[#6674f7]", lime: "bg-[#f0f5df] text-[#78951f]", peach: "bg-[#fff1e6] text-[#c67d49]", lavender: "bg-[#f2efff] text-[#8b72cf]" }; return <div className="rounded-[20px] border border-[#e5e7ed] bg-white p-5 shadow-[0_8px_24px_rgba(50,61,88,.035)]"><div className="flex items-start justify-between"><div className={`grid h-9 w-9 place-items-center rounded-[11px] ${bg[tint]}`}><I size={16} /></div><span className="rounded-full bg-[#f4f5f7] px-2 py-1 text-[10px] font-bold text-[#758096]">{trend}</span></div><div className="mt-6 text-[11px] font-semibold text-[#8992a5]">{label}</div><div className="mt-1 text-[25px] font-semibold tracking-[-.05em] text-[#26334e]">{value}</div></div>; }

function InsightsPage({ insights, dismiss }: { insights: Insight[]; dismiss: (id: number) => void }) { return <div><SectionHeader eyebrow="A LITTLE MORE CLARITY" title="Financial insights" subtitle="Simple observations that help you make better decisions." /><div className="grid gap-4 lg:grid-cols-3">{insights.map(insight => { const config = insight.type === "Opportunity" ? { bg: "bg-[#eef5dc]", text: "text-[#708b22]", Icon: Lightbulb } : insight.type === "Attention" ? { bg: "bg-[#fff0e4]", text: "text-[#b97145]", Icon: AlertTriangle } : { bg: "bg-[#eef0ff]", text: "text-[#6674f7]", Icon: Target }; const I = config.Icon; return <div key={insight.id} className="flex flex-col rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)]"><div className="flex items-start justify-between"><div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] ${config.bg} ${config.text}`}><I size={13} />{insight.type}</div><button onClick={() => dismiss(insight.id)} className="rounded-lg p-1 text-[#a0a7b5] hover:bg-[#f2f3f7] hover:text-[#66728b]"><X size={15} /></button></div><h2 className="mt-8 text-[20px] font-bold leading-[1.2] tracking-[-.03em] text-[#26334e]">{insight.title}</h2><p className="mt-3 text-[13px] leading-6 text-[#778198]">{insight.body}</p><div className="mt-6 rounded-[13px] bg-[#f7f8fa] px-3.5 py-3 text-[16px] font-bold text-[#26334e]">{insight.metric}</div><button onClick={() => toast(`${insight.action} — this will be connected to your account later.`)} className="mt-auto flex items-center gap-1 pt-6 text-left text-[12px] font-bold text-[#6674f7]">{insight.action} <ArrowRight size={14} /></button></div> })}</div><div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[22px] bg-[#1c2944] p-7 text-white"><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#cce57a]"><CircleHelp size={15} /> How Flowlence calculates this</div><h2 className="mt-8 max-w-[560px] font-display text-3xl leading-[1.1] tracking-[-.04em]">Transparent by default.<br /><em className="text-[#cce57a]">Helpful, not mysterious.</em></h2><p className="mt-5 max-w-[590px] text-[13px] leading-6 text-white/55">Every insight uses the income and expenses you choose to record. We look for meaningful shifts, compare patterns over time, and show the reasoning behind each suggestion. Nothing here is professional financial advice.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold text-white/60">Income patterns</span><span className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold text-white/60">Essential spending</span><span className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold text-white/60">Buffer progress</span></div></div><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-7"><div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#eff5dd] text-[#78951f]"><ShieldCheck size={18} /></div><h2 className="mt-7 text-[19px] font-bold tracking-[-.03em]">A note on your data</h2><p className="mt-3 text-[13px] leading-6 text-[#778198]">Your financial records are stored in Supabase with row-level access policies, so your workspace only exposes your own data.</p><button onClick={() => toast("Privacy controls are ready for the Supabase connection.")} className="mt-6 flex items-center gap-1 text-[12px] font-bold text-[#6674f7]">Privacy controls <ArrowRight size={14} /></button></div></div></div>; }

function GoalsPage({ goals, onAdd, onUpdate }: { goals: Goal[]; onAdd: () => void; onUpdate: (goal: Goal) => void }) { return <div><SectionHeader eyebrow="KEEP MOVING FORWARD" title="Your goals" subtitle="Small contributions become meaningful progress." action={<Button variant="dark" onClick={onAdd}><Plus size={16} /> Create goal</Button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{goals.map(goal => { const done = percent(goal.current, goal.target); return <div key={goal.id} className="rounded-[22px] border border-[#e5e7ed] bg-white p-6 shadow-[0_8px_24px_rgba(50,61,88,.035)]"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-[12px]" style={{ background: `${goal.color}18`, color: goal.color }}><Target size={18} /></div><button onClick={() => toast("Goal menu is ready for editing.")} className="rounded-lg p-2 text-[#a0a7b5] hover:bg-[#f2f3f7]"><MoreHorizontal size={17} /></button></div><h2 className="mt-7 text-[20px] font-bold tracking-[-.035em]">{goal.title}</h2><div className="mt-4 flex items-end justify-between"><div><span className="text-2xl font-semibold tracking-[-.05em]">{formatMoney(goal.current)}</span><span className="ml-1 text-[12px] font-semibold text-[#9aa2b2]">of {formatMoney(goal.target)}</span></div><span className="text-[13px] font-bold" style={{ color: goal.color }}>{done}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eff0f4]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${done}%`, background: goal.color }} /></div><div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-[#9aa2b2]"><span className="flex items-center gap-1"><CalendarDays size={13} />Target {goal.deadline}</span><button onClick={() => onUpdate(goal)} className="font-bold text-[#6674f7] hover:text-[#4f5dde]">Update progress</button></div></div>})}</div><div className="mt-5 rounded-[22px] border border-dashed border-[#cbd0dc] bg-[#fbfbf8] p-7 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#eef0ff] text-[#6674f7]"><Plus size={18} /></div><h3 className="mt-4 text-[16px] font-bold">Give your next milestone a name</h3><p className="mx-auto mt-2 max-w-[400px] text-[13px] leading-5 text-[#8992a5]">Goals make irregular income feel more intentional. Start with a small, visible win.</p><button onClick={onAdd} className="mt-5 text-[12px] font-bold text-[#6674f7]">Create a goal <ArrowRight size={14} className="inline" /></button></div></div>; }

function SettingsPage({ onLogout, userName, email, userId }: { onLogout: () => void; userName: string; email: string; userId: string }) { const [saved, setSaved] = useState(false); const [saving, setSaving] = useState(false); const saveSettings = async () => { setSaving(true); const { error } = await supabase.from("profiles").upsert({ id: userId, full_name: userName, currency: "INR", emergency_buffer_target: 10000, updated_at: new Date().toISOString() }); setSaving(false); if (error) { toast.error("Settings could not be saved."); return; } setSaved(true); toast.success("Settings saved securely."); }; const settingRows = [[UserRound, "Profile", `${userName} · ${email}`], [BadgeIndianRupee, "Currency", "Indian Rupee (₹)"], [Bell, "Notifications", "Weekly summaries and insights"], [SlidersHorizontal, "Financial preferences", "Buffer target · ₹10,000"], [LockKeyhole, "Privacy", "Your data stays yours"], [ShieldCheck, "Security", "Password and active sessions"]] as [Icon, string, string][]; return <div><SectionHeader eyebrow="YOUR WORKSPACE" title="Settings" subtitle="Keep your Flowlence experience personal." action={saved ? <span className="flex items-center gap-2 text-[12px] font-bold text-[#78951f]"><CheckCircle2 size={16} /> Changes saved</span> : <Button variant="dark" onClick={saveSettings} disabled={saving}>Save changes</Button>} /><div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><div className="overflow-hidden rounded-[22px] border border-[#e5e7ed] bg-white shadow-[0_8px_24px_rgba(50,61,88,.035)]">{settingRows.map(([I, title, desc], index) => <button key={title} onClick={() => toast(`${title} settings selected.`)} className={`flex w-full items-center gap-4 p-5 text-left transition hover:bg-[#fafafd] ${index < settingRows.length - 1 ? "border-b border-[#eff0f3]" : ""}`}><div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#f0f1f7] text-[#6674f7]"><I size={17} /></div><div className="flex-1"><div className="text-[14px] font-bold text-[#26334e]">{title}</div><div className="mt-1 text-[12px] text-[#8992a5]">{desc}</div></div><ChevronRight size={16} className="text-[#b0b6c3]" /></button>)}</div><div className="space-y-4"><div className="rounded-[22px] bg-[#1c2944] p-7 text-white"><div className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/10 text-[#cce57a]"><ShieldCheck size={19} /></div><h2 className="mt-7 text-[20px] font-bold">Private by design</h2><p className="mt-3 text-[13px] leading-6 text-white/55">Your workspace is backed by Supabase with per-user policies for profile and financial records.</p><button onClick={() => toast("Supabase connection and account controls are active for this workspace.")} className="mt-6 text-[12px] font-bold text-[#cce57a]">Learn about data safety <ArrowRight size={14} className="inline" /></button></div><div className="rounded-[22px] border border-[#e5e7ed] bg-white p-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#f7eee7] text-[#c67d49]"><LogOut size={16} /></div><div><div className="text-[14px] font-bold">Sign out</div><div className="mt-0.5 text-[11px] text-[#8992a5]">End this session on this device.</div></div></div><button onClick={onLogout} className="mt-5 w-full rounded-xl border border-[#e5e7ed] py-2.5 text-[12px] font-bold text-[#66728b] hover:bg-[#f8f8fa]">Log out securely</button></div></div></div></div>; }

function TransactionModal({ onClose, onSave, editing }: { onClose: () => void; onSave: (tx: Omit<Transaction, "id">, id?: string | number) => void; editing?: Transaction | null }) { const [kind, setKind] = useState<TxKind>(editing?.kind || "income"); const [amount, setAmount] = useState(editing?.amount.toString() || ""); const [title, setTitle] = useState(editing?.title || ""); const [category, setCategory] = useState(editing?.category || "Freelance"); const [date, setDate] = useState(editing?.date || "Today"); const incomeCategories = ["Freelance", "Daily wage", "Gig work", "Business", "Commission", "Other"]; const expenseCategories = ["Food", "Housing", "Travel", "Healthcare", "Bills", "Education", "Shopping", "Other"]; const save = (e: FormEvent) => { e.preventDefault(); const numeric = Number(amount.replace(/,/g, "")); if (!numeric || !title) { toast.error("Add an amount and description to continue."); return; } onSave({ kind, amount: numeric, title, category, date, source: kind === "income" ? "Income" : undefined }, editing?.id); }; return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#16223a]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-[500px] overflow-y-auto rounded-t-[26px] bg-[#f7f7f3] p-6 shadow-2xl sm:rounded-[26px] sm:p-7"><div className="flex items-start justify-between"><div><div className="eyebrow mb-3"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />{editing ? "EDIT RECORD" : "NEW RECORD"}</div><h2 className="font-display text-3xl tracking-[-.045em]">{editing ? "Update transaction" : "Add a transaction"}</h2><p className="mt-2 text-[12px] text-[#8992a5]">Keep your money picture current.</p></div><button onClick={onClose} className="rounded-xl p-2 text-[#8992a5] hover:bg-[#e9ebf1]"><X size={19} /></button></div><div className="mt-6 flex rounded-[13px] bg-[#e9ebf1] p-1">{(["income", "expense"] as TxKind[]).map(item => <button key={item} onClick={() => { setKind(item); setCategory(item === "income" ? "Freelance" : "Food"); }} className={`flex-1 rounded-[10px] py-2.5 text-[12px] font-bold capitalize transition ${kind === item ? "bg-white text-[#6674f7] shadow-sm" : "text-[#8992a5]"}`}>{item}</button>)}</div><form onSubmit={save} className="mt-6 space-y-4"><label className="field-label">Amount<input autoFocus value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" className="field-input text-lg font-bold" placeholder="₹ 0" /></label><label className="field-label">{kind === "income" ? "Income source" : "Category"}<select value={category} onChange={e => setCategory(e.target.value)} className="field-input">{(kind === "income" ? incomeCategories : expenseCategories).map(item => <option key={item}>{item}</option>)}</select></label><label className="field-label">Description<input value={title} onChange={e => setTitle(e.target.value)} className="field-input" placeholder={kind === "income" ? "e.g. Client payment" : "e.g. Groceries"} /></label><label className="field-label">Date<input value={date} onChange={e => setDate(e.target.value)} className="field-input" placeholder="Today" /></label><div className="flex gap-3 pt-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" variant={kind === "income" ? "lime" : "primary"} className="flex-1">{editing ? "Save changes" : `Add ${kind}`} <ArrowRight size={15} /></Button></div></form></div></div>; }

function SafeSpendModal({ balance, bufferContribution, upcomingExpenses = 0, remainingDays, onClose }: { balance: number; bufferContribution: number; upcomingExpenses?: number; remainingDays: number; onClose: () => void }) { const spend = Math.max(0, Math.round((balance - upcomingExpenses - bufferContribution) / remainingDays)); return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#16223a]/45 p-5 backdrop-blur-sm"><div className="w-full max-w-[500px] rounded-[26px] bg-[#f7f7f3] p-7 shadow-2xl"><div className="flex items-start justify-between"><div><div className="eyebrow mb-3"><span className="h-1.5 w-1.5 rounded-full bg-[#78951f]" />TRANSPARENT CALCULATION</div><h2 className="font-display text-3xl tracking-[-.045em]">Your safe-to-spend</h2></div><button onClick={onClose} className="rounded-xl p-2 text-[#8992a5] hover:bg-[#e9ebf1]"><X size={19} /></button></div><div className="mt-7 rounded-[18px] bg-[#1c2944] p-6 text-white"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white/45">Estimated safe-to-spend</div><div className="mt-3 text-4xl font-semibold tracking-[-.06em]">{formatMoney(spend)}<span className="text-sm font-medium text-white/45"> / day</span></div><div className="mt-2 text-[12px] text-white/50">A helpful estimate, not professional financial advice.</div></div><div className="mt-5 space-y-3 rounded-[17px] border border-[#e5e7ed] bg-white p-5 text-[13px]"><div className="flex justify-between"><span className="text-[#778198]">Available balance</span><b>{formatMoney(balance)}</b></div><div className="flex justify-between"><span className="text-[#778198]">Essential upcoming expenses</span><b>−{formatMoney(upcomingExpenses)}</b></div><div className="flex justify-between"><span className="text-[#778198]">Recommended buffer contribution</span><b>−{formatMoney(bufferContribution)}</b></div><div className="my-2 h-px bg-[#eff0f3]" /><div className="flex justify-between"><span className="text-[#778198]">Amount divided over</span><b>{remainingDays} days</b></div></div><p className="mt-5 text-[11px] leading-5 text-[#8992a5]">Flowlence adjusts this estimate as you add transactions. The calculation is intentionally transparent so you can make the final call.</p><Button variant="dark" className="mt-5 w-full" onClick={onClose}>Got it</Button></div></div>; }

function GoalModal({ onClose, onSave, editing }: { onClose: () => void; onSave: (goal: Omit<Goal, "id">, id?: string | number) => void; editing?: Goal | null }) { const [title, setTitle] = useState(editing?.title || ""); const [current, setCurrent] = useState(editing?.current.toString() || ""); const [target, setTarget] = useState(editing?.target.toString() || ""); const [deadline, setDeadline] = useState(editing?.deadline || ""); const save = (e: FormEvent) => { e.preventDefault(); if (!title || !Number(target)) { toast.error("Add a goal name and target amount."); return; } onSave({ title, current: Number(current) || 0, target: Number(target), deadline: deadline || "31 Dec 2024", color: editing?.color || "#6674f7" }, editing?.id); }; return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#16223a]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="w-full max-w-[500px] rounded-t-[26px] bg-[#f7f7f3] p-7 shadow-2xl sm:rounded-[26px]"><div className="flex items-start justify-between"><div><div className="eyebrow mb-3"><span className="h-1.5 w-1.5 rounded-full bg-[#6674f7]" />{editing ? "UPDATE PROGRESS" : "NEW MILESTONE"}</div><h2 className="font-display text-3xl tracking-[-.045em]">{editing ? "Update your progress" : "Create a goal"}</h2></div><button onClick={onClose} className="rounded-xl p-2 text-[#8992a5] hover:bg-[#e9ebf1]"><X size={19} /></button></div><form onSubmit={save} className="mt-6 space-y-4"><label className="field-label">Goal name<input value={title} onChange={e => setTitle(e.target.value)} className="field-input" placeholder="e.g. Emergency fund" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Current amount<input value={current} onChange={e => setCurrent(e.target.value)} inputMode="numeric" className="field-input" placeholder="₹ 0" /></label><label className="field-label">Target amount<input value={target} onChange={e => setTarget(e.target.value)} inputMode="numeric" className="field-input" placeholder="₹ 10,000" /></label></div><label className="field-label">Target date<input value={deadline} onChange={e => setDeadline(e.target.value)} className="field-input" placeholder="31 Dec 2024" /></label><div className="flex gap-3 pt-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button type="submit" variant="dark" className="flex-1">{editing ? "Save progress" : "Create goal"} <ArrowRight size={15} /></Button></div></form></div></div>; }

async function loadUserData(userId: string) {
  const [incomeResult, expenseResult, goalResult] = await Promise.all([
    supabase.from("income").select("id,amount,source,category,date,notes,is_demo").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("expenses").select("id,amount,category,date,description,is_demo").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("goals").select("id,title,current_amount,target_amount,deadline,color").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);
  if (incomeResult.error) throw incomeResult.error;
  if (expenseResult.error) throw expenseResult.error;
  if (goalResult.error) throw goalResult.error;
  const incomeRows = incomeResult.data || [];
  const expenseRows = expenseResult.data || [];
  const transactions = [
    ...incomeRows.map(row => ({ ...mapIncomeRow(row), isDemo: Boolean(row.is_demo) })),
    ...expenseRows.map(row => ({ ...mapExpenseRow(row), isDemo: Boolean(row.is_demo) })),
  ].sort((a, b) => String(b.dateKey || b.id).localeCompare(String(a.dateKey || a.id)));
  const goals: Goal[] = (goalResult.data || []).map(goal => ({ id: goal.id, title: goal.title, current: Number(goal.current_amount), target: Number(goal.target_amount), deadline: goal.deadline ? displayDate(goal.deadline) : "No deadline", color: goal.color || "#6674f7" }));
  return { transactions, goals, insights: buildInsights(transactions) };
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactionModal, setTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [safeModal, setSafeModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const go = (path: string) => setLocation(path);

  const refresh = async (userId: string) => {
    setDataLoading(true);
    setDataError("");
    try {
      const loaded = await loadUserData(userId);
      setTransactions(loaded.transactions);
      setGoals(loaded.goals);
      setInsights(loaded.insights);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "We could not load your financial data.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session?.user.id) refresh(session.user.id);
    else {
      setTransactions([]);
      setGoals([]);
      setInsights([]);
      setDataLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    const isPublic = location === "/";
    const isAuth = location === "/login" || location === "/signup";
    if (!authLoading && !session && !isPublic && !isAuth) go("/login");
    if (!authLoading && session && isAuth) go("/overview");
  }, [authLoading, session, location]);

  const income = transactions.filter(t => t.kind === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = transactions.filter(t => t.kind === "expense").reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses;
  const userEmail = session?.user.email || "";
  const userName = session?.user.user_metadata?.full_name || userEmail.split("@")[0] || "Your workspace";
  const userInitials = userName.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase() || "FL";
  const openAdd = () => { setEditingTransaction(null); setTransactionModal(true); };
  const normalizeDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value === "Yesterday") return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (value !== "Today") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    return isoToday();
  };

  const saveTransaction = async (data: Omit<Transaction, "id">, id?: string | number) => {
    if (!session?.user.id) return;
    const date = normalizeDate(data.date);
    const isIncome = data.kind === "income";
    const incomePayload = { user_id: session.user.id, amount: data.amount, source: data.source || data.category, category: data.category, date, notes: data.title, is_demo: false };
    const expensePayload = { user_id: session.user.id, amount: data.amount, category: data.category, date, description: data.title, is_demo: false };
    setDataLoading(true);
    try {
      if (id && typeof id === "string" && editingTransaction && editingTransaction.kind !== data.kind) {
        const oldTable = editingTransaction.kind === "income" ? "income" : "expenses";
        const removeResult = await supabase.from(oldTable).delete().eq("id", id).eq("user_id", session.user.id);
        if (removeResult.error) throw removeResult.error;
        const insertResult = isIncome ? await supabase.from("income").insert(incomePayload) : await supabase.from("expenses").insert(expensePayload);
        if (insertResult.error) throw insertResult.error;
      } else if (id && typeof id === "string") {
        const table = isIncome ? "income" : "expenses";
        const result = isIncome ? await supabase.from("income").update(incomePayload).eq("id", id).eq("user_id", session.user.id) : await supabase.from("expenses").update(expensePayload).eq("id", id).eq("user_id", session.user.id);
        if (result.error) throw result.error;
      } else {
        const result = isIncome ? await supabase.from("income").insert(incomePayload) : await supabase.from("expenses").insert(expensePayload);
        if (result.error) throw result.error;
      }
      await refresh(session.user.id);
      toast.success(id ? "Transaction updated." : `${isIncome ? "Income" : "Expense"} added.`);
      setTransactionModal(false);
      setEditingTransaction(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "We could not save this transaction.");
      toast.error("We could not save this transaction.");
      setDataLoading(false);
    }
  };

  const deleteTransaction = async (id: string | number) => {
    if (!session?.user.id) return;
    const target = transactions.find(transaction => transaction.id === id);
    if (!target || typeof id !== "string") return;
    const table = target.kind === "income" ? "income" : "expenses";
    const result = await supabase.from(table).delete().eq("id", id).eq("user_id", session.user.id);
    if (result.error) { toast.error("We could not delete this transaction."); return; }
    await refresh(session.user.id);
    toast.success("Transaction deleted.");
  };

  const saveGoal = async (data: Omit<Goal, "id">, id?: string | number) => {
    if (!session?.user.id) return;
    const payload = { user_id: session.user.id, title: data.title, current_amount: data.current, target_amount: data.target, deadline: normalizeDate(data.deadline), color: data.color };
    const result = id && typeof id === "string"
      ? await supabase.from("goals").update(payload).eq("id", id).eq("user_id", session.user.id)
      : await supabase.from("goals").insert(payload);
    if (result.error) { toast.error("We could not save this goal."); return; }
    await refresh(session.user.id);
    setGoalModal(false);
    setEditingGoal(null);
    toast.success(id ? "Goal progress updated." : "New goal created.");
  };

  const loadDemoData = async () => {
    if (!session?.user.id || demoLoading) return;
    setDemoLoading(true);
    const day = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    const incomeRows = [
      { user_id: session.user.id, amount: 4500, source: "Freelance", category: "Freelance", date: day(0), notes: "Freelance payment", is_demo: true },
      { user_id: session.user.id, amount: 2000, source: "Gig work", category: "Gig work", date: day(4), notes: "Delivery work", is_demo: true },
      { user_id: session.user.id, amount: 12000, source: "Freelance", category: "Freelance", date: day(7), notes: "Project milestone", is_demo: true },
    ];
    const expenseRows = [
      { user_id: session.user.id, amount: 350, category: "Food", date: day(0), description: "Groceries", is_demo: true },
      { user_id: session.user.id, amount: 120, category: "Travel", date: day(1), description: "Auto ride", is_demo: true },
      { user_id: session.user.id, amount: 6500, category: "Housing", date: day(10), description: "Monthly rent", is_demo: true },
      { user_id: session.user.id, amount: 1780, category: "Bills", date: day(12), description: "Electricity bill", is_demo: true },
    ];
    const incomeResult = await supabase.from("income").insert(incomeRows);
    const expenseResult = await supabase.from("expenses").insert(expenseRows);
    const goalResult = await supabase.from("goals").insert({ user_id: session.user.id, title: "Emergency buffer", current_amount: 2500, target_amount: 10000, deadline: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10), color: "#6674f7" });
    if (incomeResult.error || expenseResult.error || goalResult.error) {
      toast.error("Demo data could not be loaded. Please try again.");
    } else {
      await refresh(session.user.id);
      toast.success("Demo data loaded. It is clearly marked as sample data.");
    }
    setDemoLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("You have been signed out.");
    go("/");
  };

  const isPublic = location === "/";
  const isAuth = location === "/login" || location === "/signup";
  if (isPublic) return <LandingPage go={go} />;
  if (isAuth) return <AuthPage mode={location === "/signup" ? "signup" : "login"} go={go} />;
  if (authLoading || !session || dataLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f7f3] text-[#66728b]"><div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-[15px] bg-[#6674f7] text-white shadow-[0_8px_22px_rgba(102,116,247,.25)]"><span className="text-[17px] font-extrabold tracking-[-.08em]">fl</span></div><div className="mt-5 text-[13px] font-bold">Loading your money picture…</div><div className="mt-2 text-[11px] text-[#9aa2b2]">Securely syncing your Flowlence workspace</div></div></div>;

  let page: React.ReactNode = <OverviewPage transactions={transactions} goals={goals} onAdd={openAdd} onSafe={() => setSafeModal(true)} go={go} />;
  if (location === "/transactions") page = <TransactionsPage transactions={transactions} onAdd={openAdd} onEdit={(tx) => { setEditingTransaction(tx); setTransactionModal(true); }} onDelete={deleteTransaction} />;
  if (location === "/analytics") page = <AnalyticsPage transactions={transactions} />;
  if (location === "/insights") page = <InsightsPage insights={insights} dismiss={(id) => { setInsights(prev => prev.filter(i => i.id !== id)); toast("Insight dismissed."); }} />;
  if (location === "/goals") page = <GoalsPage goals={goals} onAdd={() => { setEditingGoal(null); setGoalModal(true); }} onUpdate={(goal) => { setEditingGoal(goal); setGoalModal(true); }} />;
  if (location === "/settings") page = <SettingsPage onLogout={logout} userName={userName} email={userEmail} userId={session.user.id} />;
  if (dataError) page = <div className="rounded-[22px] border border-[#f0d7d7] bg-white p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff0f0] text-[#bd7373]"><AlertTriangle size={20} /></div><h1 className="mt-5 text-[20px] font-bold">We could not load your workspace</h1><p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-6 text-[#8992a5]">{dataError}</p><Button variant="dark" className="mt-6" onClick={() => refresh(session.user.id)}>Try again <ArrowRight size={15} /></Button></div>;
  return <><AppShell location={location} go={go} onAdd={openAdd} onLogout={logout} userName={userName} userInitials={userInitials}>{page}</AppShell>{transactionModal && <TransactionModal editing={editingTransaction} onClose={() => { setTransactionModal(false); setEditingTransaction(null); }} onSave={saveTransaction} />}{safeModal && <SafeSpendModal balance={balance} bufferContribution={Math.max(0, Math.min(5000, Math.max(10000, Math.round(expenses * 1.5)) - (goals.find(goal => goal.title.toLowerCase().includes("emergency"))?.current || 0)))} remainingDays={remainingDaysInMonth()} onClose={() => setSafeModal(false)} />}{goalModal && <GoalModal editing={editingGoal} onClose={() => { setGoalModal(false); setEditingGoal(null); }} onSave={saveGoal} />}{transactions.length === 0 && <button onClick={loadDemoData} className="fixed bottom-[84px] right-5 z-40 rounded-full bg-[#cce57a] px-4 py-3 text-[12px] font-bold text-[#283518] shadow-[0_10px_25px_rgba(75,92,31,.18)] transition hover:-translate-y-0.5 lg:bottom-7">{demoLoading ? "Loading demo…" : "Load demo data"}</button>}</>;
}
