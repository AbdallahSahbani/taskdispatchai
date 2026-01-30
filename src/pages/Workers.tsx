import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useDispatchState } from '@/hooks/useDispatchState';
import { dispatchApi } from '@/lib/api';
import { Worker, Zone } from '@/types/dispatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RefreshCw, Check, MapPin, Wifi, WifiOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  room_service: 'Room Service',
};

export default function Workers() {
  const { workers, zones, loading, refetch } = useDispatchState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<Record<number, boolean>>({});
  const [synced, setSynced] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newRole, setNewRole] = useState<string>('housekeeping');

  const displayWorkers: (Worker & { dbId: number })[] = useMemo(() => workers.map((w) => ({
    id: String(w.id),
    dbId: w.id,
    name: w.name,
    role: w.role as Worker['role'],
    onShift: w.on_shift,
    currentZoneId: w.worker_state?.current_zone || '',
    deviceStatus: (w.worker_state?.device_online ? 'online' : 'offline') as Worker['deviceStatus'],
    reliabilityScore: w.reliability_score,
  })), [workers]);

  const displayZones: Zone[] = useMemo(() => zones.map((z) => ({
    id: z.id,
    name: z.name,
    neighbors: [],
    travelTimeToNeighbor: {},
  })), [zones]);

  const handleCreateWorker = async () => {
    if (!newName.trim() || !newEmployeeId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setCreating(true);
    try {
      await dispatchApi.createWorker(newName.trim(), newRole, newEmployeeId.trim());
      toast.success(`Employee ${newName} added successfully`);
      setNewName('');
      setNewEmployeeId('');
      setNewRole('housekeeping');
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to add employee');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSyncWorker = async (workerId: number) => {
    setSyncing((prev) => ({ ...prev, [workerId]: true }));
    setSynced((prev) => ({ ...prev, [workerId]: false }));
    
    try {
      // Simulate app sync by sending a heartbeat/wifi update
      await dispatchApi.syncWorker(workerId);
      setSynced((prev) => ({ ...prev, [workerId]: true }));
      toast.success('App synced successfully');
      
      // Clear the green check after 3 seconds
      setTimeout(() => {
        setSynced((prev) => ({ ...prev, [workerId]: false }));
      }, 3000);
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing((prev) => ({ ...prev, [workerId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">Workers</h1>
                <p className="text-muted-foreground mt-1">
                  Manage employees and app sync status
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        placeholder="EMP-001"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Smith"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="room_service">Room Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreateWorker}
                      disabled={creating}
                      className="w-full gap-2"
                    >
                      {creating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add Employee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="data-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">App Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayWorkers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No employees found. Add your first employee to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayWorkers.map((worker) => {
                      const zone = displayZones.find((z) => z.id === worker.currentZoneId);
                      const isSyncing = syncing[worker.dbId];
                      const isSynced = synced[worker.dbId];
                      
                      return (
                        <TableRow key={worker.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs">
                                {worker.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{worker.name}</div>
                                <div className="text-xs text-muted-foreground">ID: {worker.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{roleLabels[worker.role]}</span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                worker.onShift
                                  ? 'bg-status-completed/10 text-status-completed'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {worker.onShift ? 'On Shift' : 'Off Shift'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{zone?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {worker.deviceStatus === 'online' ? (
                              <div className="flex items-center gap-1 text-status-completed">
                                <Wifi className="w-4 h-4" />
                                <span className="text-xs">Online</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <WifiOff className="w-4 h-4" />
                                <span className="text-xs">Offline</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={isSynced ? 'outline' : 'secondary'}
                              size="sm"
                              onClick={() => handleSyncWorker(worker.dbId)}
                              disabled={isSyncing}
                              className={cn(
                                'gap-2 min-w-[100px]',
                                isSynced && 'border-status-completed text-status-completed'
                              )}
                            >
                              {isSyncing ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Syncing
                                </>
                              ) : isSynced ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Synced
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3" />
                                  Sync App
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
