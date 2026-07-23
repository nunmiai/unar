import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Home, Shield } from "lucide-react";

const AUTH_API = "https://hxr7qp46qicsvrlnale5v7z34m0crgjm.lambda-url.us-east-1.on.aws";
const COGNITO_DOMAIN = "https://us-east-1qfevieihb.auth.us-east-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "4io9ol0ji9jnntorf2h5q4l3pn";

function getRedirectUri() {
  if (typeof window === "undefined") return "https://www.unar.in/login";
  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? `${window.location.origin}/login` : "https://www.unar.in/login";
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);

  // Processing overlay state for Google OAuth callback & auth transitions
  const [processing, setProcessing] = useState({
    visible: false,
    title: "Signing you in",
    subtitle: "Verifying your Google account...",
    done: false,
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [verifyForm, setVerifyForm] = useState({ code: "" });

  const handleLoginChange = (e) => setLoginForm((f) => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const handleSignupChange = (e) => setSignupForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Handle Cognito Google OAuth redirect & existing session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      toast.error(urlParams.get("error_description") || "Google sign-in was cancelled");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setProcessing({
        visible: true,
        title: "Signing you in",
        subtitle: "Verifying your Google account...",
        done: false,
      });

      const redirectUri = getRedirectUri();

      (async () => {
        try {
          const tokenRes = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: COGNITO_CLIENT_ID,
              code: code,
              redirect_uri: redirectUri,
            }),
          });
          const tokens = await tokenRes.json();

          if (tokens.error) {
            toast.error(tokens.error_description || "Google sign-in failed");
            setProcessing((p) => ({ ...p, visible: false }));
            return;
          }

          const userInfoRes = await fetch(`${COGNITO_DOMAIN}/oauth2/userInfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const userInfo = await userInfoRes.json();

          const userData = {
            cognito_user_id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split("@")[0],
            email_verified: userInfo.email_verified,
          };

          localStorage.setItem("unarUser", JSON.stringify(userData));
          localStorage.setItem(
            "unarTokens",
            JSON.stringify({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              id_token: tokens.id_token,
              expires_in: tokens.expires_in,
            })
          );

          try {
            await fetch(`${AUTH_API}/google-user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cognito_user_id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split("@")[0],
              }),
            });
          } catch (e) {
            console.warn("Failed to sync Google user to DB:", e);
          }

          const firstName = (userData.name || "").split(" ")[0];
          setProcessing({
            visible: true,
            title: `Welcome, ${firstName}!`,
            subtitle: "You're all set. Taking you home...",
            done: true,
          });

          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } catch (err) {
          console.error("OAuth token exchange error:", err);
          setProcessing((p) => ({ ...p, visible: false }));
          toast.error("Google sign-in failed. Please try again.");
        }
      })();
      return;
    }

    // Check if already logged in
    const storedTokens = JSON.parse(localStorage.getItem("unarTokens") || "{}");
    if (storedTokens.access_token) {
      fetch(`${AUTH_API}/get-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: storedTokens.access_token }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            window.location.href = "/";
          } else {
            localStorage.removeItem("unarUser");
            localStorage.removeItem("unarTokens");
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("unarUser", JSON.stringify(data.user));
        localStorage.setItem("unarTokens", JSON.stringify(data.tokens || {}));
        toast.success("Signed in successfully!");
        window.location.href = "/";
      } else {
        if (data.code === "USER_NOT_CONFIRMED" || (data.error && data.error.includes("not confirmed"))) {
          setPendingEmail(loginForm.email.trim());
          setPendingUserId(data.user_id || data.cognito_user_id || null);
          setVerifyMode(true);
          toast.error("Please verify your email first.");
        } else {
          toast.error(data.error || data.message || "Invalid credentials");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupForm.name.trim(),
          email: signupForm.email.trim(),
          phone: signupForm.phone.trim(),
          password: signupForm.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingEmail(signupForm.email.trim());
        setPendingUserId(data.user_id || data.cognito_user_id || null);
        setVerifyMode(true);
        toast.success("Account created! Please check your email for the verification code.");
      } else {
        toast.error(data.error || data.message || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bodyPayload = { email: pendingEmail, code: verifyForm.code.trim() };
      if (pendingUserId) bodyPayload.user_id = pendingUserId;

      const res = await fetch(`${AUTH_API}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email verified! You can now sign in.");
        setVerifyMode(false);
        setActiveTab("login");
      } else {
        toast.error(data.error || data.message || "Invalid verification code");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUri = getRedirectUri();
    const authUrl =
      `${COGNITO_DOMAIN}/oauth2/authorize?` +
      `client_id=${COGNITO_CLIENT_ID}` +
      `&response_type=code` +
      `&scope=openid+email` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&identity_provider=Google`;

    window.location.href = authUrl;
  };

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <>
      <Head>
        <title>Login | Unar - Natural Solid Perfumes</title>
        <meta name="description" content="Sign in or create your Unar account" />
      </Head>

      {/* Fullscreen Processing Overlay (shown during Google OAuth callback & auth transitions) */}
      {processing.visible && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-6 max-w-sm">
            <img
              src="/assets/website_assets/mockups/logo_tagline.png"
              alt="UNAR - Natural Solid Perfumes"
              className="w-[240px] h-auto object-contain select-none"
            />

            {processing.done ? (
              <div className="w-16 h-16 rounded-full border-2 border-[#295c47] flex items-center justify-center text-[#295c47] transition-all">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-4 border-[#295c47]/20 border-t-[#295c47] animate-spin" />
            )}

            <div>
              <p className="font-['Cormorant_Garamond'] text-2xl font-medium text-[#295c47]">
                {processing.title}
              </p>
              <p className="text-xs text-[#5a5a5a] mt-1">{processing.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Home button */}
      <Link href="/" className="fixed top-5 right-[400px] z-50 hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-[#295c47] shadow hover:bg-[#faf8f5] hover:-translate-y-px transition-all">
        <Home size={15} />
        Home
      </Link>

      <div className="flex min-h-screen">
        {/* Left brand panel */}
        <div className="hidden md:flex w-[42%] flex-shrink-0 relative overflow-hidden flex-col items-center justify-center px-12 py-16 bg-[#ffffff]">
          {/* Decorative circles */}

          <div className="text-center text-[#295c47] relative z-10 flex flex-col items-center">
            <img
              src="/assets/website_assets/mockups/logo_tagline.png"
              alt="UNAR - Natural Solid Perfumes"
              className="w-[260px] h-auto object-contain mb-9 select-none"
            />
            <div className="w-9 h-px bg-[#295c47]/30 mx-auto mb-7" />
            <p className="text-[14px] leading-[1.9] text-[#295c47]/80 max-w-[280px] mx-auto font-medium">A sensory brand dedicated to the art of awakening. We bridge the gap between ancient heritage and modern mindfulness through intentional, handcrafted rituals.</p>
            <div className="inline-flex items-center gap-1.5 mt-10 bg-[#295c47]/8 border border-[#295c47]/15 rounded-full px-[18px] py-2 text-[11px] tracking-wide text-[#295c47]/90 font-semibold">
              <Shield size={12} className="text-[#295c47]" />
              100% Natural · Cruelty Free
            </div>
          </div>

          <Link href="/" className="mt-8 flex items-center gap-2 text-[#295c47]/70 hover:text-[#295c47] text-sm font-semibold transition-colors relative z-10">
            ← Back to Home
          </Link>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-6 overflow-y-auto">
          <div className="w-full max-w-[420px]">
            {/* Mobile home link */}
            <Link href="/" className="flex md:hidden items-center gap-2 text-[#295c47] mb-6 text-sm font-medium">
              <Home size={15} /> Back to Home
            </Link>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 pb-0">
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-medium text-[#2c2c2c] text-center mb-7">
                  {verifyMode ? "Verify Email" : "Welcome Back"}
                </h2>

                {!verifyMode && (
                  <div className="flex bg-[#faf8f5] rounded-lg p-1 mb-7">
                    {["login", "signup"].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-md text-[14px] font-medium transition-all capitalize ${activeTab === tab ? "bg-white text-[#295c47] shadow-sm" : "text-[#5a5a5a]"}`}>
                        {tab === "login" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Verify form */}
                {verifyMode && (
                  <form onSubmit={handleVerify} className="space-y-5">
                    <p className="text-center text-[#5a5a5a] text-sm mb-5">We&apos;ve sent a verification code to <strong>{pendingEmail}</strong>. Please enter it below.</p>
                    <div>
                      <Label htmlFor="verifyCode" className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">Verification Code</Label>
                      <Input id="verifyCode" placeholder="Enter 6-digit code" maxLength={6} required value={verifyForm.code} onChange={(e) => setVerifyForm({ code: e.target.value })} className="border-gray-200 focus:border-[#295c47]" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg bg-gradient-to-br from-[#295c47] to-[#4a6b55] text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-70 disabled:transform-none">
                      {loading ? "Verifying..." : "Verify Email"}
                    </button>
                  </form>
                )}

                {/* Login form */}
                {!verifyMode && activeTab === "login" && (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <Label htmlFor="loginEmail" className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">Email Address</Label>
                      <Input id="loginEmail" name="email" type="email" required placeholder="Enter your email" value={loginForm.email} onChange={handleLoginChange} className="border-gray-200 focus:border-[#295c47]" />
                    </div>
                    <div>
                      <Label htmlFor="loginPassword" className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">Password</Label>
                      <div className="relative">
                        <Input id="loginPassword" name="password" type={showLoginPwd ? "text" : "password"} required placeholder="Enter your password" value={loginForm.password} onChange={handleLoginChange} className="border-gray-200 focus:border-[#295c47] pr-10" />
                        <button type="button" onClick={() => setShowLoginPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showLoginPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <label className="flex items-center gap-2 text-[#5a5a5a] cursor-pointer">
                        <input type="checkbox" name="remember" checked={loginForm.remember} onChange={handleLoginChange} className="w-4 h-4 accent-[#295c47]" />
                        Remember me
                      </label>
                      <button type="button" className="text-[#295c47] font-medium hover:underline bg-transparent border-none cursor-pointer">Forgot Password?</button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg bg-gradient-to-br from-[#295c47] to-[#4a6b55] text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-70">
                      {loading ? "Signing in..." : "Sign In"}
                    </button>
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-gray-200" /><span className="text-[13px] text-gray-400">or continue with</span><div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg border border-gray-200 text-[#2c2c2c] text-[14px] font-medium hover:bg-[#faf8f5] transition-colors">
                      <GoogleIcon /> Continue with Google
                    </button>
                  </form>
                )}

                {/* Signup form */}
                {!verifyMode && activeTab === "signup" && (
                  <form onSubmit={handleSignup} className="space-y-5">
                    {[
                      { id: "signupName", name: "name", label: "Full Name", type: "text", placeholder: "Enter your full name", value: signupForm.name },
                      { id: "signupEmail", name: "email", label: "Email Address", type: "email", placeholder: "Enter your email", value: signupForm.email },
                      { id: "signupPhone", name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter your phone number", value: signupForm.phone },
                    ].map(({ id, name, label, type, placeholder, value }) => (
                      <div key={id}>
                        <Label htmlFor={id} className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">{label}</Label>
                        <Input id={id} name={name} type={type} required placeholder={placeholder} value={value} onChange={handleSignupChange} className="border-gray-200 focus:border-[#295c47]" />
                      </div>
                    ))}
                    <div>
                      <Label htmlFor="signupPassword" className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">Password</Label>
                      <div className="relative">
                        <Input id="signupPassword" name="password" type={showSignupPwd ? "text" : "password"} required minLength={8} placeholder="Create a password" value={signupForm.password} onChange={handleSignupChange} className="border-gray-200 focus:border-[#295c47] pr-10" />
                        <button type="button" onClick={() => setShowSignupPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showSignupPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">Confirm Password</Label>
                      <div className="relative">
                        <Input id="confirmPassword" name="confirmPassword" type={showConfirmPwd ? "text" : "password"} required placeholder="Confirm your password" value={signupForm.confirmPassword} onChange={handleSignupChange} className="border-gray-200 focus:border-[#295c47] pr-10" />
                        <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg bg-gradient-to-br from-[#295c47] to-[#4a6b55] text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-70">
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-gray-200" /><span className="text-[13px] text-gray-400">or continue with</span><div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg border border-gray-200 text-[#2c2c2c] text-[14px] font-medium hover:bg-[#faf8f5] transition-colors">
                      <GoogleIcon /> Continue with Google
                    </button>
                  </form>
                )}
              </div>

              <div className="px-8 py-5 border-t border-[#f5f0e8] text-center text-[13px] text-[#5a5a5a]">
                {activeTab === "login"
                  ? <p>Don&apos;t have an account? <button className="text-[#295c47] font-medium hover:underline bg-transparent border-none cursor-pointer" onClick={() => setActiveTab("signup")}>Sign up</button></p>
                  : <p>Already have an account? <button className="text-[#295c47] font-medium hover:underline bg-transparent border-none cursor-pointer" onClick={() => setActiveTab("login")}>Sign in</button></p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}