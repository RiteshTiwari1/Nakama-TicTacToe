import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type Mode = "login" | "signup";

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-2 bg-red-500/10 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/lobby", { replace: true });
    return null;
  }

  const clearErrors = () => {
    setError("");
    setEmailError("");
  };

  const validate = (): string | null => {
    if (mode === "signup") {
      const trimmed = displayName.trim();
      if (!trimmed) return "Display name is required";
      if (trimmed.length < 2) return "Display name must be at least 2 characters";
      if (trimmed.length > 20) return "Display name must be 20 characters or less";
    }

    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email";

    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";

    return null;
  };

  const isPasswordError = error.toLowerCase().includes("password") || error.toLowerCase().includes("incorrect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        await signup(email.trim(), password, displayName.trim());
        navigate("/lobby");
      } else {
        await login(email.trim(), password);
        navigate("/lobby");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      if (msg.startsWith("EMAIL_EXISTS:")) {
        setEmailError(msg.replace("EMAIL_EXISTS:", ""));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    clearErrors();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-orange-200/80 mb-3">
            Nakama Multiplayer
          </p>
          <h1 className="text-5xl font-black text-white mb-2 leading-none">
            Gridlock <span className="text-orange-200">Arena</span>
          </h1>
          <p className="text-zinc-400">Server-authoritative Tic-Tac-Toe</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex mb-6 bg-black/30 rounded-2xl p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => { setMode("signup"); clearErrors(); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              mode === "signup"
                ? "bg-orange-300 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); clearErrors(); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              mode === "login"
                ? "bg-orange-300 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name - only for signup */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  clearErrors();
                }}
                placeholder="What should others call you?"
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white
                  placeholder-zinc-500 focus:outline-none focus:border-orange-200 focus:ring-1
                  focus:ring-orange-200 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Visible to other players. Doesn't need to be unique.</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              placeholder="you@example.com"
              autoFocus={mode === "login"}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white
                placeholder-zinc-500 focus:outline-none transition-colors bg-black/30
                ${emailError || (error && error.toLowerCase().includes("email"))
                  ? "border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-white/10 focus:border-orange-200 focus:ring-1 focus:ring-orange-200"
                }`}
            />
            {emailError && <InlineError message={emailError} />}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              placeholder="Min 8 characters"
              className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white
                placeholder-zinc-500 focus:outline-none transition-colors bg-black/30
                ${isPasswordError
                  ? "border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-white/10 focus:border-orange-200 focus:ring-1 focus:ring-orange-200"
                }`}
            />
            {isPasswordError && <InlineError message={error} />}
          </div>

          {/* General Error Message - only show if not already shown inline */}
          {error && !isPasswordError && !error.toLowerCase().includes("email") && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-300 hover:bg-orange-200 disabled:bg-zinc-700
              text-zinc-950 font-black rounded-2xl transition-colors disabled:cursor-not-allowed
              text-lg shadow-lg shadow-orange-950/20"
          >
            {loading
              ? mode === "signup" ? "Creating account..." : "Logging in..."
              : mode === "signup" ? "Create Account" : "Log In"
            }
          </button>
        </form>

        {/* Switch Mode */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={switchMode}
            className="text-orange-200 hover:text-orange-100 font-medium transition-colors"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
