import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendBillSplitNotification, calculateParticipantShare } from '@/services/bill-split-notifications';
import { toast } from 'sonner';

export default function BillSplitTest() {
  const [participantEmail, setParticipantEmail] = useState('hassyku786@gmail.com');
  const [participantName, setParticipantName] = useState('John Doe');
  const [poolName, setPoolName] = useState('Dinner Bill');
  const [totalAmount, setTotalAmount] = useState(120.00);
  const [totalParticipants, setTotalParticipants] = useState(3);
  const [addedByName, setAddedByName] = useState('Alice Smith');
  const [loading, setLoading] = useState(false);

  const participantShare = calculateParticipantShare(totalAmount, totalParticipants);

  const handleSendTestNotification = async () => {
    if (!participantEmail || !participantName || !poolName || !totalAmount || !totalParticipants) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await sendBillSplitNotification({
        participantEmail,
        participantName,
        poolName,
        totalAmount: Number(totalAmount),
        participantShare,
        totalParticipants: Number(totalParticipants),
        addedBy: 'test-user-123',
        addedByName,
        currency: 'USD'
      });

      if (result.success) {
        toast.success('Bill split notification sent successfully!');
      } else {
        toast.error(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>💰 Bill Split Notification Test</CardTitle>
          <CardDescription>
            Test the bill split notification system by sending a sample email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="participantEmail">Participant Email</Label>
            <Input
              id="participantEmail"
              type="email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="participant@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="participantName">Participant Name</Label>
            <Input
              id="participantName"
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poolName">Pool Name</Label>
            <Input
              id="poolName"
              type="text"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              placeholder="Dinner Bill"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount ($)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              placeholder="120.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalParticipants">Total Participants</Label>
            <Input
              id="totalParticipants"
              type="number"
              min="1"
              value={totalParticipants}
              onChange={(e) => setTotalParticipants(Number(e.target.value))}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addedByName">Added By</Label>
            <Input
              id="addedByName"
              type="text"
              value={addedByName}
              onChange={(e) => setAddedByName(e.target.value)}
              placeholder="Alice Smith"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Calculated Share:</strong> ${participantShare.toFixed(2)}
            </p>
          </div>

          <Button 
            onClick={handleSendTestNotification}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Bill Split Notification'}
          </Button>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sends a bill split notification email</li>
              <li>Shows the participant their share amount</li>
              <li>Displays payment details and pool information</li>
              <li>Provides action buttons to view the pool</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
