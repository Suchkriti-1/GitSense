import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckSquare, Github } from "lucide-react";
import { useAuth } from "@/App";
import { useLocation } from "wouter";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();

  const handleSignIn = () => {
    signIn();
    onClose();
    navigate("/dashboard");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black"
            >
              {/* Header */}
              <div className="relative p-8 pb-6 border-b border-white/5">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mb-6">
                  <span className="font-display font-bold text-2xl text-white">GitSense</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Welcome back</h2>
                <p className="text-white/50 text-sm">Sign in to access your dashboard and stay focused.</p>
              </div>

              {/* Sign-in options */}
              <div className="p-8 space-y-3">
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-white/95 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Github size={22} className="shrink-0" />
                  <span className="flex-1 text-left">Continue with GitHub</span>
                  <ArrowRight size={18} className="text-black/40 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Features reminder */}
              <div className="px-8 pb-8">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                  <p className="text-white/30 text-xs font-mono uppercase tracking-wider mb-3">What you get</p>
                  <div className="space-y-2">
                    {[
                      "Smart notification filtering",
                      "PR & issue dashboard",
                      "Custom rules & reminders",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckSquare size={14} className="text-white/40 shrink-0" />
                        <span className="text-white/60 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
