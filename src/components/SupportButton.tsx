import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SupportButton() {
  const handleClick = () => {
    window.open('https://w.app/dominicfinance', '_blank');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="icon"
            className="h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg transition-transform hover:scale-110 sm:h-12 sm:w-12"
            aria-label="Suporte via WhatsApp"
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Suporte</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
