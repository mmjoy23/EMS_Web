import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Zap,
  Sun,
  Moon,
  ArrowRight,
  Star,
  Bookmark,
  Calendar,
  MapPin,
  CheckCircle,
  Users,
  Activity,
  Award,
  Grid,
  X,
  Globe,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Btn, Badge, EventCard, categoryVisual, catBadge, cn } from "@/components/shared";
import { useFeaturedEvents, useEvents, useCategories } from "@/hooks";
import { formatDate } from "@/lib/format";
import type { ScreenProps } from "@/lib/nav";
import type { Category } from "@/lib/types";

export function Landing({ nav, isDark, setIsDark }: ScreenProps) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState<Category | null>(null);
  const [searchVal, setSearchVal] = useState("");

  const { events: featuredEvents } = useFeaturedEvents();
  const { events: upcoming } = useEvents({ when: "upcoming" });
  const { categories } = useCategories();

  useEffect(() => {
    if (featuredEvents.length === 0) return;
    const id = setInterval(() => setCarouselIdx((i) => (i + 1) % featuredEvents.length), 4500);
    return () => clearInterval(id);
  }, [featuredEvents.length]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const NAV_ACTIONS: Record<string, () => void> = {
    "Browse Events": () => scrollTo("section-events"),
    Categories: () => scrollTo("section-categories"),
    About: () => scrollTo("section-about"),
    Contact: () => scrollTo("section-contact"),
  };

  const cur = featuredEvents[carouselIdx % Math.max(1, featuredEvents.length)];
  const remaining = cur ? cur.remaining : 0;
  const modalEvents = showCategoryModal
    ? upcoming.filter((e) => e.category?.slug === showCategoryModal.slug)
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-[#050B18]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">UniEvents</span>
          </button>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            {["Browse Events", "Categories", "About", "Contact"].map((l) => (
              <button key={l} onClick={NAV_ACTIONS[l]} className="hover:text-white transition-colors duration-200 font-medium">{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </button>
            <button onClick={() => nav("login")}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200">
              Sign In
            </button>
            <button onClick={() => nav("signup")}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#050B18] text-white min-h-[90vh] flex items-center">
        {/* Aurora orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[90px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0, 0, 0.58, 1] }}>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-300 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                342 events happening this semester
              </div>
              <h1 className="text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
                Discover<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Campus Events
                </span><br />
                &amp; Connect
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                Register for workshops, sports festivals, cultural events, and career fairs — all in one place with instant QR confirmation.
              </p>
              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search events, categories…"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/6 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>
                <button onClick={() => scrollTo("section-events")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-200 shrink-0">
                  Browse Events <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {/* Mini stats */}
              <div className="flex items-center gap-8">
                {[["5,847", "Students"], ["342", "Events"], ["89.3%", "Attendance"]].map(([v, l]) => (
                  <div key={l} className="flex flex-col">
                    <span className="text-2xl font-extrabold text-white tracking-tight">{v}</span>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: featured event card */}
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0, 0, 0.58, 1] }} className="relative">
              <div className="absolute inset-0 scale-95 blur-2xl bg-blue-600/15 rounded-3xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-sm">
                <div className="relative h-64 overflow-hidden">
                  {cur?.coverImage ? (
                    <motion.img key={carouselIdx} src={cur.coverImage} alt={cur.title}
                      initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-sm">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {featuredEvents.map((_, i) => (
                      <button key={i} onClick={() => setCarouselIdx(i)}
                        className={cn("h-1.5 rounded-full transition-all duration-300", i === carouselIdx ? "bg-white w-5" : "bg-white/40 w-1.5")} />
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <Badge color={catBadge(cur?.category)}>{cur?.category?.name ?? "Event"}</Badge>
                      <h3 className="font-bold text-white text-lg mt-2 leading-tight">{cur?.title}</h3>
                    </div>
                    <button className="p-2 rounded-xl bg-white/8 text-slate-400 hover:text-white hover:bg-white/12 transition-colors flex-shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{cur ? formatDate(cur.startsAt) : ""}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" />{cur?.location.split(",")[0]}</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">{cur?.registeredCount ?? 0}/{cur?.seatLimit ?? 0} registered</span>
                      <span className="font-semibold text-emerald-400">{remaining} seats left</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.round(((cur?.registeredCount || 0) / (cur?.seatLimit || 1)) * 100))}%` }} />
                    </div>
                  </div>
                  <button onClick={() => nav("login")}
                    className="w-full py-2.5 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors duration-200">
                    Register Now
                  </button>
                </div>
              </div>
              {/* Floating chips */}
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -top-5 -right-4 hidden lg:flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instant QR Pass</p>
                  <p className="text-[10px] text-slate-500">Upon registration</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65, duration: 0.4 }}
                className="absolute -bottom-4 -left-4 hidden lg:flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl">
                <div className="flex -space-x-2">
                  {["AJ", "BK", "CM"].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">{i}</div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">+{cur?.registeredCount ?? 0} registered</p>
                  <p className="text-[10px] text-slate-500">Join them today</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#0A1020] border-y border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {([
              [Users, "5,847", "Registered Students", "text-blue-400"],
              [Calendar, "342", "Total Events", "text-indigo-400"],
              [Activity, "89.3%", "Avg Attendance Rate", "text-emerald-400"],
              [Award, "24", "Organizers", "text-violet-400"],
            ] as [React.ElementType, string, string, string][]).map(([Icon, v, l, col]) => (
              <div key={l} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 flex-shrink-0">
                  <Icon className={cn("w-5 h-5", col)} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">{v}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="section-categories" className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Explore</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Event Categories</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Find events that match your interests</p>
            </div>
            <Btn variant="outline" size="sm" onClick={() => scrollTo("section-events")}>View All <ArrowRight className="w-4 h-4" /></Btn>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const v = categoryVisual(cat);
              return (
                <button key={cat.id} onClick={() => setShowCategoryModal(cat)}
                  className={cn("group flex flex-col items-center p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg", v.bg, v.border)}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110", v.bg, "shadow-sm")}>
                    <v.Icon className={cn("w-6 h-6", v.text)} />
                  </div>
                  <p className={cn("font-bold text-sm", v.text)}>{cat.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{cat.eventCount ?? 0} events</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ── */}
      <section id="section-events" className="py-20 bg-slate-50 dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Don&apos;t miss out</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Events</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Register before seats run out</p>
            </div>
            <Btn variant="outline" size="sm" onClick={() => nav("login")}>Browse All</Btn>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.slice(0, 3).map((e) => (
              <EventCard key={e.id} event={e} onView={() => nav("event-details", { eventId: e.id })} onRegister={() => nav("login")} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-12">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 30% 30%, white 0%, transparent 60%), radial-gradient(circle at 70% 70%, white 0%, transparent 60%)"
            }} />
            <div className="relative">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Join the community</p>
              <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Ready to start your<br />campus journey?</h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">Create your free account and access all campus events with instant QR registration.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => nav("signup")}
                  className="px-8 py-3.5 text-sm font-bold text-blue-700 rounded-2xl bg-white hover:bg-blue-50 shadow-xl transition-all duration-200">
                  Create Free Account
                </button>
                <button onClick={() => scrollTo("section-events")}
                  className="px-8 py-3.5 text-sm font-bold text-white rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200">
                  Browse Events First
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="section-about" className="bg-[#050B18] text-slate-500 py-14 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">UniEvents</span>
            </div>
            <p className="text-sm leading-relaxed">The official event management platform for our university campus community.</p>
          </div>
          {([["Quick Links", ["Browse Events", "My Registrations", "Calendar", "Profile"]], ["Support", ["Help Center", "Contact Us", "FAQ", "Privacy Policy"]]] as [string, string[]][]).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{title}</h4>
              <ul className="space-y-2.5 text-sm">
                {links.map((l) => <li key={l}><button className="hover:text-blue-400 transition-colors duration-200">{l}</button></li>)}
              </ul>
            </div>
          ))}
          <div id="section-contact">
            <h4 className="font-semibold text-white mb-4 text-sm">Stay Connected</h4>
            <div className="flex gap-2 mb-5">
              {([Globe, Mail, MessageCircle] as React.ElementType[]).map((Icon, i) => (
                <button key={i} className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 text-slate-500 hover:text-white transition-all duration-200"><Icon className="w-4 h-4" /></button>
              ))}
            </div>
            <p className="text-xs">© 2024 UniEvents. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Category Modal ── */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCategoryModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Grid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{showCategoryModal.name} Events</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Explore {showCategoryModal.name.toLowerCase()} activities on campus</p>
                </div>
              </div>
              <button onClick={() => setShowCategoryModal(null)} className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30 flex-1">
              {modalEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {modalEvents.map((e) => (
                    <EventCard key={e.id} event={e} compact onView={() => nav("event-details", { eventId: e.id })} onRegister={() => nav("login")} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-semibold text-slate-400">No upcoming events in this category.</p>
                  <p className="text-sm text-slate-400 mt-1">Check back later for new events.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
