
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { signIn, signInWithMagicLink } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { user, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        if (signInError.includes("Email not confirmed")) {
          setError("Please check your email and confirm your account before logging in.");
        } else {
          setError(signInError);
        }
      } else if (user) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { success, error: magicLinkError } = await signInWithMagicLink(email);
      
      if (success) {
        setMagicLinkSent(true);
        toast({
          title: "Magic link sent",
          description: "Check your email for the login link",
        });
      } else {
        setError(magicLinkError || "Failed to send magic link. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // This would typically call a function to resend the verification email
    // For now we'll just use the magic link functionality as it accomplishes a similar goal
    await handleMagicLink();
    toast({
      title: "Verification email sent",
      description: "Please check your email to confirm your account",
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">Enter your email and password to access your account</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
                
                {error.includes("confirm your account") && (
                  <Button 
                    variant="link" 
                    className="px-0 mt-2 text-sm font-medium h-auto"
                    type="button"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </Alert>
            )}
            
            {magicLinkSent ? (
              <div className="text-center py-4">
                <p className="mb-4">Magic link sent! Check your email to continue.</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setMagicLinkSent(false)}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m.jackson@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button 
                      variant="link" 
                      className="px-0 text-sm font-medium h-auto"
                      type="button"
                      onClick={() => navigate('/reset-password')}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input 
                    id="password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleMagicLink}
                    disabled={loading || !email}
                  >
                    {loading ? "Sending..." : "Magic Link"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          
          {!magicLinkSent && (
            <CardFooter className="flex flex-col">
              <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="px-0 text-sm font-medium h-auto"
                  type="button" 
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </div>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
