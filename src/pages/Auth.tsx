import { useState } from 'react';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Smartphone, 
  Shield, 
  User, 
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthView = 'select' | 'manager-login' | 'employee-login' | 'signup';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>('select');
  const [signupRole, setSignupRole] = useState<AppRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(email, password, fullName, signupRole);
    if (err) {
      setError(err);
    } else {
      setSuccess('Account created! Check your email to verify, then sign in.');
      setView(signupRole === 'manager' ? 'manager-login' : 'employee-login');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setSuccess(null);
  };

  // Portal selection screen
  if (view === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/30 flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-primary tracking-wider">SECURE ACCESS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
            Grand Hotel
          </h1>
          <p className="text-lg text-muted-foreground">
            Dispatch Management System
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Manager Portal */}
          <button
            onClick={() => { resetForm(); setView('manager-login'); }}
            className="group text-left"
          >
            <Card className="h-full bg-card/50 border-border/50 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/5">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <LayoutDashboard className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground mb-1">
                    Management Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Full access to dispatch dashboard, zone map, worker management, and analytics.
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                  MANAGER ACCESS
                </Badge>
              </CardContent>
            </Card>
          </button>

          {/* Employee Portal */}
          <button
            onClick={() => { resetForm(); setView('employee-login'); }}
            className="group text-left"
          >
            <Card className="h-full bg-card/50 border-border/50 hover:border-info/40 hover:bg-card/80 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-info/5">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <Smartphone className="w-7 h-7 text-info" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground mb-1">
                    Employee Portal
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    View and respond to assigned tasks, real-time notifications, and shift status.
                  </p>
                </div>
                <Badge variant="outline" className="border-info/30 text-info text-[10px]">
                  EMPLOYEE ACCESS
                </Badge>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-muted-foreground/60 font-mono">
          Dispatch v4.0 · Secure Authentication Required
        </p>
      </div>
    );
  }

  // Login or Signup form
  const isSignup = view === 'signup';
  const isManager = view === 'manager-login' || (isSignup && signupRole === 'manager');
  const accentColor = isManager ? 'primary' : 'info';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/30 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/60 border-border/50 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <button
            onClick={() => { resetForm(); setView('select'); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isManager ? 'bg-primary/10 border border-primary/20' : 'bg-info/10 border border-info/20'
            )}>
              {isManager
                ? <LayoutDashboard className="w-5 h-5 text-primary" />
                : <Smartphone className="w-5 h-5 text-info" />
              }
            </div>
            <div>
              <CardTitle className="font-display text-lg">
                {isSignup ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isManager ? 'Management Dashboard' : 'Employee Portal'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
              {success}
            </div>
          )}

          <form onSubmit={isSignup ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Smith"
                    className="pl-10 bg-secondary/50 border-border/50"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@hotel.com"
                className="bg-secondary/50 border-border/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 bg-secondary/50 border-border/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11',
                !isManager && 'bg-info hover:bg-info/90 text-info-foreground'
              )}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignup ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {isSignup ? (
              <button
                onClick={() => {
                  setView(signupRole === 'manager' ? 'manager-login' : 'employee-login');
                  setError(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? <span className={cn(isManager ? 'text-primary' : 'text-info')}>Sign in</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSignupRole(isManager ? 'manager' : 'employee');
                  setView('signup');
                  setError(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Don't have an account? <span className={cn(isManager ? 'text-primary' : 'text-info')}>Sign up</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
