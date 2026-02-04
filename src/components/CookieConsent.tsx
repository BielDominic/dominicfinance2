import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'dominic-cookie-consent';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] p-4 transition-transform duration-500",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Cookie className="h-6 w-6 text-primary" />
            </div>

            {/* Text */}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                <Cookie className="h-4 w-4 sm:hidden text-primary" />
                Bem-vindo ao Dominic Finance! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Usamos cookies para melhorar sua experiência, salvar suas preferências e manter você logado.
                Ao continuar navegando, você concorda com nossa política de cookies.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecline}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <X className="h-3 w-3 mr-1 sm:mr-2" />
                Recusar
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Check className="h-3 w-3 mr-1 sm:mr-2" />
                Aceitar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
