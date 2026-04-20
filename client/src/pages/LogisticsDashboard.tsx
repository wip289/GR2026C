import { useEvent } from "@/contexts/EventContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Package, LayoutGrid, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatRupiahShort } from "@/lib/financialPlanner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LogisticsDashboard() {
  const { state } = useEvent();
  const [, navigate] = useLocation();
  const { eventInfo, boothTypes, interviewBooths } = state;

  const hasData = !!eventInfo.eventName;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Belum ada data event</h2>
          <p className="text-muted-foreground mb-6">
            Lengkapi Phase 1 (pilih venue) dan Financial Planner terlebih dahulu.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/phase1")}>Phase 1</Button>
            <Button onClick={() => navigate("/planner")}>Financial Planner</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalBooths = boothTypes.reduce((sum, b) => sum + b.quantity, 0);
  const totalBoothArea = boothTypes.reduce((sum, b) => sum + b.area * b.quantity, 0);
  const totalAllBooths = totalBooths + interviewBooths;

  // Venue utilization — only if we have venue dimensions
  const hasVenueDimensions = eventInfo.venueWidth > 0 && eventInfo.venueLength > 0;
  const effectiveVenueArea = hasVenueDimensions
    ? (eventInfo.venueWidth - 4) * (eventInfo.venueLength - 4) // 2m margin each side
    : eventInfo.venueTotalArea;
  const utilizationPct = effectiveVenueArea > 0
    ? Math.min(100, Math.round((totalBoothArea / effectiveVenueArea) * 100))
    : 0;

  // Resource estimates
  const totalTables = boothTypes.reduce((sum, b) => sum + b.quantity * (b.area >= 20 ? 2 : 1), 0) + interviewBooths * 2;
  const totalChairs = boothTypes.reduce((sum, b) => sum + b.quantity * (b.area >= 20 ? 4 : 2), 0) + interviewBooths * 4;
  const totalOutlets = boothTypes.reduce((sum, b) => sum + b.quantity * (b.area >= 20 ? 4 : 2), 0);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold">Logistics Dashboard</h1>
          </div>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
          </div>
          <p className="text-muted-foreground">{eventInfo.eventName} — manajemen venue, booth &amp; operasional</p>
        </div>

        {/* Venue Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Informasi Venue
            </CardTitle>
            <CardDescription>Data venue dari Phase 1</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Venue</p>
                <p className="font-semibold">{eventInfo.venueName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lokasi</p>
                <p className="font-semibold">{eventInfo.venueLocation || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Durasi Event</p>
                <p className="font-semibold">{eventInfo.eventDuration} hari</p>
              </div>
              {hasVenueDimensions && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dimensi</p>
                    <p className="font-semibold">{eventInfo.venueWidth}m × {eventInfo.venueLength}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Area</p>
                    <p className="font-semibold">{eventInfo.venueTotalArea.toLocaleString('id-ID')} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kapasitas Booth</p>
                    <p className="font-semibold">{eventInfo.venueCapacity} unit (maks)</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Biaya Sewa</p>
                <p className="font-semibold">
                  {eventInfo.venueIsFree
                    ? <span className="text-green-600">Gratis / Disediakan Institusi</span>
                    : formatRupiahShort(eventInfo.venueCost)}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {eventInfo.venueAmenities.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">Fasilitas Venue</p>
                <div className="flex flex-wrap gap-2">
                  {eventInfo.venueAmenities.map((a) => (
                    <span key={a} className="flex items-center gap-1 text-xs bg-secondary px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Venue utilization bar */}
            {hasVenueDimensions && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Utilisasi Ruang Booth</p>
                  <span className={`text-sm font-bold ${utilizationPct > 85 ? 'text-red-600' : utilizationPct > 60 ? 'text-amber-600' : 'text-green-600'}`}>
                    {utilizationPct}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${utilizationPct > 85 ? 'bg-red-500' : utilizationPct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${utilizationPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBoothArea} m² booth dari ~{Math.round(effectiveVenueArea)} m² area efektif venue (setelah margin 2m)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booth Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" /> Konfigurasi Booth
            </CardTitle>
            <CardDescription>
              Total {totalAllBooths} unit — {totalBooths} booth employer + {interviewBooths} booth interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {boothTypes.map((booth) => (
                <div key={booth.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{booth.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {booth.width}m × {booth.height}m = {booth.area}m² per unit
                      </p>
                    </div>
                    <Badge>{booth.quantity} unit</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Harga jual</p>
                      <p className="font-semibold">{formatRupiahShort(booth.sellingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total area</p>
                      <p className="font-semibold">{booth.area * booth.quantity} m²</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Biaya produksi</p>
                      <p className="font-semibold">{formatRupiahShort(booth.productionCostPerBooth)}/unit</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fasilitas</p>
                      <p className="text-xs leading-relaxed">{booth.facilities || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Interview booths */}
              <div className="border border-dashed rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Booth Interview</h3>
                    <p className="text-sm text-muted-foreground">Area khusus sesi wawancara employer–kandidat</p>
                  </div>
                  <Badge variant="outline">{interviewBooths} unit</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Estimasi Kebutuhan Logistik
            </CardTitle>
            <CardDescription>
              Kalkulasi otomatis berdasarkan jumlah dan tipe booth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "Meja",
                  value: `${totalTables} unit`,
                  note: `Booth besar (≥20m²): 2 meja, standar: 1 meja. Interview: 2 meja/booth`,
                },
                {
                  label: "Kursi",
                  value: `${totalChairs} unit`,
                  note: `Booth besar: 4 kursi, standar: 2 kursi. Interview: 4 kursi/booth`,
                },
                {
                  label: "Stop Kontak / Outlet Listrik",
                  value: `${totalOutlets} titik`,
                  note: `Booth besar: 4 outlet, standar: 2 outlet`,
                },
                {
                  label: "Akses WiFi",
                  value: `${totalAllBooths} titik`,
                  note: "Semua booth employer dan interview",
                },
                {
                  label: "Total Booth (semua tipe)",
                  value: `${totalAllBooths} unit`,
                  note: `${totalBooths} employer + ${interviewBooths} interview`,
                },
                {
                  label: "Total Area Booth",
                  value: `${totalBoothArea} m²`,
                  note: "Belum termasuk lorong dan area interview",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.note}</p>
                  </div>
                  <p className="font-bold text-primary text-sm whitespace-nowrap">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Catatan:</strong> Angka di atas adalah estimasi otomatis. Tim logistics perlu konfirmasi ulang
                setelah semua employer konfirmasi dan memilih booth mereka.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
