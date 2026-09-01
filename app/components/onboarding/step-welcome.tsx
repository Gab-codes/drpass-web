import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/store/onboarding-store";

interface StepWelcomeProps {
  onNext: () => void;
  defaultName: string; // The name from the user's registration
}

export function StepWelcome({ onNext, defaultName }: StepWelcomeProps) {
  const { setPreferredName } = useOnboardingStore();
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [nickname, setNickname] = useState("");
  const [displayedText, setDisplayedText] = useState("");

  const fullText =
    "Hi! Welcome to DrPass. I'm Gaby, your study companion. What should I call you?";

  // Typewriter effect (doesn't block interaction)
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Fast enough to be subtle, not annoying

    return () => clearInterval(interval);
  }, []);

  const handleUseDefaultName = () => {
    setPreferredName(defaultName);
    onNext();
  };

  const handleUseNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setPreferredName(nickname.trim());
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground min-h-20">
          {displayedText}
        </h1>
      </div>

      <div className="space-y-4 pt-4">
        <AnimatePresence mode="wait">
          {!showNicknameInput ? (
            <motion.div
              key="choices"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start text-base h-12"
                onClick={handleUseDefaultName}
              >
                Use my name ({defaultName})
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start text-base h-12"
                onClick={() => setShowNicknameInput(true)}
              >
                I'd prefer a nickname
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <form onSubmit={handleUseNickname} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="nickname"
                    className="text-sm font-medium text-foreground"
                  >
                    Your preferred name
                  </label>
                  <Input
                    id="nickname"
                    autoFocus
                    className="h-12 text-base"
                    placeholder="Enter nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="h-12"
                    onClick={() => setShowNicknameInput(false)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 h-12"
                    disabled={!nickname.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
