import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  LogIn, LogOut, BedDouble, Wrench, Users, CreditCard, FileText,
  ClipboardCheck, Globe, Search, UserPlus, Printer,
} from 'lucide-react';
import {
  RESERVATIONS, ROOMS, getArrivals, getDepartures, getInHouse,
  getVacantRooms, getOutOfOrder, getThirdPartyBookings,
  type Reservation, type RoomStatus, type PaymentStatus,
} from '@/data/frontDeskMock';
import { ROOM_TYPES, getRoomType } from '@/lib/roomTypes';
import { toast } from 'sonner';
import { FrontDeskChat } from '@/components/frontdesk/FrontDeskChat';

const statusTone: Record<RoomStatus, string> = {
  vacant_clean: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]',
  vacant_dirty: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]',
  occupied: 'bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.3)]',
  out_of_order: 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]',
  maintenance: 'bg-muted text-muted-foreground border-border',
};

const payTone: Record<PaymentStatus, string> = {
  paid: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]',
  unpaid: 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]',
  partial: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]',
  authorized: 'bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.3)]',
};

function KpiCard({ icon: Icon, label, value, tone = 'primary' }: any) {
  return (
    <Card className="p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center bg-[hsl(var(--${tone})/0.1)] text-[hsl(var(--${tone}))] border border-[hsl(var(--${tone})/0.2)]`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold leading-none text-foreground">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
}

function ReservationDetail({ res }: { res: Reservation }) {
  const type = getRoomType(res.typeCode);
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Registration Card · {res.guestName}
          {res.vip && <Badge className="bg-[hsl(var(--primary))] text-primary-foreground">VIP</Badge>}
        </DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Confirmation #" value={res.id} />
        <Field label="Folio #" value={res.folioId} />
        <Field label="Room" value={res.roomNumber ?? '— Unassigned —'} />
        <Field label="Room Type" value={`${res.typeCode} · ${type?.name}`} />
        <Field label="Arrival" value={res.arrival} />
        <Field label="Departure" value={res.departure} />
        <Field label="Nights" value={String(res.nights)} />
        <Field label="Guests" value={`${res.adults} adt · ${res.children} chd`} />
        <Field label="Source" value={res.source.replace('_', ' ').toUpperCase()} />
        <Field label="Status" value={res.status.replace('_', ' ').toUpperCase()} />
        <Field label="Payment" value={`${res.paymentMethod.toUpperCase()} · ${res.paymentStatus.toUpperCase()}`} />
        <Field label="Balance Due" value={`$${res.balance.toFixed(2)}`} />
      </div>
      <div className="border-t border-border pt-3 mt-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Folio Charges</div>
        <table className="pms-table">
          <thead><tr><th>Date</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            <tr><td>{res.arrival}</td><td>Room & Tax — {type?.name}</td><td className="text-right">${res.rate.toFixed(2)}</td></tr>
            {res.nights > 1 && <tr><td>{res.departure}</td><td>Room & Tax × {res.nights - 1}</td><td className="text-right">${(res.rate * (res.nights - 1)).toFixed(2)}</td></tr>}
            <tr><td>{res.arrival}</td><td>Resort Fee</td><td className="text-right">$25.00</td></tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => toast.success('Registration card sent to printer')}>
          <Printer className="w-4 h-4 mr-1.5" /> Print Reg Card
        </Button>
        <Button size="sm" onClick={() => toast.success('Folio posted')}>
          <FileText className="w-4 h-4 mr-1.5" /> View Folio
        </Button>
      </div>
    </DialogContent>
  );
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-medium text-foreground">{value}</div>
  </div>
);

function ResTable({ rows, showRoom = true }: { rows: Reservation[]; showRoom?: boolean }) {
  return (
    <div className="overflow-auto border border-border rounded-md bg-card">
      <table className="pms-table">
        <thead>
          <tr>
            <th>Conf #</th><th>Guest</th>{showRoom && <th>Room</th>}<th>Type</th>
            <th>Arr</th><th>Dep</th><th>Source</th><th>Payment</th><th className="text-right">Balance</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.id}</td>
              <td className="font-medium">{r.guestName}{r.vip && <Badge className="ml-2 bg-[hsl(var(--primary))] text-primary-foreground text-[10px]">VIP</Badge>}</td>
              {showRoom && <td className="font-mono">{r.roomNumber ?? <span className="text-muted-foreground">—</span>}</td>}
              <td><span className="font-mono text-xs px-1.5 py-0.5 bg-muted rounded">{r.typeCode}</span></td>
              <td className="text-xs">{r.arrival}</td>
              <td className="text-xs">{r.departure}</td>
              <td className="text-xs uppercase">{r.source.replace('_', ' ')}</td>
              <td><Badge variant="outline" className={payTone[r.paymentStatus]}>{r.paymentMethod}/{r.paymentStatus}</Badge></td>
              <td className="text-right font-mono">${r.balance.toFixed(2)}</td>
              <td>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost"><FileText className="w-3.5 h-3.5" /></Button>
                  </DialogTrigger>
                  <ReservationDetail res={r} />
                </Dialog>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={showRoom ? 10 : 9} className="text-center py-8 text-muted-foreground">No records</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function FrontDesk() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('arrivals');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const arrivals = getArrivals();
  const departures = getDepartures();
  const inHouse = getInHouse();
  const vacant = getVacantRooms();
  const ooo = getOutOfOrder();
  const thirdParty = getThirdPartyBookings();

  // Availability per room type (vacant_clean + vacant_dirty)
  const availabilityByType = useMemo(() => {
    const map: Record<string, { total: number; available: number }> = {};
    for (const t of ROOM_TYPES) map[t.code] = { total: 0, available: 0 };
    for (const r of ROOMS) {
      if (!map[r.typeCode]) map[r.typeCode] = { total: 0, available: 0 };
      map[r.typeCode].total += 1;
      if (r.status === 'vacant_clean' || r.status === 'vacant_dirty') {
        map[r.typeCode].available += 1;
      }
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    if (!search) return RESERVATIONS;
    const q = search.toLowerCase();
    return RESERVATIONS.filter(r =>
      r.guestName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.roomNumber?.includes(q),
    );
  }, [search]);

  const openAvailableRooms = (code: string) => {
    setTypeFilter(code);
    setTab('rooms');
  };

  const roomsForTab = useMemo(() => {
    if (typeFilter) return ROOMS.filter(r => r.typeCode === typeFilter);
    return ROOMS;
  }, [typeFilter]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">Front Desk</h1>
              <p className="text-sm text-muted-foreground">Property Management · {new Date().toDateString()}</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search guest, conf#, room…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 w-64 bg-card"
                />
              </div>
              <Button onClick={() => toast.success('Walk-in registration started')}>
                <UserPlus className="w-4 h-4 mr-1.5" /> Walk-In
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard icon={LogIn} label="Arrivals" value={arrivals.length} tone="info" />
            <KpiCard icon={LogOut} label="Departures" value={departures.length} tone="primary" />
            <KpiCard icon={Users} label="In-House" value={inHouse.length} tone="success" />
            <KpiCard icon={BedDouble} label="Vacant" value={vacant.length} tone="warning" />
            <KpiCard icon={Wrench} label="OOO / Maint." value={ooo.length} tone="destructive" />
            <KpiCard icon={Globe} label="3rd-Party" value={thirdParty.length} tone="secondary" />
            <KpiCard icon={CreditCard} label="Unpaid" value={RESERVATIONS.filter(r => r.balance > 0).length} tone="destructive" />
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v !== 'rooms') setTypeFilter(null); }}>
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="arrivals">Arrivals · {arrivals.length}</TabsTrigger>
              <TabsTrigger value="inhouse">In-House · {inHouse.length}</TabsTrigger>
              <TabsTrigger value="departures">Departures · {departures.length}</TabsTrigger>
              <TabsTrigger value="rooms">Room Status</TabsTrigger>
              <TabsTrigger value="ooo">OOO / Maintenance · {ooo.length}</TabsTrigger>
              <TabsTrigger value="thirdparty">3rd-Party · {thirdParty.length}</TabsTrigger>
              <TabsTrigger value="types">Room Types</TabsTrigger>
              <TabsTrigger value="all">All Reservations</TabsTrigger>
            </TabsList>

            <TabsContent value="arrivals" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Today's Arrivals</h3>
                <Button size="sm" variant="outline" onClick={() => toast.success('Auto-assigning rooms by type')}>
                  <ClipboardCheck className="w-4 h-4 mr-1.5" /> Auto-Assign Rooms
                </Button>
              </div>
              <ResTable rows={arrivals} />
            </TabsContent>

            <TabsContent value="inhouse" className="mt-4"><ResTable rows={inHouse} /></TabsContent>
            <TabsContent value="departures" className="mt-4"><ResTable rows={departures} /></TabsContent>

            <TabsContent value="rooms" className="mt-4 space-y-3">
              {typeFilter && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Filter: {typeFilter} — {getRoomType(typeFilter)?.name}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setTypeFilter(null)}>Clear filter</Button>
                  <span className="text-muted-foreground text-xs">
                    Showing {roomsForTab.length} rooms ({roomsForTab.filter(r => r.status==='vacant_clean'||r.status==='vacant_dirty').length} available)
                  </span>
                </div>
              )}
              {typeFilter ? (
                <div className="border border-border rounded-md bg-card overflow-auto">
                  <table className="pms-table">
                    <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Condition / Status</th><th>Note</th></tr></thead>
                    <tbody>
                      {roomsForTab.map(r => (
                        <tr key={r.number}>
                          <td className="font-mono font-semibold">{r.number}</td>
                          <td>{r.floor}</td>
                          <td className="font-mono text-xs">{r.typeCode}</td>
                          <td><Badge variant="outline" className={statusTone[r.status]}>{r.status.replace('_',' ')}</Badge></td>
                          <td className="text-muted-foreground text-xs">{r.note ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {ROOMS.map(r => (
                      <div key={r.number}
                          className={`p-2 rounded border text-center ${statusTone[r.status]}`}
                          title={r.note}>
                        <div className="font-mono font-semibold">{r.number}</div>
                        <div className="text-[10px] font-mono opacity-80">{r.typeCode}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs flex-wrap">
                    {(['vacant_clean','vacant_dirty','occupied','out_of_order','maintenance'] as RoomStatus[]).map(s => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded border ${statusTone[s]}`} />
                        <span className="text-muted-foreground">{s.replace('_',' ')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="ooo" className="mt-4">
              <div className="border border-border rounded-md bg-card overflow-auto">
                <table className="pms-table">
                  <thead><tr><th>Room</th><th>Floor</th><th>Type</th><th>Status</th><th>Note</th></tr></thead>
                  <tbody>
                    {ooo.map(r => (
                      <tr key={r.number}>
                        <td className="font-mono font-semibold">{r.number}</td>
                        <td>{r.floor}</td>
                        <td className="font-mono text-xs">{r.typeCode}</td>
                        <td><Badge variant="outline" className={statusTone[r.status]}>{r.status.replace('_',' ')}</Badge></td>
                        <td className="text-muted-foreground">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="thirdparty" className="mt-4"><ResTable rows={thirdParty} /></TabsContent>

            <TabsContent value="types" className="mt-4">
              <div className="border border-border rounded-md bg-card overflow-auto">
                <table className="pms-table">
                  <thead>
                    <tr>
                      <th>Code</th><th>Room Type</th><th>Bed Config</th><th>Max Occ.</th>
                      <th className="text-right">Base Rate</th>
                      <th className="text-center">Available</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROOM_TYPES.map(t => {
                      const a = availabilityByType[t.code] ?? { total: 0, available: 0 };
                      const isOut = a.available === 0;
                      return (
                        <tr key={t.code}>
                          <td><span className="font-mono font-semibold px-2 py-0.5 bg-muted rounded">{t.code}</span></td>
                          <td className="font-medium">
                            {t.name}
                            <span className={`ml-2 text-xs font-mono ${isOut ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                              · {a.available} of {a.total} available
                            </span>
                          </td>
                          <td>{t.beds}</td>
                          <td>{t.maxOccupancy}</td>
                          <td className="text-right font-mono">${t.baseRate}</td>
                          <td className="text-center">
                            <Badge variant="outline" className={isOut
                              ? 'border-destructive/40 text-destructive'
                              : 'border-[hsl(var(--success))]/40 text-[hsl(var(--success))]'}>
                              {a.available}/{a.total}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isOut}
                              onClick={() => openAvailableRooms(t.code)}
                            >
                              View rooms
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-4"><ResTable rows={filtered} /></TabsContent>
          </Tabs>
        </main>
      </div>

      <FrontDeskChat onNavigate={(t) => { setTab(t); if (t !== 'rooms') setTypeFilter(null); }} />
    </div>
  );
}

