import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coins, 
  CreditCard, 
  Check, 
  Star, 
  Zap, 
  Crown,
  Gift,
  History,
  ArrowRight
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface CoinPackage {
  id: string;
  amount: number;
  price: number;
  bonus: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'purchase' | 'spend';
  description: string;
  createdAt: string;
}

const coinPackages: CoinPackage[] = [
  { id: 'starter', amount: 100, price: 0.99, bonus: 0 },
  { id: 'basic', amount: 500, price: 4.99, bonus: 50, popular: true },
  { id: 'premium', amount: 1000, price: 9.99, bonus: 150 },
  { id: 'deluxe', amount: 2500, price: 19.99, bonus: 500, bestValue: true },
  { id: 'ultimate', amount: 5000, price: 39.99, bonus: 1500 },
  { id: 'legendary', amount: 10000, price: 69.99, bonus: 3000 },
];

export default function CoinsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Load Stripe.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId) {
      // Confirm payment with backend
      apiRequest('POST', '/api/coins/confirm-payment', { sessionId })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            toast({
              title: "Payment Successful!",
              description: `You've received ${data.coinAmount} coins!`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
          }
        })
        .catch(error => {
          toast({
            title: "Payment Error",
            description: "There was an issue confirming your payment.",
            variant: "destructive",
          });
        })
        .finally(() => {
          // Clean up URL
          window.history.replaceState({}, '', '/coins');
        });
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/coins');
    }
  }, [toast]);

  // Fetch transaction history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/user/transactions'],
    enabled: isAuthenticated,
  });

  // Purchase coins mutation with real Stripe integration
  const purchaseCoinsMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const selectedPkg = coinPackages.find(pkg => pkg.id === packageId);
      if (!selectedPkg) throw new Error('Package not found');

      // Create Stripe checkout session
      const response = await apiRequest('POST', '/api/coins/create-checkout-session', {
        packageId,
        amount: selectedPkg.price,
        coinAmount: selectedPkg.amount + selectedPkg.bonus,
      });
      
      const { sessionId } = await response.json();
      
      // Load Stripe.js and redirect to checkout
      const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
      toast({
        title: "Purchase Successful!",
        description: `You've received ${data.coinAmount} coins!`,
      });
      setSelectedPackage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = async (packageId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase coins",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPackage(packageId);
    purchaseCoinsMutation.mutate(packageId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Please log in to purchase coins and unlock premium content.
            </p>
            <Button asChild className="w-full">
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Purchase Coins</h1>
          </div>
          <p className="text-muted-foreground">
            Unlock premium chapters and support your favorite creators
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Balance & Info */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {user?.coinBalance?.toLocaleString() || 0}
                </div>
                <p className="text-sm text-muted-foreground">coins available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Why Buy Coins?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                    <Crown className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Premium Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Access exclusive chapters and early releases
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                    <Star className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Support Creators</h4>
                    <p className="text-sm text-muted-foreground">
                      Help creators earn from their work
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                    <Zap className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">No Ads</h4>
                    <p className="text-sm text-muted-foreground">
                      Enjoy uninterrupted reading experience
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coin Packages */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Choose Your Package</h2>
              <p className="text-muted-foreground">All packages include bonus coins</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {coinPackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    pkg.popular ? 'ring-2 ring-primary' : ''
                  } ${
                    pkg.bestValue ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => handlePurchase(pkg.id)}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  {pkg.bestValue && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                      Best Value
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">
                      {(pkg.amount + pkg.bonus).toLocaleString()}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {pkg.amount.toLocaleString()} + {pkg.bonus} bonus coins
                    </p>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-4">
                    <div className="text-3xl font-bold">${pkg.price}</div>
                    
                    <Button 
                      className="w-full" 
                      disabled={purchaseCoinsMutation.isPending && selectedPackage === pkg.id}
                    >
                      {purchaseCoinsMutation.isPending && selectedPackage === pkg.id ? (
                        <>
                          <CreditCard className="w-4 h-4 mr-2 animate-pulse" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                    
                    {pkg.bonus > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        +{pkg.bonus} bonus coins!
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.type === 'purchase' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {transaction.type === 'purchase' ? (
                                <Coins className="w-4 h-4 text-green-600" />
                              ) : (
                                <Crown className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.type === 'purchase' ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount} coins
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${(transaction.amount * 0.01).toFixed(2)} USD
                            </p>
                          </div>
                        </div>
                        {index < transactions.length - 1 && index < 9 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                    {transactions.length > 10 && (
                      <Button variant="ghost" className="w-full mt-4">
                        View All Transactions
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your purchase history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}