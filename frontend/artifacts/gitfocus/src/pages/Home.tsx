import { useState } from "react";
import { motion } from "framer-motion";
import { easeInOut } from "framer-motion";
import {
  ArrowRight, Filter, Folders, LayoutDashboard, Settings,
  AlertTriangle, Clock, TerminalSquare, GitPullRequest, MessageSquare, Target,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { SignInModal } from "@/components/SignInModal";
import { PixelSprite } from "@/components/PixelSprite";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeInOut } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      <Header onGetStarted={() => setSignInOpen(true)} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />

      <main className="relative z-10">

        {/* ── HERO SECTION ─────────────────────────────────────────── */}
        <section className="relative pt-40 pb-24 md:pt-52 md:pb-36 border-b border-white/5 overflow-hidden">
          {/* Sprites in empty side margins */}
          <div className="absolute hidden xl:flex flex-col items-center gap-8 bottom-10 left-6">
            <PixelSprite type="bunny" size={6} className="animate-bob" />
            <PixelSprite type="heart" size={5} className="animate-pulse-soft" />
          </div>
          <div className="absolute hidden xl:flex flex-col items-center gap-8 bottom-10 right-6">
            <PixelSprite type="frog" size={6} className="animate-bob-slow" />
            <PixelSprite type="pacman" size={5} className="animate-bob-fast" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp}
              className="text-5xl sm:text-7xl md:text-8xl font-display font-bold tracking-tighter max-w-5xl leading-[1.1] mb-8"
            >
              Cut Through the GitHub{" "}
              <span
                className="glitch-noise text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40"
                data-text="Noise"
              >
                Noise
              </span>
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" variants={fadeUp}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
            >
              GitSense filters your notifications intelligently — so you only see the pull requests
              and issues that truly matter.
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => setSignInOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                Start Here <ArrowRight size={20} />
              </button>
              <a
                href="#how-it-works"
                onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-lg"
              >
                See How It Works
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES SECTION ─────────────────────────────────────── */}
        <section id="features" className="relative py-24 border-t border-white/5 overflow-hidden">
          {/* Sprites */}
          <div className="absolute hidden xl:block top-16 left-6">
            <PixelSprite type="bunny" size={6} className="animate-bob-slow" />
          </div>
          <div className="absolute hidden xl:block top-1/2 right-6 -translate-y-1/2">
            <PixelSprite type="frog" size={6} className="animate-bob" />
          </div>
          <div className="absolute hidden xl:block bottom-16 right-6">
            <PixelSprite type="pacman" size={5} className="animate-bob-fast" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Everything you need to stay focused
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Stop drowning in bot updates. Start shipping.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { icon: Filter, title: "Smart Filtering", desc: "Zero noise. Just mentions, assignments, and priority labels from GitHub that actually need your attention." },
                { icon: Folders, title: "Repository Tracking", desc: "Select only the specific repositories that matter to your daily workflow." },
                { icon: LayoutDashboard, title: "PR & Issue Dashboard", desc: "A clean, prioritized view of open pull requests and issues needing your attention." },
                { icon: Settings, title: "Custom Rules", desc: "Set granular notification rules for mentions, assignments, and priority labels." },
                { icon: AlertTriangle, title: "Missed Issue Detection", desc: "Never miss a critical bug or tagged issue that slipped through your email." },
                { icon: Clock, title: "Priority Engine", desc: "Automatically ranks issues and pull requests so you always know what to work on next." },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="p-8 rounded-2xl bg-card border border-border hover:border-white/30 transition-colors group glow-hover"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section id="how-it-works" className="relative py-24 border-t border-white/5 overflow-hidden">
          {/* Sprites */}
          <div className="absolute hidden xl:block top-1/2 left-6 -translate-y-1/2">
            <PixelSprite type="heart" size={6} className="animate-pulse-soft" />
          </div>
          <div className="absolute hidden xl:block top-1/2 right-6 -translate-y-1/2">
            <PixelSprite type="pacman" size={6} className="animate-bob" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Simple setup. Immediate clarity.
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get back your focus in less than three minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {[
                { num: "01", title: "Connect GitHub", desc: "Link your account securely with one click. Read-only access to what matters." },
                { num: "02", title: "Select Repositories", desc: "Choose exactly which repositories you want to track and ignore the rest entirely." },
                { num: "03", title: "Stay Focused", desc: "Your dashboard populates instantly with only the items requiring your action." },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-black border-2 border-white rounded-full flex items-center justify-center text-xl font-display font-bold mb-8 relative z-10">
                    {step.num}
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DASHBOARD PREVIEW ─────────────────────────────────────── */}
        <section id="preview" className="relative py-24 border-t border-white/5 overflow-hidden">
          {/* Sprites */}
          <div className="absolute hidden xl:block top-1/2 left-6 -translate-y-1/2">
            <PixelSprite type="bunny" size={6} className="animate-bob" />
          </div>
          <div className="absolute hidden xl:block top-1/2 right-6 -translate-y-1/2">
            <PixelSprite type="frog" size={6} className="animate-bob-slow" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Your workflow, simplified
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl">
                This is what zero notification anxiety looks like.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-white/5 overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
              <div className="hidden md:flex w-64 border-r border-white/5 bg-[#050505] flex-col p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                  <span className="font-display font-bold">GitSense</span>
                </div>
                <div className="space-y-1">
                  <div className="px-3 py-2 bg-white/10 rounded-lg text-white font-medium flex items-center gap-2 text-sm">
                    <LayoutDashboard size={16} /> Needs Action
                    <span className="ml-auto bg-white text-black px-1.5 rounded-md text-xs font-bold">6</span>
                  </div>
                  <div className="px-3 py-2 text-white/50 hover:bg-white/5 hover:text-white rounded-lg font-medium flex items-center gap-2 text-sm transition-colors">
                    <Clock size={16} /> Waiting on Others
                  </div>
                  <div className="px-3 py-2 text-white/50 hover:bg-white/5 hover:text-white rounded-lg font-medium flex items-center gap-2 text-sm transition-colors">
                    <TerminalSquare size={16} /> Repositories
                  </div>
                  <div className="px-3 py-2 text-white/50 hover:bg-white/5 hover:text-white rounded-lg font-medium flex items-center gap-2 text-sm transition-colors">
                    <Filter size={16} /> Custom Rules
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between">
                  <h3 className="font-display font-bold text-lg">Needs Action</h3>
                  <div className="h-8 w-64 bg-white/5 border border-white/10 rounded-lg flex items-center px-3">
                    <span className="text-xs text-white/30">Search PRs, issues...</span>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-hidden flex flex-col gap-3">
                  {[
                    { title: "Fix hydration mismatch in Header component", repo: "frontend-core", icon: GitPullRequest, type: "PR #142", status: "Needs Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
                    { title: "Add rate limiting to public API endpoints", repo: "backend-api", icon: AlertTriangle, type: "Issue #89", status: "Overdue", color: "bg-red-500/10 text-red-500 border-red-500/20" },
                    { title: "Update dependency: framer-motion to v11", repo: "frontend-core", icon: GitPullRequest, type: "PR #140", status: "Mentioned", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                    { title: "Design system color tokens audit", repo: "design-system", icon: MessageSquare, type: "Discussion", status: "Stale", color: "bg-white/10 text-white/70 border-white/20" },
                  ].map((item, i) => (
                    <div key={i} className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-start gap-4">
                      <div className="mt-1 text-white/40 group-hover:text-white/80 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-mono text-white/40">{item.repo}</span>
                          <span className="text-xs font-mono text-white/20">•</span>
                          <span className="text-xs font-mono text-white/40">{item.type}</span>
                        </div>
                        <h4 className="font-medium text-white/90 text-base">{item.title}</h4>
                      </div>
                      <div className={`px-2.5 py-1 rounded-md border text-xs font-medium ${item.color}`}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ SECTION ──────────────────────────────────────────── */}
        <section id="faq" className="relative py-24 border-t border-white/5 overflow-hidden">
          {/* Sprites */}
          <div className="absolute hidden xl:block top-1/2 left-6 -translate-y-1/2">
            <PixelSprite type="heart" size={6} className="animate-pulse-soft" />
          </div>
          <div className="absolute hidden xl:block top-1/2 right-6 -translate-y-1/2">
            <PixelSprite type="bunny" size={6} className="animate-bob-slow" />
          </div>

          <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Let’s Clear Things Up 
              </h2>
            </div>
            <Accordion items={[
              { id: "faq-1", question: "Does GitSense work with private repositories?", answer: "Yes. GitSense requires authorized access to your GitHub account to read private repository data. However, we only store metadata (issue IDs, titles, status) necessary to run the dashboard. We never clone or store your actual source code." },
              { id: "faq-2", question: "What GitHub permissions does it need?", answer: "We request the minimal 'repo' scope for reading issue and PR metadata, and 'read:org' if you want to track organization repositories. We do not require write access to your repositories." },
              { id: "faq-3", question: "Can I filter notifications by label?", answer: "Absolutely. With custom rules, you can prioritize notifications based on specific labels like 'urgent', 'bug', or 'needs-review', while muting others like 'wontfix' or 'duplicate'." },
              { id: "faq-4", question: "Is there a mobile app?", answer: "Currently, GitSense is a responsive web application that works great on mobile browsers. A dedicated native iOS and Android app with push notifications is on our roadmap." },
              { id: "faq-5", question: "How is this different from GitHub's built-in notifications?", answer: "GitHub’s default inbox works like email — everything flows chronologically. GitSense keeps your workflow clean, so you stay focused without being pulled into every discussion." },
            ]} />
          </div>
        </section>

        {/* ── CTA SECTION ──────────────────────────────────────────── */}
        <section className="relative py-32 border-t border-white/5 text-center overflow-hidden">
          {/* Sprites scattered around the CTA */}
          <div className="absolute hidden xl:block top-10 left-6">
            <PixelSprite type="pacman" size={5} className="animate-bob-fast" />
          </div>
          <div className="absolute hidden xl:block top-10 right-6">
            <PixelSprite type="heart" size={5} className="animate-pulse-soft" />
          </div>
          <div className="absolute hidden xl:block bottom-10 left-6">
            <PixelSprite type="bunny" size={6} className="animate-bob" />
          </div>
          <div className="absolute hidden xl:block bottom-10 right-6">
            <PixelSprite type="frog" size={6} className="animate-bob-slow" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-6 tracking-tight">
              Stop drowning in notifications.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Join developers who ship faster by focusing on less. Connect your GitHub in seconds.
            </p>
            <button
              onClick={() => setSignInOpen(true)}
              className="px-10 py-5 bg-white text-black text-xl font-bold rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Get Started 
            </button>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
