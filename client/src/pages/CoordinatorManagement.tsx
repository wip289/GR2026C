import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";

type CoordinatorRole = "project_manager" | "finance" | "sponsorship" | "admin" | "logistics" | "marketing";

const ROLE_COLORS: Record<CoordinatorRole, string> = {
  project_manager: "bg-blue-100 text-blue-800",
  finance: "bg-green-100 text-green-800",
  sponsorship: "bg-purple-100 text-purple-800",
  admin: "bg-orange-100 text-orange-800",
  logistics: "bg-red-100 text-red-800",
  marketing: "bg-pink-100 text-pink-800",
};

const ROLE_LABELS: Record<CoordinatorRole, string> = {
  project_manager: "Project Manager",
  finance: "Finance",
  sponsorship: "Sponsorship",
  admin: "Admin",
  logistics: "Logistics",
  marketing: "Marketing",
};

export default function CoordinatorManagement() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<number | null>(null);
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");
  const [newCoordinatorRole, setNewCoordinatorRole] = useState<CoordinatorRole>("admin");
  const [newCoordinatorPhone, setNewCoordinatorPhone] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ id: number; name: string | null; email: string | null } | null | undefined>(undefined);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Fetch events
  const { data: events, isLoading: eventsLoading } = trpc.event.getMyEvents.useQuery();

  // Fetch coordinators for selected event
  const { data: coordinators, isLoading: coordinatorsLoading } = trpc.event.getCoordinators.useQuery(
    { eventId: eventId || 0 },
    { enabled: !!eventId }
  );

  // Add coordinator mutation
  const addCoordinatorMutation = trpc.event.addCoordinator.useMutation({
    onSuccess: () => {
      toast.success("Coordinator added successfully!");
      setNewCoordinatorEmail("");
      setNewCoordinatorPhone("");
      setNewCoordinatorRole("admin");
      setIsOpen(false);
      // Refetch coordinators
      if (eventId) {
        trpc.useUtils().event.getCoordinators.invalidate({ eventId });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add coordinator");
    },
  });

  // Lookup user by email before adding
  const handleEmailBlur = async () => {
    if (!newCoordinatorEmail || !newCoordinatorEmail.includes("@")) return;
    setIsLookingUp(true);
    setLookupResult(undefined);
    try {
      const result = await trpc.event.getUserByEmail.query({ email: newCoordinatorEmail });
      setLookupResult(result);
    } catch {
      setLookupResult(undefined);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddCoordinator = () => {
    if (!eventId || !newCoordinatorEmail || !newCoordinatorRole) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!lookupResult) {
      toast.error("User dengan email ini tidak ditemukan di sistem. Pastikan mereka sudah pernah login terlebih dahulu.");
      return;
    }
    addCoordinatorMutation.mutate({
      eventId,
      userId: lookupResult.id,
      coordinatorRole: newCoordinatorRole,
      email: newCoordinatorEmail,
      phone: newCoordinatorPhone || undefined,
    });
  };

  // Only Project Managers can manage coordinators
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">Only Project Managers can manage coordinators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Coordinator Management</h1>
          </div>
          <p className="text-gray-600">Manage team members and assign roles for your events</p>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>Choose an event to manage its coordinators</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={eventId?.toString() || ""} onValueChange={(val) => setEventId(parseInt(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {eventsLoading ? (
                  <SelectItem value="" disabled>
                    Loading events...
                  </SelectItem>
                ) : events && events.length > 0 ? (
                  events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.name} - {event.clientName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No events found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Coordinators List */}
        {eventId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Coordinators assigned to this event</CardDescription>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Coordinator
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Coordinator</DialogTitle>
                    <DialogDescription>Assign a team member to this event with a specific role</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="coordinator@example.com"
                        value={newCoordinatorEmail}
                        onChange={(e) => { setNewCoordinatorEmail(e.target.value); setLookupResult(undefined); }}
                        onBlur={handleEmailBlur}
                      />
                      {isLookingUp && (
                        <p className="text-xs text-muted-foreground mt-1">Mencari user...</p>
                      )}
                      {lookupResult !== undefined && !isLookingUp && (
                        lookupResult
                          ? <p className="text-xs text-green-600 mt-1">✓ Ditemukan: <strong>{lookupResult.name || lookupResult.email}</strong></p>
                          : <p className="text-xs text-red-500 mt-1">✗ Email tidak ditemukan. User harus login ke sistem terlebih dahulu.</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select value={newCoordinatorRole} onValueChange={(value) => setNewCoordinatorRole(value as CoordinatorRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone (Optional)</label>
                      <Input
                        type="tel"
                        placeholder="+62 812 3456 7890"
                        value={newCoordinatorPhone}
                        onChange={(e) => setNewCoordinatorPhone(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddCoordinator} disabled={addCoordinatorMutation.isPending} className="w-full">
                      {addCoordinatorMutation.isPending ? "Adding..." : "Add Coordinator"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {coordinatorsLoading ? (
                <p className="text-gray-500">Loading coordinators...</p>
              ) : coordinators && coordinators.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coordinators.map((coordinator: any) => (
                      <TableRow key={coordinator.id}>
                        <TableCell>{coordinator.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge className={ROLE_COLORS[coordinator.coordinatorRole as CoordinatorRole]}>
                            {ROLE_LABELS[coordinator.coordinatorRole as CoordinatorRole]}
                          </Badge>
                        </TableCell>
                        <TableCell>{coordinator.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{coordinator.status || "active"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500">No coordinators assigned yet. Add one to get started!</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
