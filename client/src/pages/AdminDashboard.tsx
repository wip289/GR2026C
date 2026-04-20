import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Calendar, Building2 } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Event information and employer registration management</p>
        </div>

        {/* Event Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
            <CardDescription>Current event details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Event Name</p>
                <p className="font-semibold">The International Hospitality & Tourism Grand Recruitment 2026</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Client/University</p>
                <p className="font-semibold">NHI Bandung</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Event Date</p>
                <p className="font-semibold">April 15-16, 2026</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Venue</p>
                <p className="font-semibold">Gedung Graha I Gede Ardika (Dome)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Expected Employers</p>
                <p className="font-semibold">120 companies</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Expected Attendees</p>
                <p className="font-semibold">2,500 students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Employer Registration Status</CardTitle>
            <CardDescription>Track employer registrations and confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Registered</p>
                <p className="text-2xl font-bold text-blue-600">87</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">72</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Booth Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { company: "Tech Solutions", booth: "Main", contact: "hr@techsolutions.com", status: "Confirmed" },
                  { company: "Finance Corp", booth: "Main", contact: "events@financecorp.com", status: "Confirmed" },
                  { company: "Marketing Pro", booth: "Standard", contact: "contact@marketingpro.com", status: "Confirmed" },
                  { company: "HR Innovations", booth: "Standard", contact: "info@hrinnovations.com", status: "Pending" },
                  { company: "Digital Ventures", booth: "Standard", contact: "sponsor@digitalventures.com", status: "Confirmed" },
                ].map((employer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{employer.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{employer.booth}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{employer.contact}</TableCell>
                    <TableCell>
                      <Badge className={employer.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                        {employer.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">Registration Opens</p>
                    <p className="text-xs text-gray-600">March 1, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">Early Bird Deadline</p>
                    <p className="text-xs text-gray-600">March 31, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">Event Date</p>
                    <p className="text-xs text-gray-600">April 15-16, 2026</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Venue Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Venue Name</p>
                  <p className="font-semibold">Gedung Graha I Gede Ardika</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="font-semibold">2,500 attendees</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available Booths</p>
                  <p className="font-semibold">48 total (12 Main + 36 Standard)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
