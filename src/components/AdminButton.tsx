import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function AdminButton() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Only show for admins
  if (!isAdmin) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/admin')}
      className="text-primary hover:text-primary hover:bg-primary/10"
      title="Painel Admin"
    >
      <Shield className="h-4 w-4" />
    </Button>
  );
}
