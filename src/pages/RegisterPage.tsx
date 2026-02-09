import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const success = await register(email, password, name);
    setIsLoading(false);

    if (success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error('Email already exists');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
        <img
          src="https://images.unsplash.com/photo-1617994452722-4145e196248b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MjQyMTd8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHNvdW5kJTIwd2F2ZSUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc2NzY3NDQ3MXww&ixlib=rb-4.1.0&q=85"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold bg-active-frequency bg-clip-text text-transparent mb-2">
              ALCHEWAT Pulse
            </h1>
            <p className="text-muted-foreground">Create your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-11 px-4 text-white placeholder:text-white/20 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-11 px-4 text-white placeholder:text-white/20 transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-11 px-4 text-white placeholder:text-white/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-lg h-11 px-4 text-white placeholder:text-white/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3 font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
