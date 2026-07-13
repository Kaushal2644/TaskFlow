import { useState } from "react";
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap} from 'lucide-react'

const Login = () => {
    const navigate = useNavigate();
    const { login } =   useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    //Input Change Handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        //Clear Error on change
        if(errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}));
        }
    };

    //Validation
    const validate = () => {
        const newErrors = {};
        if(!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        else if(!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Enter valid email address';
        }

        if(!formData.password) {
            newErrors.password = 'Password is required';
        }
        else if(formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    }

    //Submit 
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if(Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            await login(formData.email, formData.password);
            toast.success('Welcome back');
            navigate('/');
        } catch (err) {
            const message = err.response?.data?.message || 'Login Failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    //Quick fill for demo
    const fillDemo = () => {
        setFormData({
            email: 'kaushalpatel2506@gmail.com',
            password: 'kaushal'
        });
        setErrors({});
    };

    return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">TaskFlow</h1>
            <span className="text-xs text-primary font-medium">Pro</span>
          </div>
        </div>

        {/* ── Card ─────────────────────────────────────── */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              Welcome back
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Sign in to your TaskFlow account
            </p>
          </div>

          {/* ── Form ─────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 
                                 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input pl-10 ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 
                                 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${
                    errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                             text-text-muted hover:text-text-secondary 
                             transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white 
                                  border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* ── Footer ───────────────────────────────── */}
          <p className="text-center text-text-secondary text-sm mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-light 
                         font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;