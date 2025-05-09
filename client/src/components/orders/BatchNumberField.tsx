import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BatchNumberFieldProps {
  orderType: 'production' | 'refining';
  value: string;
  onChange: (value: string) => void;
}

const BatchNumberField: React.FC<BatchNumberFieldProps> = ({
  orderType,
  value,
  onChange
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateBatchNumber();
  }, [orderType]);

  const generateBatchNumber = async () => {
    setIsLoading(true);
    
    try {
      // Try to get the latest batch number from the API
      const response = await fetch(`/api/orders/latest-batch?type=${orderType}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.newBatchNumber) {
          onChange(data.newBatchNumber);
        } else {
          // Fallback if no newBatchNumber is provided
          const prefix = orderType === 'production' ? 'PROD-' : 'REF-';
          onChange(`${prefix}${Math.floor(100000 + Math.random() * 900000)}`);
        }
      } else {
        // Fallback if API call fails
        const prefix = orderType === 'production' ? 'PROD-' : 'REF-';
        onChange(`${prefix}${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);
      
      // Fallback if there's an exception
      const prefix = orderType === 'production' ? 'PROD-' : 'REF-';
      onChange(`${prefix}${Math.floor(100000 + Math.random() * 900000)}`);
      
      toast({
        title: 'Warning',
        description: 'Could not get the latest batch number. Generated a random one instead.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="batchNumber">Batch Number</Label>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={generateBatchNumber}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          id="batchNumber"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Batch Number"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        The batch number can be edited if needed, and will continue from the last used number.
      </p>
    </div>
  );
};

export default BatchNumberField;