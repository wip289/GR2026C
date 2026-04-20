import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar, Users, DollarSign, Building2, Zap, TrendingUp, Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function EventDashboardSelector() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch events assigned to the current user
  const { data: events, isLoading, error } = trpc.event.getMyEvents.useQuery(undefined, {
    enabled: !!user,
  });

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.university?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Events</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Events</h1>
              <p className="text-muted-foreground mt-1">
                Welcome, {user?.name}! Select an event to manage.
              </p>
            </div>
            <Button onClick={() => navigate("/phase1")} className="gap-2">
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container py-6 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events by name, client, or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="container py-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try adjusting your search" : "Create your first event to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate("/phase1")}>Create New Event</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userRole={user?.role}
                onSelect={() => navigate(`/event/${event.id}/dashboard`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: any;
  userRole?: string;
  onSelect: () => void;
}

function EventCard({ event, userRole, onSelect }: EventCardProps) {
  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      project_manager: <Users className="w-4 h-4" />,
      finance: <DollarSign className="w-4 h-4" />,
      sponsorship: <TrendingUp className="w-4 h-4" />,
      admin: <Building2 className="w-4 h-4" />,
      logistics: <Zap className="w-4 h-4" />,
      marketing: <TrendingUp className="w-4 h-4" />,
    };
    return icons[role] || <Users className="w-4 h-4" />;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      project_manager: "bg-purple-100 text-purple-800",
      finance: "bg-green-100 text-green-800",
      sponsorship: "bg-blue-100 text-blue-800",
      admin: "bg-orange-100 text-orange-800",
      logistics: "bg-red-100 text-red-800",
      marketing: "bg-pink-100 text-pink-800",
    };
    return colors[userRole || ""] || "bg-gray-100 text-gray-800";
  };

  const eventDate = new Date(event.eventDate);
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{event.name}</CardTitle>
            <CardDescription className="mt-1">
              {event.clientName || event.university}
            </CardDescription>
          </div>
          <Badge className={`${getRoleBadgeColor(userRole || "")} flex gap-1`}>
            {getRoleIcon(userRole || "")}
            <span className="capitalize">{userRole?.replace("_", " ")}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Event Date</p>
            <p className="font-semibold text-sm">
              {eventDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Days Until Event</p>
            <p className={`font-semibold text-sm ${daysUntilEvent <= 7 ? "text-red-600" : ""}`}>
              {daysUntilEvent > 0 ? `${daysUntilEvent} days` : "Today!"}
            </p>
          </div>
        </div>

        {/* Role-Specific Metrics */}
        <div className="pt-2 border-t border-border space-y-2">
          {userRole === "finance" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="font-semibold">
                Rp {event.budget?.toLocaleString("id-ID") || "0"}
              </span>
            </div>
          )}
          {userRole === "sponsorship" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sponsors</span>
              <span className="font-semibold">{event.sponsorCount || 0}</span>
            </div>
          )}
          {userRole === "admin" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Employers</span>
              <span className="font-semibold">{event.employerCount || 0}</span>
            </div>
          )}
          {userRole === "logistics" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Booths</span>
              <span className="font-semibold">{event.boothCount || 0}</span>
            </div>
          )}
          {userRole === "marketing" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reach</span>
              <span className="font-semibold">{event.marketingReach || 0}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button className="w-full mt-4" onClick={onSelect}>
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
