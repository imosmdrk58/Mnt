import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Database, User, Settings, AlertCircle, Loader2, CreditCard, Image } from "lucide-react";
// Removed import of apiRequest since we're using fetch directly

const setupSchema = z.object({
  databaseUrl: z.string().min(1, "Database URL is required"),
  siteName: z.string().min(1, "Site name is required"),
  adminUsername: z.string().min(3, "Username must be at least 3 characters"),
  adminEmail: z.string().email("Valid email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  // Optional Stripe configuration
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  // Optional branding
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface SetupStatus {
  isSetup: boolean;
  config?: any;
}

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [installationComplete, setInstallationComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Check setup status
  const { data: setupStatus, refetch: refetchStatus } = useQuery<SetupStatus>({
    queryKey: ['/api/setup/status'],
    refetchInterval: false,
  });

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      databaseUrl: "",
      siteName: "MangaVerse",
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
      stripePublicKey: "",
      stripeSecretKey: "",
      logoUrl: "",
      faviconUrl: "",
    },
  });

  // Database validation mutation
  const validateDbMutation = useMutation({
    mutationFn: async (databaseUrl: string) => {
      const response = await fetch("/api/setup/validate-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      return response.json();
    },
  });

  // Add debug helper
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Installation mutation
  const installMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      addDebugInfo("Starting installation request...");
      
      const requestBody = {
        databaseUrl: data.databaseUrl,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword
      };
      
      addDebugInfo(`Request body: ${JSON.stringify(requestBody, null, 2)}`);
      
      const response = await fetch("/api/setup/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      addDebugInfo(`Response status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      addDebugInfo(`Response text: ${responseText}`);
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        addDebugInfo(`Failed to parse JSON: ${e}`);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    },
    onSuccess: (result: any) => {
      addDebugInfo(`Installation result: ${JSON.stringify(result)}`);
      if (result.success) {
        setInstallationComplete(true);
        
        // Aggressively poll status until setup is complete
        const pollInterval = setInterval(async () => {
          const statusResult = await refetchStatus();
          if (statusResult.data?.isSetup) {
            clearInterval(pollInterval);
            window.location.href = "/";
          }
        }, 1000); // Poll every second
        
        // Fallback redirect after 10 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          window.location.href = "/";
        }, 10000);
      }
    },
    onError: (error: any) => {
      addDebugInfo(`Installation error: ${error.message}`);
      console.error("Installation failed:", error);
    },
  });

  const handleDatabaseValidation = async () => {
    const databaseUrl = form.getValues("databaseUrl");
    if (!databaseUrl) {
      form.setError("databaseUrl", { message: "Database URL is required" });
      return;
    }

    try {
      const result = await validateDbMutation.mutateAsync(databaseUrl);
      if ((result as any).valid) {
        setCurrentStep(2);
      } else {
        form.setError("databaseUrl", { message: (result as any).error || "Invalid database connection" });
      }
    } catch (error) {
      form.setError("databaseUrl", { message: "Database validation failed" });
    }
  };

  const handleInstallation = async () => {
    const values = form.getValues();
    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      await installMutation.mutateAsync(values);
    } catch (error) {
      console.error("Installation failed:", error);
    }
  };

  if (setupStatus?.isSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Setup Complete</CardTitle>
            <CardDescription>
              Your platform is already configured and ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              Go to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (installationComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Installation Complete!</CardTitle>
            <CardDescription>
              Your MangaVerse platform has been successfully installed and configured.
              Redirecting you to the homepage...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-2">
              You can now log in with your admin credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MangaVerse Setup</h1>
          <p className="text-muted-foreground">
            Welcome! Let's set up your content publishing platform.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Database className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium text-sm">Database</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium text-sm">Admin</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium text-sm">Stripe</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={`flex items-center ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Image className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium text-sm">Branding</span>
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={`flex items-center ${currentStep >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 5 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="ml-2 font-medium text-sm">Install</span>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Step 1: Database Configuration"}
              {currentStep === 2 && "Step 2: Admin Account Setup"}
              {currentStep === 3 && "Step 3: Payment Processing (Optional)"}
              {currentStep === 4 && "Step 4: Site Branding (Optional)"}
              {currentStep === 5 && "Step 5: Installation Confirmation"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Configure your PostgreSQL database connection"}
              {currentStep === 2 && "Create your administrator account"}
              {currentStep === 3 && "Set up Stripe for premium content and payments"}
              {currentStep === 4 && "Upload your logo and customize site appearance"}
              {currentStep === 5 && "Review settings and complete installation"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="databaseUrl">Database URL</Label>
                  <Input
                    id="databaseUrl"
                    data-testid="input-database-url"
                    placeholder="postgresql://username:password@host:port/database"
                    {...form.register("databaseUrl")}
                    className={form.formState.errors.databaseUrl ? "border-destructive" : ""}
                  />
                  {form.formState.errors.databaseUrl && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.databaseUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    data-testid="input-site-name"
                    placeholder="MangaVerse"
                    {...form.register("siteName")}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Need a database?</strong> We recommend using{" "}
                    <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="underline">
                      Neon
                    </a>
                    ,{" "}
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">
                      Supabase
                    </a>
                    , or{" "}
                    <a href="https://planetscale.com" target="_blank" rel="noopener noreferrer" className="underline">
                      PlanetScale
                    </a>{" "}
                    for free PostgreSQL hosting.
                  </AlertDescription>
                </Alert>

                <Button
                  data-testid="button-validate-database"
                  onClick={handleDatabaseValidation}
                  disabled={validateDbMutation.isPending}
                  className="w-full"
                >
                  {validateDbMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating Database...
                    </>
                  ) : (
                    "Validate & Continue"
                  )}
                </Button>

                {validateDbMutation.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Database validation failed. Please check your connection string.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adminUsername">Admin Username</Label>
                  <Input
                    id="adminUsername"
                    data-testid="input-admin-username"
                    placeholder="admin"
                    {...form.register("adminUsername")}
                    className={form.formState.errors.adminUsername ? "border-destructive" : ""}
                  />
                  {form.formState.errors.adminUsername && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.adminUsername.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    data-testid="input-admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    {...form.register("adminEmail")}
                    className={form.formState.errors.adminEmail ? "border-destructive" : ""}
                  />
                  {form.formState.errors.adminEmail && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.adminEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    data-testid="input-admin-password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("adminPassword")}
                    className={form.formState.errors.adminPassword ? "border-destructive" : ""}
                  />
                  {form.formState.errors.adminPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.adminPassword.message}
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This admin account will have full access to manage the platform, 
                    including creator permissions and system settings.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    data-testid="button-continue-to-stripe"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium">Stripe Payment Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable premium content and monetization features
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stripePublicKey">Stripe Publishable Key (Optional)</Label>
                    <Input
                      id="stripePublicKey"
                      placeholder="pk_test_..."
                      {...form.register("stripePublicKey")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Starts with pk_test_ or pk_live_
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key (Optional)</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      placeholder="sk_test_..."
                      {...form.register("stripeSecretKey")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Starts with sk_test_ or sk_live_
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Optional:</strong> You can skip this step and configure Stripe later in the admin panel. 
                    Get your API keys from{" "}
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">
                      Stripe Dashboard
                    </a>
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium">Site Branding</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your platform's appearance
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      {...form.register("logoUrl")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct link to your logo image (PNG, JPG, or SVG)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="faviconUrl">Favicon URL (Optional)</Label>
                    <Input
                      id="faviconUrl"
                      placeholder="https://example.com/favicon.ico"
                      {...form.register("faviconUrl")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct link to your favicon (ICO, PNG, or SVG)
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Optional:</strong> You can skip this step and upload your branding assets later 
                    through the admin panel. Make sure your images are publicly accessible URLs.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(5)}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Installation Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Site Name:</strong> {form.getValues("siteName")}</p>
                    <p><strong>Database:</strong> Connected and validated</p>
                    <p><strong>Admin Username:</strong> {form.getValues("adminUsername")}</p>
                    <p><strong>Admin Email:</strong> {form.getValues("adminEmail")}</p>
                    {form.getValues("stripePublicKey") && (
                      <p><strong>Stripe:</strong> Configured for payments</p>
                    )}
                    {form.getValues("logoUrl") && (
                      <p><strong>Logo:</strong> Custom branding configured</p>
                    )}
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to install! This will create the required database tables, 
                    set up your admin account, and configure the platform.
                  </AlertDescription>
                </Alert>

                {installMutation.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {installMutation.error instanceof Error 
                        ? installMutation.error.message 
                        : "Installation failed. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setCurrentStep(4)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    data-testid="button-install-now"
                    onClick={handleInstallation}
                    disabled={installMutation.isPending}
                    className="flex-1"
                  >
                    {installMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      "Install Now"
                    )}
                  </Button>
                </div>

                {/* Debug Panel */}
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDebug(!showDebug)}
                    className="w-full mb-2"
                  >
                    {showDebug ? "Hide" : "Show"} Debug Info
                  </Button>
                  
                  {showDebug && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            addDebugInfo("Testing simple install endpoint...");
                            try {
                              const response = await fetch("/api/setup/simple-install", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  databaseUrl: form.getValues("databaseUrl"),
                                  adminUsername: form.getValues("adminUsername"),
                                  adminPassword: form.getValues("adminPassword")
                                }),
                              });
                              const text = await response.text();
                              addDebugInfo(`Simple install response: ${response.status} - ${text}`);
                            } catch (e) {
                              addDebugInfo(`Simple install error: ${e}`);
                            }
                          }}
                        >
                          Test Simple Install
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            addDebugInfo("Testing basic test endpoint...");
                            try {
                              const response = await fetch("/api/setup/test-install", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  databaseUrl: form.getValues("databaseUrl"),
                                  adminUsername: form.getValues("adminUsername"),
                                  adminPassword: form.getValues("adminPassword")
                                }),
                              });
                              const text = await response.text();
                              addDebugInfo(`Test install response: ${response.status} - ${text}`);
                            } catch (e) {
                              addDebugInfo(`Test install error: ${e}`);
                            }
                          }}
                        >
                          Test Basic Install
                        </Button>
                      </div>
                      
                      {debugInfo.length > 0 && (
                        <div className="bg-muted p-3 rounded text-xs max-h-40 overflow-y-auto">
                          <div className="font-mono space-y-1">
                            {debugInfo.map((info, index) => (
                              <div key={index} className="text-muted-foreground">
                                {info}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}